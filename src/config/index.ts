export const CONFIGS = {
    common: {
        dev: getEnv('ENV', 'dev') === 'dev',
        project_name: getEnv('PROJECT_NAME', 'bacoo-cloud'),
        cluster: getEnv('CLUSTER', 'true')
    },
    server: {
        port: getEnv('PORT', 3000)
    },
    evolution: {
        schemaTable: 'data_migration',
        location: '../sql',
    },
    mysql: {
        host: getEnv('MYSQL_HOST', 'localhost'),
        port: getEnv('MYSQL_PORT', 23306),
        database: 'bacoo_cloud',
        user: getEnv('MYSQL_USER', 'root'),
        password: getEnv('MYSQL_PASSWORD', 'root'),
    },
    redis: {
        host: getEnv('REDIS_HOST', 'localhost'),
        port: getEnv('REDIS_PORT', 6379),
        password: getEnv('REDIS_PORT', ''),
    },
    sms: {
        secretId: getEnv('SMS_SECRET_ID', ''),
        secretKey: getEnv('SMS_SECRET_KEY', ''),
        SmsSdkAppId: getEnv('SMS_SDK_APP_ID', ''),
        TemplateId: getEnv('SMS_TEMPLATE_ID', ''),
    },
    billing: {
        storage_size: getEnv('DEFAULT_STORAGE_SIZE', 1024 * 1024 * 100),
        download_size: getEnv('DEFAULT_STORAGE_SIZE', 1024 * 1024 * 100),
        expire_period: getEnv('DEFAULT_EXPIRE_PERIOD', 6),
    }
}

function getEnv(key: string, defaultValue: string | number): string | number {
    const result = process.env[key] || defaultValue;
    return typeof defaultValue === 'string' ? result : Number(result);
}
