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
import {UserOem, UserRoles} from "../type/user";
import {generateChainAccount} from "../util/chainUtils";
import {UserApiKey} from "../dao/UserApiKey";
import {BillingOrder} from "../dao/BillingOrder";
import {CONFIGS} from "../config";
import {CONSTANTS} from "../constant";
import {Config} from "../dao/Config";
const dayjs = require("dayjs");
import {BillingPlan} from "../dao/BillingPlan";
import {redis} from "../util/redisUtils";
import {sendVerifyEmail} from "../util/emailUtils";
export const router = express.Router();

function verifyCacheKey(mobile: string): string {
    return `VERIFY_MOBILE::${mobile}`;
}

function smsCacheKey(mobile: string): string {
    return `SMS_MOBILE::${mobile}`;
}

function emailCacheKey(email: string): string {
    return `EMAIL::VERIFY::${email}`
}

router.get('/verify/svg', validate([
    query('mobile').isMobilePhone('zh-CN').withMessage('手机号有误'),
]),async (req: any, res) => {
    const captcha = svgCaptcha.create();
    await redis.set(verifyCacheKey(req.query.mobile), captcha.text,'EX', 5 * 60);
    res.send(captcha.data);
});

router.post('/verify/sms', validate([
    body('mobile').isMobilePhone('zh-CN').withMessage('手机号有误'),
    body('verifyCode').isString().withMessage('验证码有误')
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
                CommonResponse.badRequest('手机号有误').send(res);
                return;
            }
        }
        const code = randomNumber(6);
        await redis.set(smsCacheKey(req.body.mobile), code,'EX', 5 * 60);
        await sendVerifySms(req.body.mobile, code);
        CommonResponse.success().send(res);
    } else {
        CommonResponse.badRequest('验证码有误').send(res);
    }
});

router.post('/reset/password', validate([
    body('password').isLength({min: 6, max: 16}).withMessage('密码有误'),
    body('mobile').isMobilePhone('zh-CN').withMessage('手机号有误'),
    body('smsCode').isLength({max: 6, min: 6}).withMessage('短信验证码有误'),
    body('smsCode').custom(async (value, {req}) => {
        const smsCode = await redis.get(smsCacheKey(req.body.mobile));
        if (value !== smsCode) {
            throw Error('短信验证码有误');
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
       CommonResponse.badRequest('手机号有误').send(res);
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

router.post('/verify/email', validate([
    body('email').isEmail().withMessage('邮箱格式有误'),
]), async (req, res) => {
    const email = req.body.email;
    const cacheKey = Buffer.from(md5(email)).toString('utf8');
    const code = randomNumber(6);
    await sendVerifyEmail(email, code);
    await redis.set(emailCacheKey(cacheKey), code,'EX', 5 * 60);
    CommonResponse.success().send(res);
})

router.post('/login', validate([
    body('username').isString().withMessage('用户名有误'),
    body('password').isString().withMessage('密码有误')
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
            user = await User.model.findOne({
                where: {
                    email: req.body.username,
                    password: cryptoPassword(req.body.password),
                }
            });
            if (_.isEmpty(user)) {
                CommonResponse.badRequest('用户名密码有误').send(res);
                return;
            }
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
        body('username').isLength({min: 4, max: 32}).withMessage('请输入4-32位用户名'),
        body('username').custom(async (value, {req}) => {
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    nick_name: value
                }
            }))) {
                throw new Error('用户名已存在');
            }
        }),
        body('password').isLength({min: 6, max: 16}).withMessage('请输入4-16位密码'),
        body('mobile').isMobilePhone('zh-CN').withMessage('手机号不符合要求'),
        body('mobile').custom(async (value, {req}) => {
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    mobile: value
                }
            }))) {
                throw new Error('手机号已注册');
            }
        }),
        body('email').isEmail().withMessage('邮箱格式有误'),
        body('email').custom(async (value, {req}) => {
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    email: value
                }
            }))) {
                throw new Error('邮箱已注册');
            }
        }),
        body('emailCode').isLength({max: 6, min: 6}).withMessage('邮箱验证码有误'),
        body('emailCode').custom(async (value, {req}) => {
            const code = await redis.get(emailCacheKey(Buffer.from(md5(req.body.email)).toString('utf8')));
            if (value !== code) {
                throw Error('邮箱验证码有误');
            }
            return true;
        }),
        body('smsCode').isLength({max: 6, min: 6}).withMessage('短信验证码有误'),
        body('smsCode').custom(async (value, {req}) => {
            const smsCode = await redis.get(smsCacheKey(req.body.mobile));
            if (value !== smsCode) {
                throw Error('短信验证码有误');
            }
            return true;
        }),
        body('oem').optional().isLength({max: 16, min: 1}).withMessage('第三方名称长度限制为1~16'),
    ]),
    async (req: any, res) => {
    // Generate amount on Crust
    const { seed, address, signature } = await generateChainAccount();
    const keys = await Config.queryConfigs(CONSTANTS.TRIAL_STORAGE_SIZE_KEY, CONSTANTS.TRIAL_DOWNLOAD_SIZE_KEY, CONSTANTS.TRIAL_PERIOD_KEY);
    await sequelize.transaction(async (transaction: Transaction) => {
        const user = await User.model.create({
            nick_name: req.body.username,
            mobile: req.body.mobile,
            email: req.body.email,
            password: cryptoPassword(req.body.password),
            role: UserRoles.user,
            third_party: _.isEmpty(req.body.oem) ? UserOem.common : req.body.oem
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


