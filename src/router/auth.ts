import * as express from "express";
import {CommonResponse} from "../type/common";
import {UserApiKey} from "../dao/UserApiKey";
import {User} from "../dao/User";
import {BillingPlan} from "../dao/BillingPlan";
import {BillingOrder} from "../dao/BillingOrder";
import {BillingOrderType} from "../type/order";
const dayjs = require("dayjs");
import {Op} from "sequelize";
import * as _ from "lodash";
import {validate} from "../middleware/validator";
import {body, param} from "express-validator";
import {cryptoPassword} from "../util/commonUtils";
import {Gateway} from "../dao/Gateway";
import { Tickets } from "../dao/Tickets";

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
            storageExpireTime: dayjs(userPlan.storageExpireTime).format('YYYY-MM-DD HH:mm:ss'),
            downloadExpireTime: dayjs(userPlan.downloadExpireTime).format('YYYY-MM-DD HH:mm:ss'),
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

router.get('/gateway/list', async (req: any, res) => {
    CommonResponse.success(await Gateway.queryGatewayByUserId(req.userId)).send(res);
})

router.get('/tickets/list', async (req: any, res) => {
    CommonResponse.success(await Tickets.selectTicketListByUserId(req.userId)).send(res);
})

router.get('/tickets/info', async (req: any, res) => {
    CommonResponse.success(await Tickets.selectTicketByUserIdAndRequestId(req.userId,req.id)).send(res);
})

router.post('/tickets/report/:userId',validate([
      body('description').isString().notEmpty().withMessage('description not empty'),
      body('feedback').isString().notEmpty().withMessage('feedback not empty'),
      body('type').optional().isInt(),
      param('userId').isString().notEmpty(),
    ]),async (req, res) => {
       const maxId: number = await Tickets.model.max('id');
       await Tickets.model.create({
           type: req.body.type,
           ticket_no: dayjs().format('YYYY-MM-DD')+ '-' + req.body.type + '-' + (maxId + 1),
           user_id: req.params.userId,
           status: 0,
           description: req.body.description,
           feedback: req.body.feedback,
       });
    CommonResponse.success().send(res);
    }
);

