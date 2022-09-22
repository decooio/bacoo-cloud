export const CONSTANTS = {
    TRIAL_STORAGE_SIZE_KEY: 'TRIAL_STORAGE_SIZE',  // Byte
    TRIAL_DOWNLOAD_SIZE_KEY: 'TRIAL_DOWNLOAD_SIZE',  // Byte
    TRIAL_PERIOD_KEY: 'TRIAL_PERIOD'  // Month
}

export const ResponseMessage = {
    STORAGE_EXPIRE: '存储计划已到期，请更新存储计划。',
    STORAGE_MORE_THEN_MAX: '大于当前存储计划的使用容量上限。如需继续上传，请更新存储计划。',
    NO_AUTH_TO_ACCESS: '身份验证异常',
    FILE_IN_BLACKLIST: '非法文件',
    DOWNLOAD_EXPIRE: '下载计划已到期，请更新下载计划。',
    DOWNLOAD_MORE_THEN_MAX: '大于当前下载计划的使用容量上限。如需继续下载，请更新下载计划。',
    DOWNLOAD_INVALID_CID: '无效的CID',
    SERVER_ERR: '服务器响应异常',
    OLD_PASSWORD_NOT_MATCH: '旧密码错误',
    MOBILE_EXIST: '手机号已存在',
}
