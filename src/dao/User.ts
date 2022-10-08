import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {UserOem, UserRoles} from "../type/user";
export class User {
    static model = sequelize.define(
        'user',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            nick_name: { type: DataTypes.STRING, allowNull: false },
            mobile: { type: DataTypes.STRING, allowNull: false },
            email: { type: DataTypes.STRING, allowNull: true },
            password: { type: DataTypes.STRING, allowNull: false },
            role: { type: DataTypes.TINYINT, allowNull: true, defaultValue: UserRoles.user },
            uuid: { type: DataTypes.STRING, allowNull: true },
            third_party: { type: DataTypes.STRING, allowNull: false, defaultValue: UserOem.common },
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
