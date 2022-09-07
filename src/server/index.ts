import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
require('express-async-errors');
import {logger} from "../util/logUtil";
import {CommonResponse} from "../type/common";
import {router as common} from "../router/common";
import {router as authRouter} from "../router/auth";
import {router as adminRouter} from "../router/admin";
import {router as gatewayRouter} from "../router/gateway";
import {admin, auth, gateway} from "../middleware/auth";
import { sendMarkdown } from '../util/dingtalk';

export const serverStart = async (port: string | number) => {
    const app = express();
    app.use(cors({
        origin:true,
        credentials: true
    }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use('/ping', (req, res) => {
        CommonResponse.success().send(res);
    });
    app.enable('trust proxy');
    app.use('/common', common);
    app.use('/auth', auth, authRouter);
    app.use('/admin', auth, admin, adminRouter);
    app.use('/gateway', gateway, gatewayRouter);
    app.use((err: any, req: any, res: any, next: any) => {
        logger.error(`Server err: ${err.stack}`)
        logger.error(`Server err: ${err.message}`)
        sendMarkdown('# server err', err.message)
        CommonResponse.serverError('server err').send(res);
    });
    logger.info(`Server start on: ${port}`);
    app.listen(port);
}


