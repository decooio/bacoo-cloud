import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {BillingOrderType} from "../type/order";
export class BillingOrder {
    static model = sequelize.define(
        'billing_order',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            storage_size: { type: DataTypes.BIGINT, allowNull: false },
            download_size: { type: DataTypes.BIGINT, allowNull: true },
            expire_time: { type: DataTypes.DATE, allowNull: false },
            order_type: { type: DataTypes.TINYINT, allowNull: false, defaultValue: BillingOrderType.free },
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
