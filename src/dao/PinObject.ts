import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Deleted, Valid} from "../type/common";
export class PinObject {
    static model = sequelize.define(
        'pin_object',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: { type: DataTypes.STRING, allowNull: false },
            request_id: { type: DataTypes.STRING, allowNull: false },
            api_key_id: { type: DataTypes.INTEGER, allowNull: false },
            cid: { type: DataTypes.STRING, allowNull: false },
            info: { type: DataTypes.JSON, allowNull: true },
            meta: { type: DataTypes.JSON, allowNull: true },
            delegates: { type: DataTypes.TEXT, allowNull: true },
            origins: { type: DataTypes.TEXT, allowNull: true },
            deleted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: Deleted.undeleted },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static queryByUserIdAndCid(userId: number, cid: string) {
        return sequelize.query(`SELECT f.file_type, f.file_size from pin_object o join user_api_key a on o.api_key_id = a.id join pin_file f on f.cid = o.cid where a.user_id = ? and o.cid = ? and o.deleted = ?`, {
            replacements: [userId, cid, Deleted.undeleted],
            type: QueryTypes.SELECT
        })
    }
}
