import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import _ from 'lodash';
import { Transaction } from 'sequelize';
import { BillingPlan } from '../dao/BillingPlan';
import { PinFile } from '../dao/PinFile';
import { PinObject } from '../dao/PinObject';
import sequelize from '../db/mysql';
import { Deleted } from '../type/common';

export async function deleteByPinObjectId(userId: number, apikeyId: number, pinObjectId: number) {
  const existObj = await PinObject.model.findOne({
    attributes: ['cid', 'deleted'],
    where: { api_key_id: apikeyId, id: pinObjectId },
  });
  if (!_.isEmpty(existObj) && existObj.deleted === Deleted.undeleted) {
    const pinFile = await PinFile.model.findOne({ attributes: ['file_size'], where: { cid: existObj.cid } });
    await sequelize.transaction(async (transaction: Transaction) => {
      await PinObject.model.update(
        { deleted: Deleted.deleted, update_time: dayjs().format('YYYY-MM-DD HH:mm:ss') },
        { where: { id: pinObjectId }, transaction }
      );

      // Add billing_plan lock
      const userPlan = await BillingPlan.model.findOne({
        attributes: ['id', 'used_storage_size'],
        lock: transaction.LOCK.UPDATE,
        where: { user_id: userId },
        transaction,
      });
      await BillingPlan.model.update(
        { used_storage_size: new BigNumber(userPlan.used_storage_size).minus(pinFile.file_size).toString() },
        { where: { user_id: userId }, transaction }
      );
    });
  }
}
