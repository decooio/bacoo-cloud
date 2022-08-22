import {CONFIGS} from "../config";

const tencentcloud = require("tencentcloud-sdk-nodejs");
const SmsClient = tencentcloud.sms.v20210111.Client;
const clientConfig = {
    credential: {
        secretId: CONFIGS.sms.secretId,
        secretKey: CONFIGS.sms.secretKey,
    },
    region: "ap-guangzhou",
    profile: {
        httpProfile: {
            endpoint: "sms.tencentcloudapi.com",
        },
    },
};

export async function sendVerifySms(mobile: string, code: string) {
    const client = new SmsClient(clientConfig);
    return client.SendSms({SmsSdkAppId: CONFIGS.sms.SmsSdkAppId,
        PhoneNumberSet: [mobile],
        TemplateId: CONFIGS.sms.TemplateId, SignName: '百工智联工业科技有限公司',
        TemplateParamSet:[code, '5']});
}

