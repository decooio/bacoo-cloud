import * as _ from 'lodash';

import {CONFIGS} from "../config";
import { logger } from './logUtil';
const axios = require('axios');
const crypto = require('crypto');

export async function sendMarkdown(title: string,text: string,critical = false) {
  try {
    const time = Date.now();
    const secret = critical
      ? CONFIGS.dingtalk.criticalNotificationSecret
      : CONFIGS.dingtalk.notificationSecret;
    const notificationUrl = critical
      ? CONFIGS.dingtalk.criticalNotificationUrl
      : CONFIGS.dingtalk.notificationUrl;
    const hmacCode = crypto
      .createHmac('sha256', secret)
      .update(`${time}\n${secret}`)
      .digest('base64');
    const sign = encodeURIComponent(hmacCode);
    const url = `${notificationUrl}&timestamp=${time}&sign=${sign}`;

    await axios.request({
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      url,
      data: {
        msgtype: 'markdown',
        markdown: {
          title,
          text: `${text}(${getEnv('ENV', 'dev')})`,
        },
      },
    });
  } catch (error) {
    logger.error(
      `Error sending Dingtalk notification. ${error.message}`,
      error.stack
    );
  }
}

function getEnv(key: string, defaultValue: string | number): string | number {
    const result = process.env[key] || defaultValue;
    return typeof defaultValue === 'string' ? result : Number(result);
}
