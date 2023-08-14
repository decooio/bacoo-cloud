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

    static queryFilesByApiKeyIdAndPageParams(apiKeyId: number, pageNum: number, pageSize: number) {
        return sequelize.query('SELECT o.cid,o.meta,o.create_time AS createTime,f.file_size AS fileSize,f.file_type AS fileType,o.`name`,w.`host`, w.`id` as hostId FROM pin_object o JOIN pin_object_gateway g ON g.pin_object_id=o.id JOIN gateway w ON w.id=g.gateway_id JOIN pin_file f ON o.cid=f.cid WHERE o.deleted=? AND o.api_key_id=? ORDER BY o.create_time DESC LIMIT ?,?', {
            replacements: [Deleted.undeleted, apiKeyId, (pageNum - 1) * pageSize, Number(pageSize)],
            type: QueryTypes.SELECT
        })
    }

    static queryFilesCountByApiKeyIdAndPageParams(apiKeyId: number) {
        return sequelize.query('SELECT count(*) as fileSize FROM pin_object o JOIN pin_object_gateway g ON g.pin_object_id=o.id JOIN gateway w ON w.id=g.gateway_id JOIN pin_file f ON o.cid=f.cid WHERE o.deleted=? AND o.api_key_id=? ORDER BY o.create_time', {
            replacements: [Deleted.undeleted, apiKeyId],
            type: QueryTypes.SELECT
        })
    }
}
