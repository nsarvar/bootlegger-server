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
	}

};
