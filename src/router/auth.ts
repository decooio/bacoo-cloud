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
import {cryptoPassword, queryToObj, randomNumber} from "../util/commonUtils";
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
            'mobile'
        ],
        where: {
            id: req.userId,
        }
    });
    const order = await BillingOrder.model.findOne({
        attributes:['id'],
        where: {
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
            storageExpireTime: dayjs(userPlan.dataValues.storageExpireTime).format('YYYY-MM-DD HH:mm:ss'),
            downloadExpireTime: dayjs(userPlan.dataValues.downloadExpireTime).format('YYYY-MM-DD HH:mm:ss'),
            orderType: _.isEmpty(order) ? BillingOrderType.free : BillingOrderType.premium
        },
    }).send(res);
})

router.post('/password/change', validate([
    body('oldPassword').isLength({max: 16, min: 6}),
    body('newPassword').isLength({max: 16, min: 6}),
]), async (req: any, res) => {
    const user = await User.model.findOne({
        where: {
            id: req.userId,
            password: cryptoPassword(req.body.oldPassword)
        }
    });
    if (_.isEmpty(user)) {
        CommonResponse.badRequest('Invalid old password').send(res);
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
    body('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
    body('mobile').custom(async (mobile, {req}) => {
        const user = await User.model.findOne({
            attributes: ['id'],
            where: {
                mobile
            }
        });
        if (!_.isEmpty(user)) {
            throw new Error('Mobile conflict');
        }
    }),
]), async (req: any, res) => {
    const code = randomNumber(6);
    await redis.set(mobileChangeCacheKey(req.body.mobile), code,'EX', 5 * 60);
    await sendVerifySms(req.body.mobile, code);
    CommonResponse.success().send(res);
})

router.post('/mobile/change', validate([
    body('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
    body('mobile').custom(async (mobile, {req}) => {
        const user = await User.model.findOne({
            attributes: ['id'],
            where: {
                mobile
            }
        });
        if (!_.isEmpty(user) && user.id !== req.userId) {
            throw new Error('Mobile conflict');
        }
    }),
    body('smsCode').isLength({max: 6, min: 6}).withMessage('Invalid sms code'),
    body('smsCode').custom(async (value, {req}) => {
        const smsCode = await redis.get(mobileChangeCacheKey(req.body.mobile));
        if (value !== smsCode) {
            throw Error('Invalid sms code');
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
    query('pageSize').isInt({gt: 0, lt: 1000}).withMessage('pageSize must int and between 1 to 1000'),
    query('pageNum').isInt({gt: 0}).withMessage('pageNum must int and greater then 0'),
]), async (req: any, res) => {
    CommonResponse.success(await Tickets.selectTicketListByUserId(req.userId,req.query.pageNum, req.query.pageSize)).send(res);
})

router.get('/tickets/info/:id', async (req: any, res) => {
    CommonResponse.success(await Tickets.selectTicketByUserIdAndRequestId(req.params.id,req.userId)).send(res);
})

router.post('/tickets/report',validate([
      body('description').isString().notEmpty().withMessage('description not empty'),
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
           user_id: req.userId,
           status: TicketsStatus.committed,
           description: req.body.description
       });
       let content = "# 收到新的工单提醒"+ '\n\n';
       content += '- 用户名：' + queryToObj(user).username + '\n\n';
       content += '- 编号：' + ticketNo + '\n\n';
       content += '- 类型：' + TicketsType[req.body.type] + '\n\n';
       content += '- 描述：' + req.body.description;
   sendMarkdown('# 收到新的工单提醒', content)
    CommonResponse.success().send(res);
    }
);

router.get('/file/list', validate([
    query('pageSize').isInt({gt: 0, lt: 1000}).withMessage('pageSize must int and between 1 to 1000'),
    query('pageNum').isInt({gt: 0}).withMessage('pageNum must int and greater then 0'),
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

router.post('/intention',validate([
    body('storageType').isInt(),
    body('gatewayType').isInt(),
    body('requirment').isString().notEmpty().withMessage('requirment not empty'),
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
        requirement: req.body.requirment,
        user_id: req.userId,
        status: IntentionStatus.unreplied
     });
     let content = "# 收到新的意向提醒"+ '\n\n';
         content += '- 用户名：' + queryToObj(user).username + '\n\n';
         content += '- 偏好存储量：' + Storagetype[req.body.storageType] + '\n\n';
         content += '- 网关：' + GatewayTyoe[req.body.gatewayType] + '\n\n';
         content += '- 需求：' + req.body.requirment;
         console.log("------"+content)
     sendMarkdown('# 收到新的意向', content)
  CommonResponse.success().send(res);
  }
);

router.post('/tickets/feedback/resolved/:id',validate([
    param('id').custom(async v => {
        const g = await Tickets.model.findOne({
            attributes: ['id'],
            where: {
                id: v,
                status: TicketsStatus.replied
            }
        });
        if (_.isEmpty(g)) {
            throw new Error('Invalid operation')
        }
    })
]), async (req, res) => {
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
                status: TicketsStatus.replied
            }
        });
        if (_.isEmpty(g)) {
            throw new Error('Invalid operation')
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
