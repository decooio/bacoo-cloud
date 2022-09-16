import {logger} from "../util/logUtil";
import {UserApiKey} from "../dao/UserApiKey";
import * as _ from "lodash";
import {CommonResponse, Valid} from "../type/common";
import {cat} from "tencentcloud-sdk-nodejs";
import {hexToU8a, stringToU8a, u8aConcat, u8aToU8a} from "@polkadot/util";
import {signatureVerify} from "@polkadot/util-crypto";
import {User} from "../dao/User";
import {UserRoles} from "../type/user";
import {Gateway} from "../dao/Gateway";
import {NodeType} from "../type/gateway";
import {ResponseMessage} from "../constant";

const VALID_CHAIN_TYPES = ['substrate', 'sub'];
const chainTypeDelimiter = '-';
const pkSigDelimiter = ':';

export async function auth(req: any, res: any, next: any) {
    if (
        !_.includes(req.headers.authorization, 'Basic ') &&
        !_.includes(req.headers.authorization, 'Bearer ')
    ) {
        CommonResponse.unauthorized(ResponseMessage.NO_AUTH_TO_ACCESS).send(res);
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
                req.apiKeyId = apiKey.id;
                next();
                return;
            }
        }
    } catch(e) {
        logger.error(`Decode signature failed: ${e.stack}`);
    }
    CommonResponse.unauthorized(ResponseMessage.NO_AUTH_TO_ACCESS).send(res);
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
        CommonResponse.unauthorized(ResponseMessage.NO_AUTH_TO_ACCESS).send(res);
        return;
    }
    next();
}

export async function gateway(req: any, res: any, next: any) {
    const gatewayId = req.headers['gateway-id'];
    const password = req.headers['gateway-password'];
    if (!_.isEmpty(gatewayId) && !_.isEmpty(password)) {
        const gateway = await Gateway.model.findOne({
            where: {
                id: gatewayId,
                http_password: password,
                valid: Valid.valid
            }
        });
        if (_.isEmpty(gateway)) {
            return CommonResponse.unauthorized(ResponseMessage.NO_AUTH_TO_ACCESS).send(res);
        }
        req.gateway = gateway;
        if (gateway.node_type === NodeType.premium) {
            const gatewayUser = await UserApiKey.queryByGatewayId(gateway.id);
            req.gatewayUser = gatewayUser;
        }
        next();
        return;
    }
    CommonResponse.unauthorized(ResponseMessage.NO_AUTH_TO_ACCESS).send(res);
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
