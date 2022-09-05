import * as express from "express";
import {validate} from "../middleware/validator";
import {body, param} from "express-validator";
import {NodeType} from "../type/gateway";
import {CommonResponse, Deleted, Valid} from "../type/common";
import {Gateway} from "../dao/Gateway";
import * as _ from "lodash";
import {User} from "../dao/User";
import {GatewayUser} from "../dao/GatewayUser";
import {BillingOrderType} from "../type/order";
const dayjs = require("dayjs");
import {BillingOrder} from "../dao/BillingOrder";
import sequelize from "../db/mysql";
import {Transaction} from "sequelize";
import {BillingPlan} from "../dao/BillingPlan";
import {CidBlacklist} from "../dao/CidBlacklist";

export const router = express.Router();

router.post('/gateway', validate([
    body('name').isString().isLength({max: 64, min: 1}),
    body('host').isString().isLength({max: 255, min: 1}),
    body('description').isString().isLength({max: 255, min: 1}),
    body('http_password').isString().isLength({max: 64, min: 1}),
    body('node_type').isIn([NodeType.free, NodeType.premium]),
    body('valid').isIn([Valid.valid, Valid.invalid])
]), async (req, res) => {
    await Gateway.model.create({
        name: req.body.name,
        host: req.body.host,
        description: req.body.description,
        node_type: req.body.node_type,
        http_password: req.body.http_password,
        valid: req.body.valid
    })
    CommonResponse.success().send(res);
})

router.post('/gateway/:id/user/:userId', validate([
    param('id').custom(async v => {
        const g = await Gateway.model.findOne({
            attributes: ['id'],
            where: {
                id: v
            }
        });
        if (_.isEmpty(g)) {
            throw new Error('Invalid gateway id')
        }
    }),
    param('userId').custom(async v => {
        const u = await User.model.findOne({
            attributes: ['id'],
            where: {
                id: v
            }
        });
        if (_.isEmpty(u)) {
            throw new Error('Invalid user id')
        }
    }),
]),async (req, res) => {
    await GatewayUser.model.findOrCreate({
        defaults: {
            user_id: req.params.userId,
            gateway_id: req.params.id,
        },
        where: {
            user_id: req.params.userId,
            gateway_id: req.params.id,
        }
    })
    CommonResponse.success().send(res);
})

router.delete('/gateway/:id/user/:userId', validate([
    param('id').custom(async v => {
        const g = await Gateway.model.findOne({
            attributes: ['id'],
            where: {
                id: v
            }
        });
        if (_.isEmpty(g)) {
            throw new Error('Invalid gateway id')
        }
    }),
    param('userId').custom(async v => {
        const u = await User.model.findOne({
            attributes: ['id'],
            where: {
                id: v
            }
        });
        if (_.isEmpty(u)) {
            throw new Error('Invalid user id')
        }
    }),
]),async (req, res) => {
    await GatewayUser.model.destroy({
        where: {
            user_id: req.params.userId,
            gateway_id: req.params.id,
        }
    })
    CommonResponse.success().send(res);
})

router.post('/gateway/:id', async (req, res) => {
    await Gateway.model.update({
        ...req.body
    }, {
        where: {
            id: req.params.id
        }
    })
    CommonResponse.success().send(res);
})


router.post('/user/order', validate([
    body('userId').custom(async v => {
        const u = await User.model.findOne({
            attributes: ['id'],
            where: {
                id: v
            }
        })
        if (_.isEmpty(u)) {
            throw new Error('Invalid user id');
        }
    }),
    body('expireTime').custom(v => {
        if (dayjs(v).isBefore(dayjs())) {
            throw new Error('Expire time must after now')
        }
        return true;
    })
]), async (req, res) => {
    let order = {}, plan = {}
    if((_.isFinite(req.body.storageSize) && req.body.storageSize > 0)) {
        order = {
            ...order,
            storage_size: req.body.storageSize
        };
        plan = {
            ...plan,
            max_storage_size: req.body.storageSize,
            storage_expire_time: req.body.expireTime
        }
    }
    if((_.isFinite(req.body.downloadSize) && req.body.downloadSize > 0)) {
        order = {
            ...order,
            download_size: req.body.downloadSize
        };
        plan = {
            ...plan,
            max_download_size: req.body.downloadSize,
            download_expire_time: req.body.expireTime
        }
    }
    if (!_.isEmpty(order)) {
        await sequelize.transaction(async (transaction: Transaction) => {
            await BillingOrder.model.create({
                ...order,
                user_id: req.body.userId,
                order_type: BillingOrderType.premium,
                expire_time: req.body.expireTime
            }, {
                transaction
            });
            await BillingPlan.model.update(plan, {
                where: {
                  user_id: req.body.userId
                },
                transaction
            });
        });
    }
    CommonResponse.success().send(res);
})

router.post('/cid/defriend/:cid', async (req, res) => {
    await CidBlacklist.model.create({
        cid: req.params.cid,
        deleted: Deleted.undeleted
    },{
        ignoreDuplicates: false,
        updateOnDuplicate: [
            'cid',
            'deleted',
        ],
    });
    CommonResponse.success().send(res);
})

router.post('/cid/free/:cid', async (req, res) => {
    await CidBlacklist.model.update({
        deleted: Deleted.deleted,
    }, {
        where: {
            cid: req.params.cid
        }
    });
    CommonResponse.success().send(res);
})
