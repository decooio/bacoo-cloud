import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {BillingOrderType} from "../type/order";
import * as _ from "lodash";
export class Config {
    static model = sequelize.define(
        'config',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            config_key: { type: DataTypes.STRING, allowNull: false },
            config_value: { type: DataTypes.BIGINT, allowNull: true },
            order_type: { type: DataTypes.DATE, allowNull: false, defaultValue: BillingOrderType.free },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );
    static async queryConfigs(...config_key:string[]): Promise<Map<string, string>> {
        let result = new Map<string, string>();
        if (!_.isEmpty(config_key)) {
            const configs = await this.model.findAll({
                attributes: ['config_key', 'config_value'],
                where: {
                    config_key
                }
            });
            _.forEach(configs, value => {
                result.set(value.config_key, value.config_value);
            })
        }
        return result;
    }
}
