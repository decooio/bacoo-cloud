import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
require('express-async-errors');
import * as session from 'express-session';
const RedisStore = require("connect-redis")(session)
import {logger} from "../util/logUtil";
import {CommonResponse} from "../type/common";
import {router as common} from "../router/common";
import {router as authRouter} from "../router/auth";
import {router as adminRouter} from "../router/admin";
import {redis} from "../util/redisUtils";
import {admin, auth} from "../middleware/auth";

export const serverStart = async (port: string | number) => {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use('/ping', (req, res) => {
        CommonResponse.success().send(res);
    });
    app.use(session({
        store: new RedisStore({ client: redis }),
        secret: 'keyboard cat',
        cookie: { maxAge: 1000 * 60 * 5 }
    }));
    app.use('/common', common);
    app.use('/auth', auth, authRouter);
    app.use('/admin', auth, admin, adminRouter);
    app.use((err: any, req: any, res: any, next: any) => {
        logger.error(`Server err: ${err.stack}`)
        logger.error(`Server err: ${err.message}`)
        CommonResponse.serverError('server err').send(res);
    });
    logger.info(`Server start on: ${port}`);
    app.listen(port);
}


