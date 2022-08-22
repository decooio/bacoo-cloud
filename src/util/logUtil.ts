import {createLogger, format, transports} from 'winston';
const DailyRotateFile = require('winston-daily-rotate-file');
import * as _ from 'lodash';
import {CONFIGS} from "../config";

export const defaultLogger = (fileName?: string, moduleId?: string) =>
    createLogger({
        level: CONFIGS.common.dev ? 'debug' : 'info',
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }),
            format.errors({stack: true}),
            format.splat(),
            format.printf(info => {
                const prefix = `${info.timestamp} ${moduleId ? `[${moduleId}]` : ''} [${_.toUpper(info.level)}]`;
                return `${prefix} ${typeof info.message === 'string' ? info.message : JSON.stringify(info.message)}`
            })
        ),
        transports: [
            new transports.Console(),
            new DailyRotateFile({
                filename: `log/${moduleId || 'global'}${CONFIGS.common.cluster ? `/${process.pid}` : ''}/${fileName || CONFIGS.common.project_name}-error-%DATE%.log`,
                datePattern: 'YYYYMMDD',
                zippedArchive: true,
                maxSize: '100m',
                maxFiles: '10',
                level: 'error',
            }),
            new DailyRotateFile({
                filename: `log/${moduleId || 'global'}${CONFIGS.common.cluster ? `/${process.pid}` : ''}/${fileName || CONFIGS.common.project_name}-common-%DATE%.log`,
                datePattern: 'YYYYMMDD',
                zippedArchive: true,
                maxSize: '100m',
                maxFiles: '10',
                level: 'info',
            }),
        ],
    });

export const logger = defaultLogger();
