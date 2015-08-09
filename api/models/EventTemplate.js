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
