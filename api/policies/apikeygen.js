var uuid = require('node-uuid');

module.exports = function (req, res, ok) {
	//check system api key:
	if (!req.session.CURRENT_API_KEY)
		req.session.CURRENT_API_KEY = uuid.v4();
	res.locals.apikey = req.session.CURRENT_API_KEY;
	
	Utility.getRequestAction(req);
	Log.verbose('pagevisit','visit',{controller:req.options.controller,action:req.options.action,user_id:(req.session.passport)?req.session.passport.user.id:'', params:req.allParams()});

	return ok();
};