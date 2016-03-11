/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {
  schema:false,
  attributes: {
  	currentevent:'string'
    
  },

  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('User',newlyInsertedRecord.id);
	  Email.newUser(newlyInsertedRecord);
  	cb();
  },

getlocalcode:function(cb)
  {
  	//return a code unique across all events
  	var done = false;
  	var newcode = '';
  	//find list of codes...
  	User.find().exec(function(err, users) {
		// Do stuff here
		var allcodes = new Array();

		//get all codes:
		_.each(users, function(u)
		{
			allcodes.push(u.localcode);		  	
		});

		while (!done)
	  	{
			newcode = Math.floor((Math.random()*99999)).toString();
			//find list of codes
			if (!_.contains(allcodes,newcode))
				done=true;
		}
		//console.log('newcode: '+newcode);
		cb(newcode);
	});
  }
};
