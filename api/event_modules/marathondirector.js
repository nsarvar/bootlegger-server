/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var _ = require('lodash');
var moment = require('moment');

var redis = require("redis"), redisclient = redis.createClient(sails.config.session.port,sails.config.session.host);

function processMedia(session, media)
{
	console.log("processing media");
	var event = media.event_id;
	var user = media.created_by;
	var lastpush = moment(module.exports.AllEvents[event].users[user].lastpush);
	var now = moment();

	//console.log(media);
	//console.log("x0");

	//RESET AFTER DEBUG
	//console.log("now: "+now);
	//console.log("then: "+lastpush);
	//console.log("diff: "+now.diff(lastpush, 'minutes',true));
	if (now.diff(lastpush, 'minutes',true) > 10)
	{
		//console.log("x1");
		//console.log("last push too long ago")
		module.exports.AllEvents[event].users[user].lastpush = new Date();

		var warnings = [];

		//get all media for this user:
		Media.find({created_by:user,event_id:event}).exec(function(err,medias)
		{
			//for each media
			_.each(medias,function(m)
			{
				//console.log("x2");
				//zoom
				// var zooms = _.filter(media.meta.timed_meta, function(num) { return num.key == 0; });
				//check zoom only goes in one direction (numbers not going up then down)

				//CHECK SHOT LENGTHS
				// if (media.meta.timed_meta)
				var shot = module.exports.AllEvents[event].data.eventtype.shot_types[m.meta.static_meta.shot];
				if (shot)
				{
					//console.log(shot);
					if (m.meta.static_meta.clip_length < shot.max_length)
					{
						//console.log("shot too short");
						warnings.push({title:"Shot Advice",msg:"Try taking longer shots to capture more background"});
					}
				}
			});

			//CHECK WANTED AMOUNT
			//console.log("x3");
			//console.log(medias);
			if (medias.length > 5)
			{
				_.each(module.exports.AllEvents[event].data.eventtype.shot_types,function(s)
				{
					var count = _.filter(medias,function(t){
						return t.meta.static_meta.shot == s.id;
					}).length;
					//console.log(count + " shots of " + s.id);
					if (count > s.wanted)
					{
						//console.log("too many over wanted");
						warnings.push({title:"Shot Advice",msg:"Try a variety of shots rather than just one angle"});
					}
				});
			}

			//console.log("x4");
			//rnadomly pick from the messages
			if (warnings.length > 0 && session.platform && session.pushcode)
			{
				var msg = _.sample(warnings);
				//console.log("sending: ",msg);
				User.publishUpdate(user,{msg:msg.msg});
				//Gcm.sendMessage(session.platform,session.pushcode,msg.title,msg.msg);
			}
			module.exports.AllEvents[event].users[user].processingpush = false;
		});

		 //check zoom meta on each shot (more than 3 zoom changes / zoom in then out)

		 //check gps coords -- if all in the same place -- suggest moving...

		 //multiple shot types in one media -- make your mind up....
	}
	else
	{
		//console.log("last push too soon");
		module.exports.AllEvents[event].users[user].processingpush = false;
	}
}

//auto_director
module.exports = {
	codename:'marathondirector',
	name:'Shot Palette Director',
	description:'Coordinates participants to capture content over time, with an evolving set of commissioned shots.',
	AllEvents: {},

	//initialise the events array
	init:function(multiserver)
	{
		//return;
		//console.log(multiserveronline);
		Event.find({}).exec(function(err,ev)
		{
			_.each(ev,function(e)
			{
				//console.log('maybe '+e.name);
				if (e.shoot_modules[module.exports.codename] == 1)
				{
					//if this server is running it
					//console.log("event server: "+e.server);
					//console.log(sails.config.hostname);
					if (!e.server || e.server == sails.config.hostname + ':' + sails.config.port  || sails.multiserveronline==false)
					{
					//	console.log('marathon director starting event '+e.name + " / " + e.id);
						Log.verbose('marathondirector','marathondirector starting event '+e.name);
						module.exports.AllEvents[e.id] = {
							id : e.id,
							data : e,
							users:{},
							currentphase:'selection',
							lastuploadchecked:new Date()
						};

						redisclient.get('busers:'+e.id, function(err, reply) {
							if (reply)
							{
								//console.log(reply);

								//console.log(JSON.parse(reply));
								try{
									var newusers = JSON.parse(reply);
									//console.log(newusers);
									module.exports.AllEvents[e.id].users = newusers;
								}
								catch (ex)
								{
									console.log('cant parse from redis');
								}

							}
						});
					}
				}
			});

			//console.log(module.exports.AllEvents);
			module.exports.longpoll();
		});
	},

	addevent:function(eventid)
	{
		console.log("EVENTID: "+eventid);
		if (module.exports.AllEvents[eventid] == undefined)
		{
			Event.findOne(eventid).exec(function(err,e)
			{
				if (e.shoot_modules[module.exports.codename] == 1)
				{
					//if this server is running it
					//console.log('maybe '+e.name);
					if (!e.server || e.server == sails.config.hostname + ':' + sails.config.port  || sails.multiserveronline==false)
					{
						module.exports.AllEvents[e.id] = {
							id : e.id,
							data : e,
							users:{},
							currentphase:'selection',
							lastuploadchecked:new Date()
						};
					}
				}
				//module.exports.longpoll();
			});
		}
		else
		{

		}
	},

	//when a file has been uploaded
	process:function(req, media)
	{
		//console.log(media);

		var event = media.event_id;
		var user = media.created_by;
		if (!media.path) //uploaded meta-data
		{
			if (module.exports.AllEvents[event].users[user])
			{
				if (!module.exports.AllEvents[event].users[user].processingpush)
				{
					module.exports.AllEvents[event].users[user].processingpush = true;
					Log.logmore('marathondirector',{msg:'Process File',userid:user,eventid:event, media:media.id});
					//process on timeout to catch all of the clips that batch upload:
					setTimeout(processMedia(req.session,media),5000);
				}
			}
		}
		return;
	},

	//only happens every so often (once a min)
	longpoll:function()
	{
		//lookup session information for users:
		//console.log("marathon logpoll: "+_.size(module.exports.AllEvents));
		//return;
		//for each event:
		var pushes = [];

		_.each(module.exports.AllEvents,function(i,k,l)
		{
			var event = module.exports.AllEvents[k];
			var now = moment();
			var lastchecked = moment(event.lastuploadchecked);
			var enddate = moment(event.data.ends + " " + event.data.ends_time,"DD-MM-YYYY h:mma");

			//console.log(enddate.fromNow());

			if (now.diff(lastchecked, 'hours',true) > 6 && now > enddate && now.diff(enddate, 'days',true) < 7)
			{
				//find media for this event:
				Media.find({event_id:event.id},function(err,media){
					//find unique list of users with un-uploaded footage:
					//filter by not uploaded:
					//console.log("media: "+media.length);

					var notuploaded = _.filter(media,{path:undefined});
					//console.log("notuploaded: "+notuploaded.length);
					var usersnotuploaded = _.pluck(notuploaded,'created_by');
					//console.log("user: "+usersnotuploaded.length);
					var uniqueusers = _.unique(usersnotuploaded);
					//console.log("unique users: "+uniqueusers);
					//for each one of these, find the session info:
					User.find({id:uniqueusers}).exec(function(err, users)
					{
						_.each(users,function(us){
							//push a message to them:
							if (us.pushcode && _.indexOf(pushes,us.id) == -1)
							{
								pushes.push(us.id);
								//console.log("send msg");
								Gcm.sendMessage(us.platform,us.pushcode,"Upload Videos","Please upload your " + event.data.name + " videos",event.id);
								Log.logmore('marathondirector',{msg:'GCM Message',userid:us.id,eventid:event.id});
							}
						});

						event.lastuploadchecked = new Date();
					});
				});
			}
		});
	},

	//triggered on a timer
	trigger:function()
	{
		return;
	},

	//triggered on user signin
	signin:function(event,user,profile,resub,force)
	{
		//console.log("resub:"+resub);
		User.publishUpdate(user,{modechange:'selection'});
		if (module.exports.AllEvents[event].users[user]==undefined)
		{
			//tell user about this event:
			// Event.findOne(event).done(function(err,event){
			// 	User.publishUpdate(user,{msg:"You are now on the production team for " + event.name});
			// });


			//CREATE USER
			module.exports.AllEvents[event].users[user] = {
				id:user,
				name:profile.profile.displayName,
				profileImg:profile.profile._json.picture,
				status:'ready',
				lastpush:new Date(),
				role:-1,
				shot:false,
				lasthearbeat:new Date()
			};


			redisclient.set('busers:'+event, JSON.stringify(module.exports.AllEvents[event].users));

			//User.publishUpdate(user,{length:module.exports.AllEvents[event].users[user].length, warning:module.exports.AllEvents[event].users[user].warning,live:module.exports.AllEvents[event].users[user].live,cameragap:module.exports.AllEvents[event].users[user].cameragap});

			Log.logmore('marathondirector',{msg:'User signin',userid:user,eventid:event});

			//TELL EVERYONE ELSE ABOUT USER
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			return;
		}
		else
		{
			//console.log('reconnect user to');
			//if user reconnected:
			//reconnect user:
			//console.log('re-connect user');
			module.exports.AllEvents[event].users[user].status = 'ready';
			redisclient.set('busers:'+event, JSON.stringify(module.exports.AllEvents[event].users));
			//User.publishUpdate(user,{msg:'Welcome back...'});
			//User.publishUpdate(user,{modechange:'selection'});
			//User.publishUpdate(user,{eventstarted:module.exports.AllEvents[event].hasstarted});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			return;
		}

	},

	//triggered on deliberate disconnect
	disconnect:function(event, user)
	{
		module.exports.AllEvents[event].users[user].status = 'offline';
		redisclient.set('busers:'+event, JSON.stringify(module.exports.AllEvents[event].users));
		Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		Log.logmore('marathondirector',{msg:'User lost',userid:user,eventid:event});
		//delete module.exports.AllEvents[event].users[user];

		//if there is only 1 user, notify them that they are the only one, stop their recording and tell them to get other people logged in...
		// if (_.size(module.exports.AllEvents[event].users) == 1)
		// {
		// 	if (module.exports.AllEvents[event].users[0].status != 'lost')
		// 	{
		// 		var u = _.values(module.exports.AllEvents[event].users)[0];
		// 		User.publishUpdate(u.id,{msg: "And then there was one. You are alone on the crew, so we are pausing production until someone else joins you"});
		// 		u.status = 'allocating';
		// 		User.publishUpdate(u.id,{live:false});
		// 	}
		// }

		Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
	},

	//triggered on deliberate disconnect
	heartbeat:function(event, user)
	{
		if (module.exports.AllEvents[event].users[user] != undefined)
			module.exports.AllEvents[event].users[user].lasthearbeat = new Date();
	},

	//trigged on signout (or loss of connection) (must run after a disconnect event from the socket server)
	signout:function(event,user)
	{
		try
		{
			module.exports.AllEvents[event].users[user].status = 'signedout';
			redisclient.set('busers:'+event, JSON.stringify(module.exports.AllEvents[event].users));
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			//check for really lost...
			// setTimeout(function()
			// {
			// 	if (module.exports.AllEvents[event].users[user] != undefined)
			// 	{
			// 		if (module.exports.AllEvents[event].users[user].status == 'lost')
			// 		{
			// 			delete module.exports.AllEvents[event].users[user];

			// 			if (_.size(module.exports.AllEvents[event].users) == 1)
			// 			{
			// 				//console.log(module.exports.AllEvents[event].users);
			// 				var u = _.values(module.exports.AllEvents[event].users)[0];
			// 				//console.log(u);
			// 				User.publishUpdate(u.id,{msg: "And then there was one. You are alone on the crew, so we are pausing production until someone else joins you"});
			// 				u.status = 'allocating';
			// 				User.publishUpdate(u.id,{live:false});
			// 			}
			// 			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			// 		}
			// 	}
			// },12000);

			Log.logmore('marathondirector',{msg:'User lost',userid:user,eventid:event});
		}
		catch (e)
		{

		}
		return;
	},

	//triggerd when user starts recording
	startrecording:function(event,user)
	{
		//for logging
		try
		{
			module.exports.AllEvents[event].users[user].status = 'recording';
			Log.logmore('marathondirector',{msg:'Recording Started',userid:user,eventid:event});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		}
		catch (e) {

		}
		return;
	},

	//triggered when user stops recording
	stoprecording:function(event,user)
	{
		try
		{
			module.exports.AllEvents[event].users[user].status = 'ready';
			Log.logmore('marathondirector',{msg:'Recording Stopped',userid:user,eventid:event});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		}
		catch(e)
		{

		}
		return;
	},

	//triggered when user holds on current shot
	holdrecording:function(event,user)
	{
		return;
	},

	//triggered when user asks to skip
	skiprecording:function(event,user)
	{
		return;
	},

	//triggered when user chooses their own role, checks to see if its a duplicate and asks to confirm
	chooserole:function(res,event,user,role,confirmed)
	{
		try
		{
			Log.logmore('marathondirector',{msg:'Role Set',userid:user,role:role,eventid:event});
			return res.json({status:'ok',msg:'Role Set'});
		}
		catch (e)
		{
			console.log(e);
			return res.json({status:'fail',msg:'Cant Change Role, Problem!'});
		}
	},

	//triggered when user accepts role given to them
	acceptrole:function(event,user,role)
	{
		try
		{
			//tell user to get another shot
			//User.publishUpdate(user,{getshot:6});
			module.exports.AllEvents[event].users[user].role = role;
			User.publishUpdate(user,{msg:'Role Set'});
			Log.logmore('marathondirector',{msg:'accept role',userid:user,role:role,eventid:event});
		}
		catch (e)
		{

		}
		return;
	},

	//triggered when user rejects role given to them
	rejectrole:function(event,user,role)
	{
		try
		{
			//reallocate role
			module.exports.AllEvents[event].users[user].role = -1;
			Log.logmore('marathondirector',{msg:'reject role',userid:user,role:role,eventid:event});
		}
		catch (e) {

		}
		return;
	},

	//triggered when user accepts shot given to them
	acceptshot:function(event,user,shot)
	{
		try
		{
			//reallocate role
			module.exports.AllEvents[event].users[user].shot = shot;
			Log.logmore('marathondirector',{msg:'set shot',userid:user,shot:shot,eventid:event});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		}
		catch (e) {

		}
		return;
	},

	//triggered when user rejects shot given to them
	rejectshot:function(event,user,shot)
	{
		return;
	},

	//triggered when user says there is something worth looking at
	triggerinterest:function(event,user,role,shot)
	{
		//tell people who are in 'allocating' to find this same thing thats happening.
		//TODO -- LATER
		return;
	},

	checkstatus:function(event)
	{
		//console.log(module.exports.AllEvents[event]);

		var shots = module.exports.AllEvents[event].data.eventtype.shot_types;

		Event.publishUpdate(event,{shots:shots});
		Event.publishUpdate(event,{phase:module.exports.AllEvents[event].currentphase});
		Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
	},


	//user fires this event when they are ready to publish
	ready:function(event, user)
	{
		// try
		// {
		// 	if (_.size(module.exports.AllEvents[event].users[user]) > 1)
		// 	{
		// 		//actually ready to start allocating roles (the user knows whats going on)
		// 		module.exports.AllEvents[event].users[user].status = 'waiting';
		// 		Log.logmore('marathondirector',{msg:'ready',userid:user,eventid:event});
		// 		Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});

		// 		//tell everyone else about this person arriving
		// 		var users = [];
		// 		_.each(module.exports.AllEvents[event].users,function(u)
		// 		{
		// 			if (u.id != user)
		// 				User.publishUpdate(u.id,{msg: module.exports.AllEvents[event].users[user].name+" joining makes "+_.size(module.exports.AllEvents[event].users)+" people filming at this event"});
		// 		});

		// 		//message this user
		// 		if (_.size(module.exports.AllEvents[event].users)>1)
		// 			User.publishUpdate(user,{msg:"Welcome, "+ _.without(_.pluck(module.exports.AllEvents[event].users, 'name'),module.exports.AllEvents[event].users[user].name) + " are on the film crew too"});
		// 		else
		// 			User.publishUpdate(user,{msg:"Welcome, you are the first to join the film crew"});
		// 	}
		// 	else
		// 	{
		// 		//dont trigger starting the event if only one person is ready...
		// 		User.publishUpdate(user,{msg:"You are the only person available at the moment, we are waiting for others to begin"});
		// 	}
		// }
		// catch (e){

		// }
	},

	notready:function(event,user)
	{

	},

	unselectrole:function(event, user)
	{
		try
		{
			//actually ready to start allocating roles (the user knows whats going on)
			//sails.winston.info("un selecting role");
			module.exports.AllEvents[event].users[user].role = -1;
			module.exports.AllEvents[event].users[user].status = 'new';
			Log.logmore('marathondirector',{msg:'unselecting role',userid:user,eventid:event});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		}
		catch (e) {}
	},

	eventstarted:function(event, user)
	{
		return;
	},


	changephase:function(event,phase)
	{
		try
		{
			Log.logmore('autodirector',{msg:'phase changed',eventid:event,phase:phase});
			//console.log('phase changed');
			//transmit mode change:
			_.each(module.exports.AllEvents[event].users,function(u)
			{
				User.publishUpdate(u.id,{phasechange:phase});
			});
		}
		catch (e) {

			console.log(e);
		}
	},

	updateevent:function(ev)
	{
		try
		{
			Log.logmore('marathondirector',{msg:'update event',eventid:ev.id});
			var e = ev;

			var direction = ev.leadlocation;

			var allroles = ev.eventtype.roles;
			//reduce coverage classes down to the same format as last time...

			var tempcoverage = e.coverage_classes;

			_.each(tempcoverage,function(el)
			{
				el.items = _.pluck(el.items, 'name');
			});

			e.shottypes = ev.eventtype.shot_types;
			e.coverage_classes = tempcoverage;
			e.roles = allroles;
			e.eventcss = ev.eventtype.eventcss;
			e.ispublic = e.public;

			if (e.roleimg == undefined && ev.eventtype.roleimg != undefined)
				e.roleimg = sails.config.S3_CLOUD_URL + ev.eventtype.roleimg;

			e.codename = ev.eventtype.codename;

			if (ev.eventtype.version!=null)
				e.version = ev.eventtype.version;
			else
				e.version = 0;

			if (ev.eventtype.offline!=null)
				e.offline = ev.eventtype.offline;
			else
				e.offline = false;
			if (ev.eventtype.generalrule!=null)
				e.generalrule = ev.eventtype.generalrule;

			delete e.eventtype;

			//console.log('phase changed');
			//transmit mode change:
			_.each(module.exports.AllEvents[ev.id].users,function(u)
			{
				User.publishUpdate(u.id,{eventupdate:e});
			});
		}
		catch (e) {

			console.log(e);
		}
	}


}
