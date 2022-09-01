import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import {BillingOrderType} from "../type/order";
import * as _ from "lodash";
export class BillingPlan {
    static model = sequelize.define(
        'billing_plan',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            used_storage_size: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            max_storage_size: { type: DataTypes.BIGINT, allowNull: false },
            storage_expire_time: { type: DataTypes.DATE, allowNull: false },
            used_download_size: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            max_download_size: { type: DataTypes.BIGINT, allowNull: false },
            download_expire_time: { type: DataTypes.DATE, allowNull: false },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static async queryBillingPlanByApiKeyId(apiKeyId: number): Promise<any> {
        const result = await sequelize.query(`SELECT b.* from user_api_key a join billing_plan b on a.user_id = b.user_id where a.id = ?`, {
            replacements: [apiKeyId],
            type: QueryTypes.SELECT
        });
        if (!_.isEmpty(result)) {
            return result[0];
        }
        return null;
    }
}
