import sequelize from '../db/mysql';
import {DataTypes, QueryTypes, Sequelize} from "sequelize";
import * as _ from "lodash";
import { Deleted } from '../type/common';
export class Tickets {
    static model = sequelize.define(
        'tickets',
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            ticket_no: { type: DataTypes.STRING, allowNull: false },
            type: { type: DataTypes.TINYINT, allowNull: true },
            status: { type: DataTypes.TINYINT, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: false },
            feedback: { type: DataTypes.TEXT, allowNull: true },
            deleted: { type: DataTypes.TINYINT, allowNull: false, defaultValue: Deleted.undeleted },
            feedback_time: { type: DataTypes.DATE, allowNull: true},
            create_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static selectTicketListByUserId(userId: number,pageNum: number, pageSize: number){
       return selectTicketListByUserId(userId,pageNum,pageSize)
    }
}


export class TicketResults {
    count: number;
    results: any[];
}

async function selectTicketListByUserId(userId: number,pageNum: number, pageSize: number): Promise<any> {
    const count = await selectPinObjectCountByQuery(userId);
    const ticketResults = new TicketResults();
    ticketResults.count = count;
    if (count > 0) {
       const result = await sequelize.query(
          'select id,ticket_no as ticketNo,title,type,status,feedback,description from tickets where deleted = ? and user_id=? ORDER BY create_time DESC LIMIT ?,?',{
          replacements: [Deleted.undeleted,userId, (pageNum - 1) * pageSize, Number(pageSize)],
          type: QueryTypes.SELECT
        });
      ticketResults.results = result;
    } else {
      ticketResults.results = [];
    }
    return ticketResults;
  }
  
  async function selectPinObjectCountByQuery(userId: number): Promise<number> {
   return sequelize
   .query('select count(*) from tickets where deleted = ? and user_id= ?', {
      replacements: [Deleted.undeleted,userId],
      type: QueryTypes.SELECT,
      raw: true
   })
   .then((r: any[]) => {
    if (!_.isEmpty(r)) {
      const res = r[0];
      return res[Object.keys(res)[0]];
    }
  });
}
