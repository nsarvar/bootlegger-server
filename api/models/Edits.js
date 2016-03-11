/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Media
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var shortId = require('shortid');
module.exports = {
	  attributes: {

  	/* e.g.
  	nickname: 'string'
  	*/

  },

  genlink:function(cb)
  {
  	//return a code unique across all events
  	var done = false;
  	var newcode = '';
  	//find list of codes...
  	Edits.find().exec(function(err, events) {
		// Do stuff here
		var allcodes = new Array();

		//get all codes:
		var allcodes = _.pluck(events, 'shortlink');

		while (!done)
	  	{

			newcode = shortId.generate();
			//find list of codes
			if (!_.contains(allcodes,newcode))
				done=true;
		}
		//console.log('newcode: '+newcode);
		cb(newcode);
	});
},

afterCreate:function(newlyInsertedRecord, cb)
{
	Log.logModel('Edits',{msg:'created',id:newlyInsertedRecord.id});
	cb();
},

};
