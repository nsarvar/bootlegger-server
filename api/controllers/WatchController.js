/**
 * LogController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

	index:function(req,res)
	{
		var lookupid = req.session.event || req.session.passport.user.currentevent;
		//console.log(lookupid);

		//if event is explicitally set in GET
		if (req.params.id)
		{
			lookupid = req.params.id;
		}

		req.session.event = lookupid;

		//event config screen -- module selection for the event
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){
			if (event == undefined)
			{
				//console.log("no event found view page "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/commission/new');
			}
			//console.log(event);
			event.calcphases();
			res.view({event:event,_layoutFile:'../fullscreen.ejs'});
		});
	},

	newedit:function(req,res)
	{
		//process edit:

		//return new edit and shortcode
		// Edit.create({user_id:,path:'test1.mp4'}).exec(function(err,edit)
		// {
		// 	res.json({shortlink:edit.shortlink});
		// });
	},

	shortlink:function(req,res)
	{
		//console.log(req.param('shortlink'));
		if (!req.param('shortlink'))
		{
			req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
			return res.redirect('/');
		}
		
		Edits.findOne({shortlink:req.param('shortlink')}).exec(function(err,edit){
			if (edit && edit.path)
			{
				return res.redirect(301, sails.config.S3_TRANSCODE_URL + edit.path);
			}
			else
			{
				req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
				return res.redirect('/');
			}
		});
	}
};
