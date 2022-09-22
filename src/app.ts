import {serverStart} from "./server";
import {CONFIGS} from "./config";
import {dbMigration} from "./migration";
(async () => {
    await dbMigration();
    await serverStart(CONFIGS.server.port);
})()





