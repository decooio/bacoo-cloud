import * as express from 'express';
import {CommonResponse, Valid} from "../type/common";
import {body, query, validationResult} from 'express-validator';
import {validate} from "../middleware/validator";
import {sendVerifySms} from "../util/smsUtils";
import { mnemonicGenerate } from '@polkadot/util-crypto';
import {logger} from "../util/logUtil";
import {User} from "../dao/User";
import * as _ from "lodash";
import sequelize from "../db/mysql";
import {Keyring} from "@polkadot/keyring";
import {Transaction} from "sequelize";
const svgCaptcha = require('svg-captcha');
import crypto from 'crypto';
import {convertShortHash, cryptoPassword, md5, randomNumber} from "../util/commonUtils";
import {UserRoles} from "../type/user";
import {generateChainAccount} from "../util/chainUtils";
import {UserApiKey} from "../dao/UserApiKey";
import {BillingOrder} from "../dao/BillingOrder";
import {CONFIGS} from "../config";
import {CONSTANTS} from "../constant";
import {Config} from "../dao/Config";
const dayjs = require("dayjs");
import {BillingPlan} from "../dao/BillingPlan";
import {redis} from "../util/redisUtils";
export const router = express.Router();

function verifyCacheKey(mobile: string): string {
    return `VERIFY_MOBILE::${mobile}`;
}

function smsCacheKey(mobile: string): string {
    return `SMS_MOBILE::${mobile}`;
}

router.get('/verify/svg', validate([
    query('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
]),async (req: any, res) => {
    const captcha = svgCaptcha.create();
    await redis.set(verifyCacheKey(req.query.mobile), captcha.text,'EX', 5 * 60);
    res.send(captcha.data);
});

router.post('/verify/sms', validate([
    body('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
    body('verifyCode').isString().withMessage('Invalid verifyCode')
]), async (req: any, res) => {
    const result = await redis.get(verifyCacheKey(req.body.mobile));
    if (req.body.verifyCode.toUpperCase() === (result || '').toUpperCase()) {
        if (req.body.resetPassword) {
            const user = await User.model.findOne({
                where: {
                    mobile: req.body.mobile,
                }
            });
            if (_.isEmpty(user)) {
                CommonResponse.badRequest('Invalid mobile').send(res);
                return;
            }
        }
        const code = randomNumber(6);
        await redis.set(smsCacheKey(req.body.mobile), code,'EX', 5 * 60);
        await sendVerifySms(req.body.mobile, code);
        CommonResponse.success().send(res);
    } else {
        CommonResponse.badRequest('Invalid verifyCode').send(res);
    }
});

router.post('/reset/password', validate([
    body('password').isLength({min: 6, max: 16}).withMessage('Invalid password'),
    body('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
    body('smsCode').isLength({max: 6, min: 6}).withMessage('Invalid sms code'),
    body('smsCode').custom(async (value, {req}) => {
        const smsCode = await redis.get(smsCacheKey(req.body.mobile));
        if (value !== smsCode) {
            throw Error('Invalid sms code');
        }
        return true;
    })
]), async (req: any, res) => {
   const user = await User.model.findOne({
        attributes: ['id'],
        where: {
            mobile: req.body.mobile
        }
    });
   if (_.isEmpty(user)) {
       CommonResponse.badRequest('Invalid mobile').send(res);
       return;
   }
   await User.model.update({
       password: cryptoPassword(req.body.password)
   }, {
       where: {
           id: user.id
       }
   });
   CommonResponse.success().send(res);
});

router.post('/login', validate([
    body('username').isString().withMessage('Invalid username'),
    body('password').isString().withMessage('Invalid password')
]), async (req, res) => {
    let user = await User.model.findOne({
        where: {
            nick_name: req.body.username,
            password: cryptoPassword(req.body.password),
        }
    });
    if (_.isEmpty(user)) {
        user = await User.model.findOne({
            where: {
                mobile: req.body.username,
                password: cryptoPassword(req.body.password),
            }
        });
        if (_.isEmpty(user)) {
            CommonResponse.badRequest('Invalid username or password').send(res);
            return;
        }
    }
    const apiKey = await UserApiKey.model.findOne({
        where: {
            user_id: user.id,
            valid: Valid.valid
        },
        order: [
            ['id', 'asc']
        ],
        limit: 1
    });
    const signature = apiKey.signature;
    res.setHeader('Authorization', signature);
    CommonResponse.success({
        address: apiKey.address,
        signature,
        uuid: user.uuid
    }).send(res);
});

router.post('/user',
    validate([
        body('username').isLength({min: 4, max: 32}).withMessage('Invalid username'),
        body('username').custom(async (value, {req}) => {
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    nick_name: value
                }
            }))) {
                throw new Error('Username exist');
            }
        }),
        body('password').isLength({min: 6, max: 16}).withMessage('Invalid password'),
        body('mobile').isMobilePhone('zh-CN').withMessage('Invalid mobile'),
        body('mobile').custom(async (value, {req}) => {
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    mobile: value
                }
            }))) {
                throw new Error('Mobile exist');
            }
        }),
        body('smsCode').isLength({max: 6, min: 6}).withMessage('Invalid sms code'),
        body('smsCode').custom(async (value, {req}) => {
            const smsCode = await redis.get(smsCacheKey(req.body.mobile));
            if (value !== smsCode) {
                throw Error('Invalid sms code');
            }
            return true;
        })
    ]),
    async (req: any, res) => {
    // Generate amount on Crust
    const { seed, address, signature } = await generateChainAccount();
    const keys = await Config.queryConfigs(CONSTANTS.TRIAL_STORAGE_SIZE_KEY, CONSTANTS.TRIAL_DOWNLOAD_SIZE_KEY, CONSTANTS.TRIAL_PERIOD_KEY);
    await sequelize.transaction(async (transaction: Transaction) => {
        const user = await User.model.create({
            nick_name: req.body.username,
            mobile: req.body.mobile,
            password: cryptoPassword(req.body.password),
            role: UserRoles.user
        }, {
            transaction
        });
        const user_id = user.id
        const uuid = convertShortHash(user.id);
        await User.model.update({
            uuid
        }, {
            where: {
                id: user_id
            },
            transaction
        })
        await UserApiKey.model.create({
            user_id,
            seed: Buffer.from(seed).toString('base64'),
            signature,
            address
        },{
            transaction
        })
        const storage_size = keys.get(CONSTANTS.TRIAL_STORAGE_SIZE_KEY) || CONFIGS.billing.storage_size,
            download_size = keys.get(CONSTANTS.TRIAL_DOWNLOAD_SIZE_KEY) || CONFIGS.billing.download_size,
            expire_time = dayjs().add(Number(keys.get(CONSTANTS.TRIAL_PERIOD_KEY) || CONFIGS.billing.expire_period), 'months').format('YYYY-MM-DD HH:mm:ss');
        await BillingOrder.model.create({
            user_id,
            storage_size,
            download_size,
            expire_time
        }, {
            transaction
        })
        await BillingPlan.model.create({
            user_id,
            max_storage_size: storage_size,
            storage_expire_time: expire_time,
            max_download_size: download_size,
            download_expire_time: expire_time,
        }, {
            transaction
        })
        res.setHeader('Authorization', signature);
        CommonResponse.success({
            address,
            signature,
            uuid
        }).send(res);
    })
});


