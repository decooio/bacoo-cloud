import {CONFIGS} from "../config";
const path = require('path');
const Postgrator = require('postgrator');

export const dbMigration = async () => {
    const postgrator = new Postgrator({
        migrationDirectory: path.join(__dirname, CONFIGS.evolution.location),
        schemaTable: CONFIGS.evolution.schemaTable,
        driver: 'mysql2',
        host: CONFIGS.mysql.host,
        port: CONFIGS.mysql.port,
        database: CONFIGS.mysql.database,
        username: CONFIGS.mysql.user,
        password: CONFIGS.mysql.password,
    });
    return postgrator.migrate('max');
}
