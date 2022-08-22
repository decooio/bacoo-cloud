import Redis from "ioredis";
import * as _ from "lodash";
import {CONFIGS} from "../config";
const redisConfig = {
    port: CONFIGS.redis.port as number,
    host: CONFIGS.redis.host as string,
}
export const redis = new Redis(_.isEmpty(CONFIGS.redis.password) ? redisConfig : {
    ...redisConfig,
    password: CONFIGS.redis.password as string
});
