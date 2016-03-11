/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  var ev = req.param('event') || req.params.id;
  //console.log(req.session.passport.user.profile.emails[0].value);

  //console.log(ev);

  if (req.session.passport.user && _.contains(sails.config.admin_email,req.session.passport.user.profile.emails[0].value))
  {
    //req.session.passport.user.currentevent = ev;
    return ok();
  }
  else
  {
    if (ev)
    {
      //console.log(req.session.passport.user.id);
      Event.find().where({id:ev}).exec(function (err,e){
        //console.log(_.contains(e[0].ownedby,req.session.passport.user.id));
        //console.log(ev);
        if (e.length == 1 && _.contains(e[0].ownedby,req.session.passport.user.id))
        {
          //console.log("ok perm");
          return ok();
        }
        else
        {
          if (req.session.isios)
          {
            return ok();
          }
          else
          {
            if (e.length > 0)
            {
              req.session.flash = {msg:'No can do, sorry (you are not the owner of this event).'};
            }
            //console.log("fail perm");
            return res.redirect('/dashboard');
          }
        }
      });
    }
    else
    {
      return ok();
    }
  }
};
