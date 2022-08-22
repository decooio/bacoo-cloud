import * as express from 'express';
import {CommonResponse} from "../type/common";
import { body, validationResult } from 'express-validator';
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
import {cryptoPassword, md5} from "../util/commonUtils";
import {UserRoles} from "../type/user";
import {generateChainAccount} from "../util/chainUtils";
import {UserApiKey} from "../dao/UserApiKey";
import {BillingOrder} from "../dao/BillingOrder";
import {CONFIGS} from "../config";
import {CONSTANTS} from "../constant";
import {Config} from "../dao/Config";
const dayjs = require("dayjs");
import {BillingPlan} from "../dao/BillingPlan";
export const router = express.Router();

router.get('/verify/svg', async (req: any, res) => {
    const captcha = svgCaptcha.create();
    req.session.verifyCode = captcha.text;
    logger.info(captcha.text)
    res.send(captcha.data);
});

router.post('/verify/sms', validate([body('mobile').isMobilePhone('zh-CN'), body('verifyCode').isString()]),
    async (req: any, res) => {
    if (req.body.verifyCode === req.session.verifyCode) {
        const code = `${Math.floor(Math.random() * 1000000)}`
        logger.info(`code: ${code}`)
        req.session.smsCode = code;
        req.session.mobile = req.body.mobile;
        await sendVerifySms(req.body.mobile, code);
        CommonResponse.success().send(res);
    } else {
        CommonResponse.badRequest('Invalid verifyCode').send(res);
    }
})

router.post('/user',
    validate([
        body('username').isLength({min: 4, max: 32}),
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
        body('password').isLength({min: 6, max: 16}),
        body('mobile').isMobilePhone('zh-CN'),
        body('mobile').custom(async (value, {req}) => {
            if (req.session.mobile !== value) {
                throw new Error(`Mobile not match`);
            }
            if (!_.isEmpty(await User.model.findOne({
                attributes: ['id'],
                where: {
                    mobile: value
                }
            }))) {
                throw new Error('Mobile exist');
            }
        }),
        body('smsCode').isLength({max: 6, min: 6}),
        body('smsCode').custom((value, {req}) => {
            if (value !== req.session.smsCode) {
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
        await UserApiKey.model.create({
            user_id,
            seed: Buffer.from(seed).toString('base64'),
            signature,
            address
        },{
            transaction
        })
        const storage_size = keys.get(CONSTANTS.TRIAL_STORAGE_SIZE_KEY),
            download_size = keys.get(CONSTANTS.TRIAL_DOWNLOAD_SIZE_KEY),
            expire_time = dayjs().add(Number(keys.get(CONSTANTS.TRIAL_PERIOD_KEY)), 'months').format('YYYY-MM-DD HH:mm:ss');
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
            signature
        }).send(res);
    })
});


