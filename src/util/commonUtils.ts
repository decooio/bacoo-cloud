import { v4 as uuidv4 } from 'uuid';
const crypto = require("crypto");

export function sleep(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

export function uuid(): string {
    return `${uuidv4()}-${new Date().getTime()}`;
}

export function md5(str: string): string {
    const md5Crypto = crypto.createHash('md5');
    return md5Crypto.update(str).digest('hex');
}

export function cryptoPassword(pass: string): string {
    return Buffer.from(md5(pass)).toString('base64');
}
