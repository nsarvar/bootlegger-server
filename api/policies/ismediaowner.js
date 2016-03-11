/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Check media access
 */
module.exports = function (req, res, ok) {
	
	var id = req.param('id');
	var user = req.session.passport.user.id;
	
	if (!id || !user)
		return res.forbidden();
	
	if (req.session.passport && req.session.passport.user && _.contains(sails.config.admin_email,req.session.passport.user.profile.emails[0].value))
	{
		return ok();
	}
	
	Media.findOne(id,function(err,media){
		// console.log(err);
		if (media)
		{
			//if the user created the media:
			if (media.created_by == user)
				return ok();
			
			Event.findOne(media.event_id,function(err,shoot){
				//if the user is admin on the shoot for the media				
				if (_.contains(shoot.ownedby,user))
					return ok();
				else
                    return forbidden();
				
			});
		}
		else
		{
			return res.notFound();
		}
	});
}