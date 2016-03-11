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
var os = require("os");
var uuid = require('node-uuid');
module.exports = {

  attributes: {

  },

  logmore:function(module,o)
  {
    meta = {module:module};
  	sails.winston['info'](module + ':' + o.msg,_.merge(meta,o));
    Log.publishCreate({id:uuid.v4(),message:module + ':' + o.msg,timestamp:new Date(),level:'info',meta:_.merge(meta,o),hostname:os.hostname()});
  },

  log:function(msg)
	{
		sails.winston['info'](msg);
    Log.publishCreate({id:uuid.v4(),message:msg,timestamp:new Date(),level:'info',hostname:os.hostname()});
	},

  logModel:function(model,o)
	{
    meta = {module:model};
		sails.winston['verbose'](model + ' Create',_.merge(meta,o));
    Log.publishCreate({id:uuid.v4(),message:model + ' Create',timestamp:new Date(),level:'info',meta:_.merge(meta,o),hostname:os.hostname()});
	},

  error:function(module,message,meta)
  {
    if (!meta)
      meta = {};
    meta.module = module;
    sails.winston['error'](message,meta);
    Log.publishCreate({id:uuid.v4(),message:message,timestamp:new Date(),level:'error',meta:meta,hostname:os.hostname()});
  },

  info:function(module,message,meta)
  {
    if (!meta)
      meta = {};
    meta.module = module;
    sails.winston['info'](message,meta);
    Log.publishCreate({id:uuid.v4(),message:message,timestamp:new Date(),level:'info',meta:meta,hostname:os.hostname()});
  },

  verbose:function(module,message,meta)
  {
    //console.log(message);
    if (!meta)
      meta = {};
    meta.module = module;
    sails.winston.log('verbose',message,meta);
    Log.publishCreate({id:uuid.v4(),message:message,timestamp:new Date(),level:'verbose',meta:meta,hostname:os.hostname()});
  }
};
