/**
 * LogController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

	index:function(req,res)
	{
		return res.redirect('/event/view');
	},

	subscribe:function(req,res)
	{
		Log.watch(req.socket);
		return res.json({msg:'Subscribed to Log Events'},200);
	},

	getlog:function(req,res)
	{
		var eventid = req.params.id;
		Log.find({'meta.eventid':eventid}).sort('_id DESC').exec(function(err,logs){
			res.json(logs);
		});
	},

	getall:function(req,res)
	{
		Log.find({eventid:null}).sort('_id DESC').exec(function(err,logs){
			res.json(logs);
		});
	},

	all:function(req,res)
	{
		res.view('log/view');
	},

	view:function(req,res)
	{
		//live log:
		var lookupid = req.session.event || req.session.passport.user.currentevent;
		//console.log(lookupid);

		//if event is explicitally set in GET
		if (req.params.id)
		{
			lookupid = req.params.id;
		}

		req.session.event = lookupid;
		Event.findOne(lookupid).exec(function(err,event)
		{
			res.view({event:event});
		})
	},

	click:function(req,res)
	{
		Log.logmore('click',{msg:req.param('page'), userid:req.session.passport.user.id, eventid:req.param('eventid'), event:req.param('event'), extras:req.param('extras')});
	}

};
