/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var uuid = require('node-uuid');
var rtlDetect = require('rtl-detect');

module.exports = function (req, res, ok) {
	//check system api key:
	
	//console.log("ex locale " + req.getLocale());
	
	
	if (req.getLocale() != req.session.locale)
	{
		req.session.locale = req.getLocale();
	}
	if (req.session.overridelocale)
		req.session.locale = req.session.overridelocale;
	
	req.setLocale(req.session.locale);
	//console.log("set locale "+req.session.locale);
	
	
	
	///i18n code:
	if (rtlDetect.isRtlLang(req.session.locale))
	{
		res.locals.rtl = 'rtl';
	}
	else
	{
		res.locals.rtl = 'ltr';
	}
	
	if (!req.session.CURRENT_API_KEY)
		req.session.CURRENT_API_KEY = uuid.v4();
	res.locals.apikey = req.session.CURRENT_API_KEY;
	
	Utility.getRequestAction(req);
	Log.verbose('pagevisit','visit',{controller:req.options.controller,action:req.options.action,user_id:(req.session.passport && req.session.passport.user)?req.session.passport.user.id:'', params:req.allParams()});

	return ok();
};