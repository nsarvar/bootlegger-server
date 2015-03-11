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
						console.log("no event found view page "+lookupid);
						//req.session.flash = {err:"Event not found"};
						return res.redirect('/commission/new');
					}
					//console.log(event);
					event.calcphases();
					res.view({event:event});
				});
	},

	example:function(req,res)
	{
		EventTemplate.findOne(req.params.id).exec(function(err,data){
			res.json(data.shot_types);
		});
	},

	info:function(req,res)
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
			Media.find({event_id:lookupid}).exec(function(err,media)
			{
				var grouped = _.groupBy(media,function(m){
					return m.meta.static_meta.shot;
				});

				_.each(event.eventtype.shot_types,function(t){
					t.footage = grouped[t.id];
				});
				res.json(event);
			});
		});
	},

	new:function(req,res)
	{
		var tys = EventTemplate.find({or:[{user_id:req.session.passport.user.id}, {user_id:null}]}).sort({'user_id':1,'name':1}).exec(function(err,data){

			//lookup events this user has participated in:
			Media.find({created_by:req.session.passport.user.id}).exec(function(err,media)
			{
				var events = _.pluck(media,'event_id');

				Event.find(events).exec(function(err,all)
				{
					res.view({types:data,myevents:all});
				});	

			});
				
		});
	},

	allshots:function(req,res)
	{
		Shot.find({}).exec(function(err,shots){
			res.json(shots);	
		});
	},

	updateshots:function(req,res)
	{
		//update shots and notify people who are connected:
		if (req.param('id'))
		{
			var newshots = req.param('shots');
			//console.log(newshots);

			_.each(newshots,function(d){
				delete d.isnew;
				delete d.footage;
			});

			Event.findOne(req.param('id')).exec(function(err,ev)
			{
				ev.eventtype.shot_types = newshots;
				ev.save(function(err,done)
				{
					sails.eventmanager.updateevent(ev.id);
					res.json({msg:'Event Updated'});
				});
			});
		}
		else
		{
			res.json({msg:'no event specified'},500);
		}
	},

	live:function(req,res)
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
				console.log("no event found view page "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/commission/new');
			}
			//console.log(event);
			event.calcphases();
			res.view({event:event});
		});
	}
};
