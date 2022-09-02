import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import { Deleted } from '../type/common';
export class CidBlacklist {
    static model = sequelize.define(
        'cid_blacklist',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            cid: { type: DataTypes.STRING, allowNull: false },
            deleted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: Deleted.undeleted },
            create_time: { type: DataTypes.TEXT, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );
}
