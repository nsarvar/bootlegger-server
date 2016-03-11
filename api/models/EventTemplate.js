/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Log
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {
  	user_id:'string'
  	/* e.g.
  	nickname: 'string'
  	*/

  },
  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('EventTemplate',{msg:'created',id:newlyInsertedRecord.id});
  	cb();
  },

};
