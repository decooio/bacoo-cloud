import sequelize from '../db/mysql';
import {DataTypes, Sequelize} from "sequelize";
import _ from 'lodash';
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
            stauts: { type: DataTypes.TINYINT, allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: false },
            feedback: { type: DataTypes.TEXT, allowNull: false },
            deleted: { type: DataTypes.TINYINT, allowNull: false },
            create_time: { type: DataTypes.TEXT, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            update_time: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        },
        {
            timestamps: true,
            createdAt: 'create_time',
            updatedAt: 'update_time',
        }
    );

    static selectTicketListByUserId(userId: number){
       return selectTicketListByUserId(userId)
    }

    static selectTicketByUserIdAndRequestId(userId: number,requestId:number){
      return selectTicketsByRequestIdAndUserId(userId,requestId)
   }
}


export class TicketResults {
    count: number;
    results: any[];
}

async function selectTicketListByUserId(userId: number): Promise<any> {
    const count = await selectPinObjectCountByQuery(userId);
    const ticketResults = new TicketResults();
    ticketResults.count = count;
    if (count > 0) {
      const result = sequelize.query(
        'select id,ticket_no as ticketNo,type,status,feedback,description from tickets where is_delete = 0 and user_id = ?',
        [userId]
      );
      ticketResults.results = result;
    } else {
      ticketResults.results = [];
    }
    return ticketResults;
  }
  
function selectPinObjectCountByQuery(userId: number): Promise<number> {
    return sequelize.queryForCount(
      'select count(*) from pin_object where deleted = 0 and user_id = ?',
      [userId]
    );
}

async function selectTicketsByRequestIdAndUserId(
  id: string,
  userId: number
): Promise<any> {
  const result = await sequelize.queryForObj(
    'select ticket_no as ticketNo,type,status,feedback,description,create_time as reportTime from tickets where deleted = 0 and user_id = ? and id = ?',
    [userId, id]
  );
  if (!_.isEmpty(result)) {
    return result;
  } else {
    return null;
  }
}
