import sequelize from "../db/mysql";
import {DataTypes, Sequelize} from "sequelize";

export class PinObjectGateway {
    static model = sequelize.define(
        'pin_object_gateway',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            pin_object_id: { type: DataTypes.BIGINT, allowNull: false },
            gateway_id: { type: DataTypes.INTEGER, allowNull: false },
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
