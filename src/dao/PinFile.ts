import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Deleted, Valid} from "../type/common";
import {FileType, PinFileAnalysisStatus, PinStatus} from "../type/pinFile";
export class PinFile {
    static model = sequelize.define(
        'pin_file',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            cid: { type: DataTypes.STRING, allowNull: false },
            pin_status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: PinStatus.queued },
            file_type: { type: DataTypes.TINYINT, allowNull: false, defaultValue: FileType.file },
            analysis_status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: PinFileAnalysisStatus.unfinished },
            order_retry_times: { type: DataTypes.STRING, allowNull: false, defaultValue: 0 },
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
}
