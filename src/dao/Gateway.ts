import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import {NodeType} from "../type/gateway";
import {Deleted, Valid} from "../type/common";
export class Gateway {
    static model = sequelize.define(
        'gateway',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            name: { type: DataTypes.STRING, allowNull: false },
            host: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.STRING, allowNull: true },
            node_type: { type: DataTypes.TINYINT, allowNull: false, defaultValue: NodeType.free },
            valid: { type: DataTypes.TINYINT, allowNull: false, defaultValue: Valid.valid },
            http_password: { type: DataTypes.STRING, allowNull: false },
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static async queryGatewayByUserId(userId: number): Promise<any[]> {
        return sequelize.query('SELECT\n' +
            '\tg.`host`,\n' +
            '\tg.node_type as `nodeType` \n' +
            'FROM\n' +
            '\tgateway g\n' +
            '\tLEFT JOIN gateway_user u ON g.id = u.gateway_id \n' +
            'WHERE\n' +
            '\tg.valid = ? \n' +
            '\tAND (\n' +
            '\tg.node_type = ? \n' +
            '\tOR ( g.node_type = ? AND u.user_id = ? ))', {
            replacements: [Valid.valid, NodeType.free, NodeType.premium, userId],
            type: QueryTypes.SELECT
        })
    }
}
