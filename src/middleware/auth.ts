import {logger} from "../util/logUtil";
import {UserApiKey} from "../dao/UserApiKey";
import * as _ from "lodash";
import {CommonResponse, Valid} from "../type/common";
import {cat} from "tencentcloud-sdk-nodejs";
import {hexToU8a, stringToU8a, u8aConcat, u8aToU8a} from "@polkadot/util";
import {signatureVerify} from "@polkadot/util-crypto";
import {User} from "../dao/User";
import {UserRoles} from "../type/user";

const VALID_CHAIN_TYPES = ['substrate', 'sub'];
const chainTypeDelimiter = '-';
const pkSigDelimiter = ':';

export async function auth(req: any, res: any, next: any) {
    if (
        !_.includes(req.headers.authorization, 'Basic ') &&
        !_.includes(req.headers.authorization, 'Bearer ')
    ) {
        CommonResponse.unauthorized('Empty Signature').send(res);
        return;
    }

    try {
        // 2. Decode AuthToken
        const base64Credentials = _.split(
            _.trim(req.headers.authorization),
            ' '
        )[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString(
            'ascii'
        );

        // 3. Parse AuthToken as `ChainType[substrate/eth/solana].PubKey:SignedMsg`
        const [passedAddress, sig] = _.split(credentials, pkSigDelimiter);

        // 4. Extract chain type, default: 'sub' if not specified
        const gaugedAddress = _.includes(passedAddress, chainTypeDelimiter)
            ? passedAddress
            : `sub${chainTypeDelimiter}${passedAddress}`;
        const [chainType, address, txMsg] = _.split(
            gaugedAddress,
            chainTypeDelimiter
        );
        if (_.indexOf(VALID_CHAIN_TYPES, chainType) >= 0 && substrateAuth(address, sig)) {
            req.chainType = chainType;
            req.chainAddress = address;
            logger.info(`Validate chainType: ${chainType} address: ${address} success`);
            const apiKey = await UserApiKey.model.findOne({
                where: {
                    address,
                    valid: Valid.valid
                }
            });
            if (!_.isEmpty(apiKey)) {
                req.userId = apiKey.user_id;
                next();
                return;
            }
        }
    } catch(e) {
        logger.error(`Decode signature failed: ${e.stack}`);
    }
    CommonResponse.unauthorized('Invalid Signature').send(res);
    return;
}

export async function admin(req: any, res: any, next: any) {
    const user = await User.model.findOne({
        where: {
            id: req.userId,
            role: UserRoles.admin
        }
    });
    if (_.isEmpty(user)) {
        CommonResponse.unauthorized("need auth").send(res);
        return;
    }
    next();
}

function substrateAuth(address: string, signature: string): boolean {
    try {
        const message = stringToU8a(address);

        if (signatureVerify(message, hexToU8a(signature), address).isValid) {
            return true;
        }

        const wrappedMessage = u8aConcat(
            u8aToU8a('<Bytes>'),
            message,
            u8aToU8a('</Bytes>')
        );

        return signatureVerify(wrappedMessage, hexToU8a(signature), address)
            .isValid;
    } catch (error) {
    }
    return false;
}
