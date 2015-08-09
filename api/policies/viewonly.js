/**
 * Allow any user with view rights user.
 */
module.exports = function (req, res, ok) {

var ev = req.params.id;

if (_.contains(sails.config.admin_email,req.session.passport.user.profile.emails[0].value))
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
            if ((e.codes && _.filter(e.codes,function(c){ return c.uid == req.session.passport.user.id; }).length > 0 && e.publicview) || (_.contains(e.ownedby,req.session.passport.user.id)))
            {
              return ok();
            }
            else
            {
              //check that the user has contributed footage:
              Media.find({event_id:e.id,created_by:req.session.passport.user.id}).exec(function(err,media){
                if (media.length > 0)
                {
                  return ok();
                }
                else
                {
                  req.session.flash = {msg:'No can do, sorry (you are not the owner or a participant of this event).'};
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
