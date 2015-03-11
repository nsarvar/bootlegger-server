/**
 * Allow any user with view rights user.
 */
module.exports = function (req, res, ok) {

  var ev = req.session.event || req.params.id || req.session.passport.user.currentevent;
  //console.log(req.session.passport.user.profile.emails[0].value);

  // if (req.session.passport.user)
  // {
  //   //req.session.passport.user.currentevent = ev;
  //   return ok();
  // }
  // else
  // {
if (req.session.passport.user.profile.emails[0].value == sails.config.admin_email)
{
  return ok();
}
else
{
    //console.log(ev);
    if (req.session.passport.user && ev !=undefined)
    {
      //console.log(req.session.passport.user.id);
      Event.findOne({id:ev}).exec(function (err,e){
        //console.log(e);
        if (e)
        {
            //console.log(e.ownedby + " " + req.session.passport.user.id);
            //console.log(_.filter(e.codes,function(c){ return c.uid == req.session.passport.user.id; }));
            if ((e.codes && _.filter(e.codes,function(c){ return c.uid == req.session.passport.user.id; }).length > 0) || (_.contains(e.ownedby,req.session.passport.user.id)) && e.publicview)
            {
              return ok();
            }
            else
            {
              //check that the user has contributed footage:
              Media.find({event_id:e.id,created_by:req.session.passport.user.id}).exec(function(err,media){
                if (media.length > 0 && e.publicview)
                {
                  return ok();
                }
                else
                {
                  req.session.flash = {msg:'No can do, sorry (you are not the owner or a participant of this event), and the event organiser is not opening footage for everyone.'};
                  return res.redirect('commission/new');
                }
              });

              // if (req.session.isios)
              // {
              //   return ok();
              // }
              // else
              // {
                
              // }
            }
        }
        else
        {
          //no event specified
            req.session.flash = {msg:'No event specified.'};
            return res.redirect('commission/new');
        }
      });
    }
    else
    {
       req.session.flash = {msg:'No can do, sorry (you are not logged in).'};
       return res.redirect('commission/new');
    }
  }
  // }
};