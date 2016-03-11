/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  // User is allowed, proceed to controller

  //THIS DOES NOT SEEM TO WORK FOR WEBSOCKET CONNECTIONS
//console.log("auth ses locale " + req.session.locale);
  //console.log(req.session.passport.user);
  if (req.session.passport.user) {
    //console.log("logging in");
    return ok();
  }
  else {// User is not allowed
  	if (req.wantsJSON)
  	{
      //console.log("no in json");
      
    	return res.json(403,{msg:"You are not permitted to perform this action."});
    }
    else
    {
    	req.session.flash = {msg:'No can do, sorry.'};
      //console.log("not authorized");
    	return res.redirect('auth/login');
    }
  }
};