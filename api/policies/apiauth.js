/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /*
UI Referrer Check (or API check)
*/


function strStartsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
}

var uuid = require('node-uuid');

module.exports = function (req, res, ok) {
	//check header -- if its not from the ui (the right domain), then check against API keys (and increase stats)

	//check api-key:

	if (!req.param('apikey'))
	{
		return res.json(403,{msg:'Please provide an API key'});
	}
	else
	{
		Utility.getRequestAction(req);
		Log.verbose('apiauth','Api Call',{controller:req.options.controller,action:req.options.action,user_id:(req.session.passport && req.session.passport.user)?req.session.passport.user.id:'',apikey:req.param('apikey'), params:req.allParams()});
		
		/**
		 * SYSTEM API KEYS
		 */
		
		//TO CHECK IF ITS THE WEBSITE
		if (req.session.CURRENT_API_KEY == req.param('apikey'))
			return ok();
			
		if (sails.config.CURRENT_EDIT_KEY == req.param('apikey'))
			return ok();

		//TO CHECK IF ITS THE MOBILE APP
		if (sails.config.CURRENT_MOBILE_KEY_IOS == req.param('apikey'))
			return ok();

		if (sails.config.CURRENT_MOBILE_KEY_PLAY == req.param('apikey'))
				return ok();

		if (sails.config.CURRENT_SYNCTRAY_KEY == req.param('apikey'))
			return ok();
			
			
		/**
		 * USER API KEYS
		 */

		User.findOne({'apikey.apikey':req.param('apikey')}).exec(function(error, u){
			//rate limit allowed for api (i.e. registered and agreed to the conditions)
			
			//check if calling to the correct endpoint:
			//console.log(req.path);
			//console.log(strStartsWith(req.path,'/api'));
			
            if (req.path)
			     if (!strStartsWith(req.path,'/api'))
				    return res.json(404,{msg:'Please use endpoints pre-fixed with /api/'})
			
			if (!u)
			{
				return res.json(401,{msg:'Invalid API key'});
			}

			//console.log(req.path);

			if (!req.session.passport.user && req.path!='/api/auth/login')
			{
				return res.json(401,{msg:'You need a valid signed in user for the API'});
			}

			if (u.apikey.apiaccess == 'live')
			{
				return ok();
			}

			else if (u.apikey.apiaccess == 'locked')
			{
				return res.json(403,{msg:'Your API key has been disabled'});
			}
			else if (!u.apikey.apiaccess)
			{
				return res.json(401,{msg:'You have not signed up for an API key. Signup at '+sails.config.master_url + '/api/signup'});
			}
		});
	}
};
