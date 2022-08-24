import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import {UserApiKeyStatus} from "../type/user";
import {Valid} from "../type/common";
export class UserApiKey {
    static model = sequelize.define(
        'user_api_key',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            valid: { type: DataTypes.TINYINT, allowNull: false, defaultValue: UserApiKeyStatus.valid },
            seed: { type: DataTypes.STRING, allowNull: false },
            signature: { type: DataTypes.STRING, allowNull: false },
            address: { type: DataTypes.STRING, allowNull: false },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static queryByGatewayId(gatewayId: number) {
        return sequelize.query('SELECT\n' +
            '\ta.address\n' +
            'FROM\n' +
            '\tgateway_user g\n' +
            '\tJOIN user a ON g.user_id = a.id \n' +
            'WHERE\n' +
            '\tg.gateway_id = ? \n' +
            '\tAND a.valid = ?', {
            replacements: [gatewayId, Valid.valid],
            type: QueryTypes.SELECT
        })
    }
}
