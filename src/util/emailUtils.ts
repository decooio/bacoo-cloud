import {CONFIGS} from "../config";

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    pool: true,
    secure: true,
    host: "smtp.ym.163.com",
    port: 994,
    auth: {
        user: CONFIGS.email.user,
        pass: CONFIGS.email.password,
    },
})


async function sendEmail(to: string, title: string, html: string) {
    const options = {
        from: CONFIGS.email.user,
        to: to,
        subject: title,
        html: html
    }
    await transporter.sendMail(options);
}

export async function sendVerifyEmail(to: string, verifyCode: string) {
    await sendEmail(to, '注册验证', "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n" +
        "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n" +
        "    <head>\n" +
        "        <meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />\n" +
        "        <title></title>\n" +
        "    </head>\n" +
        "    <body>\n" +
        "    【百工智联工业科技有限公司】验证码："+ verifyCode +" ，5分钟内有效，为了保障您的账户安全，请勿向他人泄漏验证码信息"+
        "    </body>\n" +
        "</html>");
}
