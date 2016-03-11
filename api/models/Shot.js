/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 module.exports = {
  schema:false,
  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Shot',{msg:'created',id:newlyInsertedRecord.id});
  	cb();
  },

};
