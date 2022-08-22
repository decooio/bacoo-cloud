import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {UserApiKeyStatus} from "../type/user";
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
}
