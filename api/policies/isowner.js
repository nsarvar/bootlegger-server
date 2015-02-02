/**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  var ev = req.param('id') || req.session.event;
  //console.log(req.session.passport.user.profile.emails[0].value);

  if (req.session.passport.user && req.session.passport.user.profile.emails[0].value == 'tom@bartindale.com')
  {
    //req.session.passport.user.currentevent = ev;
    return ok();
  }
  else
  {
    if (ev !=undefined)
    {
      //console.log(req.session.passport.user.id);
      Event.find().where({id:ev}).done(function (err,e){
        //console.log(e);
        if (e.length ==1 && _.contains(e[0].ownedby,req.session.passport.user.id))
        {
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
            req.session.flash = {msg:'No can do, sorry (you are not the owner of this event).'};
            return res.redirect('event/new');
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