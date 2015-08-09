module.exports = {
  schema:false,
  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Shot',{msg:'created',id:newlyInsertedRecord.id});
  	cb();
  },

};
