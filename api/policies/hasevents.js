/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

  if (req.session.event || req.params.id) {
    return ok();
  }
  else 
  {// no event set
    //console.log("mobile "+req.session.ismobile);
    if (!req.session.ismobile)
      return res.redirect('/dashboard');
  	else
  	  return ok();
  }
};