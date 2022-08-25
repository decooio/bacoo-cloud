import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Deleted, Valid} from "../type/common";
import {FileType, PinFileAnalysisStatus, PinStatus} from "../type/pinFile";
export class PinFolderFile {
    static model = sequelize.define(
        'pin_folder_file',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            pin_file_id: { type: DataTypes.STRING, allowNull: false },
            cid: { type: DataTypes.STRING, allowNull: false },
            file_size: { type: DataTypes.BIGINT, allowNull: false },
            file_type: { type: DataTypes.TINYINT, allowNull: false, defaultValue: FileType.file },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static queryFolderFileByUserIdAndCid(userId: number, cid: string) {
        return sequelize.query('SELECT\n' +
            '\tf.file_size,\n' +
            '\tf.file_type \n' +
            'FROM\n' +
            '\tpin_folder_file f\n' +
            '\tJOIN pin_file p ON f.pin_file_id = p.id\n' +
            '\tJOIN pin_object o ON o.cid = p.cid\n' +
            '\tJOIN user_api_key k ON k.id = o.api_key_id\n' +
            'WHERE o.deleted = ? and f.cid = ? and k.user_id = ?', {
            replacements: [Deleted.undeleted, cid, userId],
            type: QueryTypes.SELECT
        });
    }
}
