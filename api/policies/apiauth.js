/*
UI Referrer Check (or API check)
*/

var uuid = require('node-uuid');

module.exports = function (req, res, ok) {
	//check header -- if its not from the ui (the right domain), then check against API keys (and increase stats)

	//check api-key:

	//generate system apikey

	//console.log(req.param('apikey'));
	//TEMPORARY: LET EVERYONE THROUGH AS THE MOBILE APP HAS NOT BEEN UPDATED YET:
	//return ok();

	if (!req.param('apikey'))
	{
		return res.json(403,{msg:'Please provide an API key'});
	}
	else
	{
		Utility.getRequestAction(req);
		Log.verbose('apiauth','Api Call',{controller:req.options.controller,action:req.options.action,user_id:(req.session.passport)?req.session.passport.user.id:'',apikey:req.param('apikey'), params:req.allParams()});
		
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

		User.findOne({apikey:req.param('apikey')}).exec(function(error, u){
			//rate limit allowed for api (i.e. registered and agreed to the conditions)
			if (!u)
			{
				return res.json(401,{msg:'Invalid API key'});
			}

			//console.log(req.path);

			if (!req.session.passport.user && req.path!='/api/login')
			{
				return res.json(401,{msg:'You need a valid signed in user for the API'});
			}

			if (u.apiaccess == 'live')
			{
				return ok();
			}

			else if (u.apiaccess == 'locked')
			{
				return res.json(403,{msg:'Your API key has been disabled'});
			}
			else if (!u.apiaccess)
			{
				return res.json(401,{msg:'You have not signed up for an API key. Signup at '+sails.config.master_url + '/api/signup'});
			}
		});
	}
};
