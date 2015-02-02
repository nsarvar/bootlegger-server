/**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  if (req.session.event || req.params.id || req.session.passport.user.currentevent) {
    return ok();
  }
  else 
  {// no event set
    //console.log("mobile "+req.session.ismobile);
    if (!req.session.ismobile)
      return res.redirect('/commission/new');
  	else
  	  return ok();
  }
};