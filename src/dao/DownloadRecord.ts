import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
export class DownloadRecord {
    static model = sequelize.define(
        'download_record',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            cid: { type: DataTypes.STRING, allowNull: false },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            request_host: { type: DataTypes.STRING, allowNull: false },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: false,
        }
    );
}
