/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 module.exports = function (req, res, ok) {

	if (!req.param('id'))
	{
		//req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
		return res.forbidden();
	}

	Edits.findOne({id:req.param('id')}).exec(function(err,edit){
		if (edit)
		{
			Event.findOne(edit.media[0].event_id).exec(function(err,ev){
				if (ev.publicshare || req.session.passport.user)
				{
					return ok();
				}
				else {
					//cant share:
					return res.forbidden();
				}
			});
			//return res.redirect(301, sails.config.S3_TRANSCODE_URL + edit.path);
		}
		else
		{
			return res.forbidden();
		}
	});
};