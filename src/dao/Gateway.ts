import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Valid} from "../type/common";
export class Gateway {
    static model = sequelize.define(
        'gateway',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: { type: DataTypes.STRING, allowNull: false },
            host: { type: DataTypes.STRING, allowNull: false },
            node_type: { type: DataTypes.TINYINT, allowNull: false, defaultValue: NodeType.free },
            valid: { type: DataTypes.TINYINT, allowNull: false, defaultValue: Valid.valid },
            http_password: { type: DataTypes.STRING, allowNull: false },
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
