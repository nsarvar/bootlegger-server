/**
 * Log
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  attributes: {
  	
  	/* e.g.
  	nickname: 'string'
  	*/
    
  },

  logmore:function(module,o)
  {
  	sails.winston['info'](module,o);
  },



  log:function(msg)
	{
		sails.winston['info'](msg);
	},

  logModel:function(model,o)
	{
		sails.winston['info'](model,o);
	}



};
