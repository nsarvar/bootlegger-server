var md5 = require('MD5');

module.exports = function(req, res, next) {

//console.log(req);
	if (Utility.getRequestAction(req))
    	res.locals.page = req.options.controller;
    
	if (req.session.passport.user)
	{
		res.locals.user = req.session.passport.user;
		res.locals.user.emailhash = md5(req.session.passport.user.profile.emails[0].value.trim());
	}
	else
	{
		res.locals.user = null;
	}

	//console.log("flash policy for " + res.locals.page);
	//res.locals.dropbox = req.session.passport.dropbox;
	res.locals.localmode = sails.localmode;
	res.locals.inspect = require('util').inspect;

	if (!res.locals.event)
	{
		res.locals.event = {name:''};
	}

	res.locals.notonthisserver = false;
	res.locals.flash = {};

	if (!req.isSocket && !req.session.ismobile)
	{
		//console.log("is socket");
		 if(!req.session.flash) return next();

		 res.locals.flash = _.clone(req.session.flash);

		 // clear flash
		 req.session.flash = {};

		 //sort out the validation messages:
		 if (res.locals.flash.err)
		 {
		 	//console.log(res.locals.flash.err);
		 	var errs = new Array();
		 	if (typeof res.locals.flash.err == 'string' || res.locals.flash.err instanceof String)
		 	{
		 		errs.push({msg:res.locals.flash.err,name:'null'});
		 	}
		 	else
		 	{
		 		_.each(res.locals.flash.err,function(e,k)
			 	{
			 		errs.push({msg:"Please enter a "+k,name:k});
			 	});
		 	}
		 	res.locals.flash.err = errs;
		 }

		 //console.log(res.locals.flash);

	}	
	else 
	{
		res.locals.flash = false;
	}
	return next();
};