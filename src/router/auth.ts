import * as express from "express";
import {CommonResponse, Deleted, Valid} from "../type/common";
import {UserApiKey} from "../dao/UserApiKey";
import {User} from "../dao/User";
import {BillingPlan} from "../dao/BillingPlan";
import {BillingOrder} from "../dao/BillingOrder";
import {BillingOrderType} from "../type/order";
const dayjs = require("dayjs");
import {Op} from "sequelize";
import * as _ from "lodash";
import {validate} from "../middleware/validator";
import {body, param, query} from "express-validator";
import {cryptoPassword, formatTimezone, queryToObj, randomNumber} from "../util/commonUtils";
import {Gateway} from "../dao/Gateway";
import {PinObject} from "../dao/PinObject";
import { Tickets } from "../dao/Tickets";
import {redis} from "../util/redisUtils";
import {sendVerifySms} from "../util/smsUtils";
import { Intention } from "../dao/Intention";
import { TicketsStatus, TicketsType } from "../type/tickets";
import {CidBlacklist} from "../dao/CidBlacklist";
import { GatewayTyoe, IntentionStatus, Storagetype } from "../type/intentiom";
import { sendMarkdown } from "../util/dingtalk";
import {ResponseMessage, ValidateMessage} from "../constant";
import { deleteByPinObjectId } from "../service/pinner";

export const router = express.Router();
router.get('/key/list', async (req: any, res) => {
    const list = await UserApiKey.model.findAll({
        attributes: ['address', 'signature', 'valid'],
        where: {
            user_id: req.userId,
        }
    });
    CommonResponse.success(list).send(res);
});

router.get('/user/profile', async (req: any, res: any) => {
    const user = await User.model.findOne({
        attributes: [
            ['nick_name', 'username'],
            'mobile',
            'email'
        ],
        where: {
            id: req.userId,
        }
    });
    const order = await BillingOrder.model.findOne({
        attributes:['id'],
        where: {
            user_id: req.userId,
            order_type: BillingOrderType.premium,
            expire_time: {
                [Op.gte]: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
        },
        limit: 1
    });
    const userPlan = await BillingPlan.model.findOne({
        attributes: [
          ['used_storage_size', 'usedStorageSize'],
          ['max_storage_size', 'maxStorageSize'],
          ['storage_expire_time', 'storageExpireTime'],
          ['used_download_size', 'usedDownloadSize'],
          ['max_download_size', 'maxDownloadSize'],
          ['download_expire_time', 'downloadExpireTime'],
        ],
        where: {
            user_id: req.userId
        }
    });
    CommonResponse.success({
        info: user,
        plan: {
            ...userPlan.dataValues,
            storageExpireTime: formatTimezone(userPlan.dataValues.storageExpireTime),
            downloadExpireTime: formatTimezone(userPlan.dataValues.downloadExpireTime),
            orderType: _.isEmpty(order) ? BillingOrderType.free : BillingOrderType.premium
        },
    }).send(res);
})

router.post('/password/change', validate([
    body('oldPassword').isLength({max: 16, min: 6}).withMessage(ValidateMessage.PASSWORD_LENGTH_MESSAGE),
    body('newPassword').isLength({max: 16, min: 6}).withMessage(ValidateMessage.PASSWORD_LENGTH_MESSAGE),
]), async (req: any, res) => {
    const user = await User.model.findOne({
        where: {
            id: req.userId,
            password: cryptoPassword(req.body.oldPassword)
        }
    });
    if (_.isEmpty(user)) {
        CommonResponse.badRequest(ResponseMessage.OLD_PASSWORD_NOT_MATCH).send(res);
        return;
    }
    await User.model.update({
        password: cryptoPassword(req.body.newPassword)
    }, {
        where: {
            id: req.userId
        }
    });
    CommonResponse.success().send(res);
})

function mobileChangeCacheKey(mobile: string): string {
    return `SMS_CHANGE_MOBILE::${mobile}`;
}

router.post('/mobile/change/sms', validate([
    body('mobile').isMobilePhone('zh-CN').withMessage(ValidateMessage.INVALID_MOBILE),
    body('mobile').custom(async (mobile, {req}) => {
        const user = await User.model.findOne({
            attributes: ['id'],
            where: {
                mobile
            }
        });
        if (!_.isEmpty(user)) {
            throw new Error(ResponseMessage.MOBILE_EXIST);
        }
    }),
]), async (req: any, res) => {
    const code = randomNumber(6);
    await redis.set(mobileChangeCacheKey(req.body.mobile), code,'EX', 5 * 60);
    await sendVerifySms(req.body.mobile, code);
    CommonResponse.success().send(res);
})

router.post('/mobile/change', validate([
    body('mobile').isMobilePhone('zh-CN').withMessage(ValidateMessage.INVALID_MOBILE),
    body('mobile').custom(async (mobile, {req}) => {
        const user = await User.model.findOne({
            attributes: ['id'],
            where: {
                mobile
            }
        });
        if (!_.isEmpty(user) && user.id !== req.userId) {
            throw new Error(ResponseMessage.MOBILE_EXIST);
        }
    }),
    body('smsCode').isLength({max: 6, min: 6}).withMessage(ValidateMessage.INVALID_CAPTCHA),
    body('smsCode').custom(async (value, {req}) => {
        const smsCode = await redis.get(mobileChangeCacheKey(req.body.mobile));
        if (value !== smsCode) {
            throw Error(ValidateMessage.INVALID_CAPTCHA);
        }
        return true;
    })
]), async (req: any, res) => {
    await User.model.update({
        mobile: req.body.mobile
    }, {
        where: {
            id: req.userId
        }
    });
    CommonResponse.success().send(res);
})

router.get('/gateway/list', async (req: any, res) => {
    CommonResponse.success(await Gateway.queryGatewayByUserId(req.userId)).send(res);
})

router.get('/tickets/list',validate([
    query('pageSize').isInt({gt: 0, lt: 1000}).withMessage('单页数量大于1小于1000'),
    query('pageNum').isInt({gt: 0}).withMessage('页码大于0'),
]), async (req: any, res) => {
    CommonResponse.success(await Tickets.selectTicketListByUserId(req.userId,req.query.pageNum, req.query.pageSize)).send(res);
})

router.get('/tickets/info/:id', async (req: any, res) => {
    const tickets = await Tickets.model.findOne({
        attributes: [
          'type',
          'title',
          'status',
          'feedback',
          'description',
          ['ticket_no', 'ticketNo'],
          ['create_time', 'reportTime'],
          ['feedback_time', 'feedbackTime']
        ],
        where: {
            id: req.params.id
        }
    });
    CommonResponse.success({
        ...tickets.dataValues,
        feedbackTime: formatTimezone(tickets.dataValues.feedbackTime),
        reportTime: formatTimezone(tickets.dataValues.reportTime),
    }).send(res);
})

router.post('/tickets/report',validate([
      body('description').isString().notEmpty().withMessage('description not empty'),
      body('title').isString().notEmpty().withMessage('title not empty'),
      body('type').optional().isInt()
    ]),async (req:any, res) => {
        const user = await User.model.findOne({
            attributes: [
                ['nick_name', 'username']
            ],
            where: {
                id: req.userId,
            }
        });
       const maxId: number = await Tickets.model.max('id');
       const ticketNo = dayjs().format('YYYYMMDD')+ '-' + req.body.type + '-' + (maxId + 1);
       await Tickets.model.create({
           type: req.body.type,
           ticket_no: ticketNo,
           title: req.body.title,
           user_id: req.userId,
           status: TicketsStatus.committed,
           description: req.body.description
       });
       let content = "# 收到新的工单提醒"+ '\n\n';
           content += '- 用户名：' + queryToObj(user).username + '\n\n';
           content += '- 标题：' + req.body.title + '\n\n';
           content += '- 编号：' + ticketNo + '\n\n';
           content += '- 类型：' + TicketsType[req.body.type] + '\n\n';
           content += '- 描述：' + req.body.description;
    await sendMarkdown('# 收到新的工单提醒', content)
    CommonResponse.success().send(res);
    }
);

router.get('/file/list', validate([
    query('pageSize').isInt({gt: 0, lt: 1000}).withMessage('单页数量大于1小于1000'),
    query('pageNum').isInt({gt: 0}).withMessage('页码大于0'),
]), async (req: any, res: any) => {
    const files = await PinObject.queryFilesByApiKeyIdAndPageParams(req.apiKeyId, req.query.pageNum, req.query.pageSize);
    if (!_.isEmpty(files)) {
        const cid = _.map(files, i => i.cid);
        const blackList = await CidBlacklist.model.findAll({
            attributes: ['cid'],
            where: {
                cid,
                deleted: Deleted.undeleted
            }
        });
        const blackListGroup = _.groupBy(blackList, i => i.cid);
        return CommonResponse.success(_.map(files, i => ({
            ...i,
            createTime: formatTimezone(i.createTime),
            valid: _.isEmpty(blackListGroup[i.cid]) ? Valid.valid : Valid.invalid
        }))).send(res);
    }
    CommonResponse.success(files).send(res);
})

router.get('/file/list/size', validate([
]), async (req: any, res: any) => {
    const files = await PinObject.queryFilesCountByApiKeyIdAndPageParams(req.apiKeyId);
    CommonResponse.success((_.head(files) as any).fileSize).send(res);
})

router.post('/file/delete', validate([
    body('id').isInt().notEmpty().withMessage("id不能为空")
]),async (req:any, res) => {
    await deleteByPinObjectId(req.userId, req.apiKeyId, req.body.id)
    CommonResponse.success(true).send(res)
})

router.post('/intention',validate([
    body('storageType').isInt(),
    body('gatewayType').isInt(),
    body('requirement').isString().notEmpty().withMessage('需求不能为空'),
  ]),async (req:any, res) => {
    const user  = await User.model.findOne({
        attributes: [
            ['nick_name', 'username']
        ],
        where: {
            id: req.userId,
        }
    });
     await Intention.model.create({
        storage_type: req.body.storageType,
        gateway_type: req.body.gatewayType,
        requirement: req.body.requirement,
        user_id: req.userId,
        status: IntentionStatus.unreplied
     });
     let content = "# 收到新的意向提醒"+ '\n\n';
         content += '- 用户名：' + queryToObj(user).username + '\n\n';
         content += '- 偏好存储量：' + Storagetype[req.body.storageType] + '\n\n';
         content += '- 网关：' + GatewayTyoe[req.body.gatewayType] + '\n\n';
         content += '- 需求：' + req.body.requirement;
    await sendMarkdown('# 收到新的意向', content)
    CommonResponse.success().send(res);
  }
);

router.post('/tickets/feedback/resolved/:id', async (req, res) => {
    await Tickets.model.update({
           status: TicketsStatus.resolved
    }, {
        where: {
            id: req.params.id
        }
    });
    CommonResponse.success().send(res);
})

router.post('/tickets/feedback/unresolved/:id', validate([
    param('id').custom(async v => {
        const g = await Tickets.model.findOne({
            attributes: ['id'],
            where: {
                id: v,
                status:{
                    [Op.ne]: TicketsStatus.resolved
                }
            }
        });
        if (_.isEmpty(g)) {
            throw new Error('无效的参数')
        }
    })
]),async (req, res) => {
    await Tickets.model.update({
           status: TicketsStatus.unresolved
    }, {
        where: {
            id: req.params.id
        }
    });
    CommonResponse.success().send(res);
})
