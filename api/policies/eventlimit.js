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

  //console.log(req.session.passport.user);
  if (req.session.passport.user) {

    if (req.session.passport.user.nolimit || _.contains(sails.config.admin_email,req.session.passport.user.profile.emails[0].value))
    {
      return ok();
    }
    else
    {
      //console.log(req.session.passport.user.id);
      //results: { $elemMatch: { $gte: 80, $lt: 85 } }
      Event.find({created_by:req.session.passport.user.id}).exec(function (err,evs){

        // var has = _.map(evs,function(ev){
        //   //console.log(ev.ownedby);
        //   if (_.contains(ev.ownedby,req.session.passport.user.id))
        //     return ev;
        // });

        // has = _.compact(has);

        //console.log(has.length);

        if (evs.length < sails.config.SHOOT_LIMIT)
        {
          //console.log("ok to continue");
          return ok();
        }
        else
        {
          req.session.flash = {msg:'You can create up to '+sails.config.SHOOT_LIMIT+' shoots simultaneously using Bootlegger, delete an old shoot to continue.'};
          //console.log("too many events");
          return res.redirect('/dashboard');
        }
      });
    }


  }
  else {// User is not allowed
  	if (req.wantsJSON)
  	{
      //console.log("no in json");
    	return res.send("You are not permitted to perform this action.", 403);
    }
    else
    {
    	req.session.flash = {msg:'No can do, sorry.'};
      //console.log("not authorized");
    	return res.redirect('auth/login');
    }
  }
};
