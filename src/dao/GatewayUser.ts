import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Valid} from "../type/common";
export class GatewayUser {
    static model = sequelize.define(
        'gateway_user',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            gateway_id: { type: DataTypes.INTEGER, allowNull: false },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );
}
