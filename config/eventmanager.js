//event instance manager
//var Worker = require('webworker-threads').Worker;
//for each event in the system -- have an object in memory
module.exports = {

	event_modules:{},
	post_modules:{},

	init:function(multiserver,cb)
	{
		var fs = require('fs');
		//var _ = require('underscore');
		//load event type modules:
		//for each file in:

		_.each(fs.readdirSync('./api/event_modules'),function(ev)
		{
			var e = require('../api/event_modules/'+ev);

			//console.log(module.exports.event_modules);
			module.exports.event_modules[e.codename] = e;
			module.exports.event_modules[e.codename].init(multiserver);
			Log.info('eventmanager',"Init "+e.codename+ " done.");
			e.longpoll();
			setInterval(function (){
				e.trigger();
			}, 1000);
			setInterval(function (){
				e.longpoll();
			}, 60*1000);
			//console.log(module.exports.event_modules[e.name]);
		});

		_.each(fs.readdirSync('./api/post_modules'),function(ev)
		{
			var e = require('../api/post_modules/'+ev);
			//console.log(e.codename);
			module.exports.post_modules[e.codename] = e;
			module.exports.post_modules[e.codename].init();
			//console.log(module.exports.event_modules[e.name]);
		});

		//create missing zip files for events if they are not already there:
		Log.info('eventmanager',"Generating Zip Files for Events");

		Event.find({}).exec(function(err,events)
        {
			var calls = [];
			_.each(events,function(e)
			{
				calls.push(function(cbb){
					//console.log("doing: "+e.id);
					e.genzip(cbb);
				});
			});
			async.series(calls,function(err)
			{
				Log.info('eventmanager',"Event Zips Created");
			});
		});

		cb();
	},

	module_function:function(m,name,event,req,res)
	{
		if (module.exports.post_modules[m]!=undefined)
		{
			module.exports.post_modules[m][name](event,req,res);
		}
		return;
	},

	post_settings:function(m,event,res)
	{
		if (module.exports.post_modules[m]!=undefined)
		{
			//console.log(module.exports.post_modules[m].settings());
			return module.exports.post_modules[m].settings(event,res);
		}
		else
		{
			//console.log(module.exports.post_modules);
			return "";
		}
	},

	//for when in shooting phase and media gets uploaded
	process:function(req, media)
	{
		//console.log("EVENTID: "+media.event_id);
		//console.log(event_modules);
		//console.log(media);

		Event.findOne(media.event_id).exec(function (err,event) {
			//console.log(event);
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].process(req, media);
				});
			}
		});
	},

	//add event once the system is running
	addevent:function(eventid)
	{
		//console.log(event_modules);
		Event.findOne(eventid).exec(function (err,event) {
			//console.log(event);
			if (err || event == undefined) return;
			event.genzip(function(){

			});
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					//if module enabled for this event...
					//console.log("adding event on "+k);
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].addevent(eventid);
				});
			}
		});
	},

	//for post production phase (can be called whenever you want)
	post:function(media)
	{
		Event.findOne(media.event_id).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.post_modules)
			{
				_.each(event.post_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].post(media);
				});
			}
		});
	},

	signin:function(eventid,user,profile,resub)
	{
		//console.log(eventid);
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
					{
						//console.log("starting signin");
						module.exports.event_modules[k].signin(eventid,user,profile,resub);
					}
				});
			}
		});
		//console.log("finished signin");
	},

	//not sure this will ever get called -- not sure where this event comes from...
	signout:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].signout(eventid,user);
				});
			}
		});
	},

	startrecording:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].startrecording(eventid,user);
				});
			}
		});
	},

	//triggered when user stops recording
	stoprecording:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].stoprecording(eventid,user);
				});
			}
		});
	},

	//triggered when user holds on current shot
	holdrecording:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].holdrecording(eventid,user);
				});
			}
		});
	},

	//triggered when user asks to skip
	skiprecording:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].skiprecording(eventid,user);
				});
			}
		});
	},

	//triggered when user asks to skip
	chooserole:function(res,eventid,user,role,confirmed)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].chooserole(res,eventid,user,role,confirmed);
				});
			}
		});
	},

	//triggered when user accepts role assignment
	acceptrole:function(eventid,user,role)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].acceptrole(eventid,user,role);
				});
			}
		});
	},

	//triggered when user rejects role assignment
	rejectrole:function(eventid,user,role)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].rejectrole(eventid,user,role);
				});
			}
		});
	},

	//triggered when user rejects shot assignment
	rejectshot:function(eventid,user,shot)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].rejectshot(eventid,user,shot);
				});
			}
		});
	},

	//triggered when user accepts shot assignment
	acceptshot:function(eventid,user,shot)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].acceptshot(eventid,user,shot);
				});
			}
		});
	},

	//triggered when user says there is something interesting happening
	triggerinterest:function(eventid,user,role,shot)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].triggerinterest(eventid,user,role,shot);
				});
			}
		});
	},

	//user ready to produce (really!)
	ready:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].ready(eventid,user);
				});
			}
		});
	},

	//user ready to produce (really!)
	unselectrole:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].unselectrole(eventid,user);
				});
			}
		});
	},

	//user ready to produce (really!)
	eventstarted:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].eventstarted(eventid,user);
				});
			}
		});
	},

	eventpaused:function(eventid,userid)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].eventpaused(eventid,userid);
				});
			}
		});
	},

	//check status of events (eg users)
	checkstatus:function(eventid)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].checkstatus(eventid);
				});
			}
		});
	},

	//close app
	disconnect:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].disconnect(eventid,user);
				});
			}
		});
	},

	//heartbeat
	heartbeat:function(eventid,user)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].heartbeat(eventid,user);
				});
			}
		});
	},

	//changephase
	changephase:function(eventid,phase)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].changephase(eventid,phase);
				});
			}
		});
	},

	//changephase
	updateevent:function(eventid)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
						module.exports.event_modules[k].updateevent(event);
				});
			}
		});
	},

	//getusers
	getusers:function(eventid,cb)
	{
		Event.findOne(eventid).exec(function (err,event) {
			if (err || event == undefined) return;
			if (event.shoot_modules)
			{
				_.each(event.shoot_modules,function(v,k,l)
				{
					if ((v==true || v=='1' || v==1) && module.exports.event_modules[k]!=undefined)
					{
						if (module.exports.event_modules[k].AllEvents[eventid])
						{
							var users = module.exports.event_modules[k].AllEvents[eventid].users;
							cb(_.pluck(users,'id'));
						}
					}
				});
			}
		});
	}

};
