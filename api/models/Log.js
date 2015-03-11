/**
 * Log
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {

  },

  logmore:function(module,o)
  {
  	sails.winston['info'](module,o);
  },

  //Log.logmore('marathondirector',{msg:'User signin',userid:user,eventid:event});

  log:function(msg)
	{
		sails.winston['info'](msg);
	},

  logModel:function(model,o)
	{
		sails.winston['info'](model,o);
	}



};
