import * as express from "express";
import {NodeType} from "../type/gateway";
import {CommonResponse, Valid} from "../type/common";
import {UserApiKey} from "../dao/UserApiKey";
import * as _ from "lodash";
import {User} from "../dao/User";
import {PinObject} from "../dao/PinObject";
import sequelize from "../db/mysql";
import {Transaction} from "sequelize";
import {BillingPlan} from "../dao/BillingPlan";
import {FileType} from "../type/pinFile";
import BigNumber from "bignumber.js";
const dayjs = require("dayjs");

export const router = express.Router();

router.get('/verify/upload/:address', async (req: any, res) => {
    const gateway = req.gateway;
    const apiKey = await UserApiKey.model.findOne({
        where: {
            address: req.params.address,
            valid: Valid.valid
        }
    });
    if (_.isEmpty(apiKey)) {
        CommonResponse.badRequest('Invalid api key').send(res);
        return;
    }
    switch (gateway.node_type) {
        case NodeType.free:
            return CommonResponse.success().send(res);
        case NodeType.premium:
            const u = _.find(req.gatewayUser, {'address': req.params.address});
            return (_.isEmpty(u) ? CommonResponse.unauthorized('Need auth') : CommonResponse.success(req.gatewayUser)).send(res);
    }
});

router.get('/verify/download/:uuid/cid/:cid', async (req: any, res) => {
    // query user and file size
    const user = await User.model.findOne({
        attributes: ['id'],
        where: {
            uuid: req.params.uuid
        }
    });
    if (_.isEmpty(user)) {
        CommonResponse.badRequest('Invalid uuid').send(res);
        return;
    }
    const pinFile = await PinObject.queryByUserIdAndCid(user.id, req.params.cid);
    if (!_.isEmpty(pinFile)) {
        // compare download size
        const { file_type, file_size } = pinFile;
        await sequelize.transaction(async (transaction: Transaction) => {
            const userPlan = BillingPlan.model.findOne({
                attributes: ['used_download_size', 'max_download_size', 'download_expire_time'],
                where: {
                    user_id: user.id
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });
            const usedDownloadSize = new BigNumber(userPlan.used_download_size);
            let valid = usedDownloadSize.comparedTo(userPlan.max_download_size) < 0 && dayjs(userPlan.download_expire_time).isAfter(dayjs());
            switch (file_type) {
                case FileType.folder:
                    return (valid ? CommonResponse.success() : CommonResponse.forbidden('Plan overdue')).send(res);
                case FileType.file:
                    const usedSize = usedDownloadSize.plus(file_size);
                    valid = usedSize.comparedTo(userPlan.max_download_size) <= 0;
                    await BillingPlan.model.update({
                        used_download_size: usedSize.toString()
                    }, {
                        where: {
                            user_id: user.id
                        },
                        transaction
                    })
                    return (valid ? CommonResponse.success() : CommonResponse.forbidden('Plan overdue')).send(res);
            }
            return CommonResponse.forbidden('Plan overdue').send(res);
        })
    }
})
