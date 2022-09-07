import { v4 as uuidv4 } from 'uuid';
import BigNumber from "bignumber.js";
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

export function randomNumber(length: number) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result = `${result}${Math.floor(Math.random() * 10)}`
    }
    return result;
}

const START_NUMBER = 7777777;

export function convertShortHash(decNumber: number, minLength: number = 6): string {
    const remStack = new Stack();
    const digits =
        '0123456789abcdefghijklmnopqrstuvwxyz';
    const base = digits.length;
    let number = new BigNumber(decNumber).plus(START_NUMBER).multipliedBy(2).toNumber();
    let rem;
    let baseString = '';

    while (number > 0) {
        rem = Math.floor(number % base);
        remStack.push(rem);
        number = Math.floor(number / base);
    }

    while (!remStack.isEmpty()) {
        baseString += digits[remStack.pop()];
    }
    if (baseString.length >= minLength) {
        return baseString;
    } else {
        let result = '';
        const fillStr = digits.charAt(0);
        for (let i = 0; i < minLength - baseString.length; i++) {
            result = `${fillStr}${result}`;
        }
        return `${result}${baseString}`;
    }
}

class Stack {
    count: number;
    items: any;
    constructor() {
        this.count = 0;
        this.items = {};
    }

    push(element: any) {
        this.items[this.count] = element;
        this.count++;
    }

    pop() {
        if (this.isEmpty()) {
            return undefined;
        }
        this.count--;
        const result = this.items[this.count];
        delete this.items[this.count];
        return result;
    }

    isEmpty() {
        return this.count === 0;
    }

    toString() {
        if (this.isEmpty()) {
            return '';
        }
        let objString = `${this.items[0]}`;
        for (let i = 1; i < this.count; i++) {
            objString = `${objString},${this.items[i]}`;
        }
        return objString;
    }
}

export function queryToObj(queryRes: any) {
    return JSON.parse(JSON.stringify(queryRes));
  }