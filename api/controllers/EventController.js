/**
 * EventController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var urlencode = require('urlencode');
var path = require('path');
var fs = require('fs');

module.exports = {

	admin:function(req,res)
	{
		//lists all events and their current status, allows removal / stopping of events...
		Event.find({},function(err,events){
			res.view({events:events});	
		});
	},

	index:function(req,res)
	{
		return res.redirect('/event/view');
	},

	server:function(req,res)
	{
		//console.log(req.params.id);
		Event.findOne(req.params.id).exec(function(err,event){
			if (event != undefined)
			{
				res.json({myaddress:req.headers.host,eventserver:event.server});
			}
			else
			{
				res.json({error:"No Event Specified"},500);
			}
		});
	},

	view:function(req,res)
	{
		//console.log(sails.express);
		//console.log(req.signedCookies['sails.sid']);

		if (req.session.ismobile || req.wantsJSON)
		{
			if (req.session.isios == true)
			{
				//get signed cookie:
				var cookiesigned = require('cookie-signature');
				var signed = cookiesigned.sign(req.signedCookies['sails.sid'],req.secret);
				
				signed = "s:" + signed;
				//console.log(urlencode(signed));
				return res.redirect('bootlegger://success/?'+urlencode(signed));
			}
			else
			{
				//console.log("trying to render event view");
				return res.view('event/mobileok.ejs',{
				  _layoutFile: '../mobileapp.ejs'
				});
			}
		}
		else
		{
			//console.log(req.params);

			//set to default event
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
				event.calcphases();
				//console.log(event);
				res.view({event:event});
			});
		}
	},

	kill:function(req,res)
	{
		var eventid = req.params.id;
		Event.findOne(eventid).exec(function(err, ev) {
			  // destroy the record
			  if (ev!=undefined)
			  {
				  ev.destroy(function(err) {
				    req.session.flash = {err:"Event removed"};
					return res.redirect('/event/admin');
				  });
				}
				else
				{
					return res.redirect('/event/admin');
				}
			});
	},

	remove:function(req,res)
	{
		//remove event...

		var eventid = req.params.id;

		Event.findOne(eventid).exec(function(err, ev) {
			  // destroy the record
			  if (ev!=undefined)
			  {
				  ev.destroy(function(err) {
				    // record has been removed
				    if (eventid == req.session.passport.user.currentevent)
				    	req.session.passport.user.currentevent = null;

				    req.session.flash = {err:"Event removed"};
					return res.redirect('/commision/new');
				  });
				}
				else
				{
					return res.redirect('/commision/new');
				}
			});
	},

	coverage:function(req,res)
	{
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (err || ev == null)
				return res.json({});
			else
				return res.json({coverage_classes:ev.coverage_classes});
		});
	},

	phases:function(req,res)
	{
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (err || ev == null)
				return res.json({});
			else
				return res.json({phases:ev.phases});
		});
	},

	codes:function(req,res)
	{
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (err || ev == null)
				return res.json({});
			else
				return res.json({codes:ev.codes});
		});
	},

	addcode:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,ev)
		{
			if (ev.codes == undefined)
				ev.codes = new Array();
			
			Event.getnewcode(function(code){
				ev.codes.push({number:req.param('number'),status:'sent',code:code});
				Nexmo.sendSMS({number:req.param('number'),code:code});
				ev.save(function()
				{
					return res.json({});
				});
			});		
		});
	},

	makedefault:function(req,res)
	{
		//console.log(req.param('id'));
		User.update({
		  id: req.session.passport.user.id
		},
		{
			currentevent:req.param('id')
		},
		function(err, users) {
		  if (err) {
		    return res.json(err, 500);
		  } else {
		  	req.session.passport.user.currentevent = req.param('id');
		  	req.session.passport.user.cv = req.param('id');
		    return res.json({msg:'Updated Succesfully'},200);
		  }
		});
		return res.json({msg:'done'},200);
	},

	addcoverage:function(req,res)
	{
		var index = req.param('index');
		var item = req.param('item');
		var direction = "Mid";
		var id = req.params.id;
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			//console.log(ev);
			//console.log(index);

			//console.log(index);

			ev.coverage_classes[index].items.push({name:item, direction:direction});
			ev.save(function(err,ev)
			{
				sails.eventmanager.addevent(id);
				return res.json(ev,200);
			});
		});
	},

	removecoverage:function(req,res)
	{
		var parentindex = req.param('parentindex');
		var index = req.param('index');
		var id = req.params.id;
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			//console.log(ev);
			//console.log(ev.coverage_classes[parentindex].items[index]);
			//delete ev.coverage_classes[parentindex].items[index];
			ev.coverage_classes[parentindex].items.splice( index, 1 );
			//console.log(ev.coverage_classes[parentindex]);
			ev.save(function(err,ev)
			{
				sails.eventmanager.addevent(id);
				return res.json(ev,200);
			});
		});
	},

	updatedirection:function(req,res)
	{
		var parentindex = req.param('parentindex');
		var index = req.param('index');
		var direction = req.param('direction');
		var id = req.params.id;

		Event.findOne(req.params.id).exec(function(err,ev)
		{
			ev.coverage_classes[parentindex].items[index].direction = direction;
			//console.log(ev.coverage_classes[parentindex]);
			ev.save(function(err,ev)
			{
				sails.eventmanager.addevent(id);
				return res.json(ev,200);
			});
		});
	},

	edit:function(req,res)
	{
		var args = req.params.all();
		var id = args.id;

		//console.log(args);

		delete args.id;

		Event.update({
		  id: id
		},
		args,
		function(err, ev) {
		  sails.eventmanager.addevent(id);

		  if (err) {
		    return res.json(err, 500);
		  } else {
		    return res.json({msg:'Updated Succesfully'},200);
		  }
		});
	},

	changetitle:function(req,res)
	{
		var title = req.param('title').trim();
		var id = req.session.event;
		//console.log(title);
		Event.findOne(id,function(err,ev)
		{
			ev.name = title;
			ev.save(function(err)
				{
					if (err) {
					    return res.json(err, 500);
					  } else {
					    return res.json({msg:'Updated Succesfully'},200);
					  }
				});
		});
	},

	heartbeat:function(req,res)
	{
		//userid?
		//console.log("received heartbeat");
		sails.eventmanager.heartbeat(req.param('id'),req.session.passport.user.id);
		return res.json({type:'OK'},200);
	},

	initmessage:function(req,res)
	{
		User.publishUpdate(req.session.passport.user.id,{msg:"You are about to join the production team, we will give you hints of things to shoot. To start, try out some of the shots you might be asked for",dialog:true,shots:true});
		return res.json({},200);
	},

	//subscribe to event feed and direction engine (socket.io)
	sub:function(req,res)
	{
		req.socket.on('disconnect',function(){
			//console.log('sub_disconn: '+ req.socket.id);

			User.unsubscribe(req.socket,[req.session.passport.user.id]);
			sails.eventmanager.signout(req.param('id'),req.session.passport.user.id);
		});

		User.subscribe(req.socket,[req.session.passport.user.id]);

		res.json({msg:"OK"},200);

		//register this user with the event manager
		sails.eventmanager.signin(req.param('id'),req.session.passport.user.id,req.session.passport.user,false,req.param('force'));
		return;
	},

	resub:function(req,res)
	{
		User.subscribe(req.socket,[req.session.passport.user.id]);
		sails.eventmanager.signin(req.param('id'),req.session.passport.user.id,req.session.passport.user,true,req.param('force'));		
		//console.log('Attempted re-subscribe (after connection drop) with: ' + req.socket.id);
		return;
	},

	//this is for the web view (not producing content) to get updates
	updates:function(req,res)
	{
		//console.log('subscribe to: '+ req.param('id'));
		Event.subscribe(req.socket,[req.param('id')]);
		sails.eventmanager.checkstatus(req.param('id'));
		return;
	},
	
	signout:function(req,res)
	{
		sails.eventmanager.disconnect(req.param('id'),req.session.passport.user.id);
		//also remove from server / logout
		var request = require('request');
		request('https://mail.google.com/mail/u/0/?logout&hl=en',function(err,res,body)
		{
			req.session.destroy(function(err)
			{
				//req.logout();
				//console.log("done logout");
				return;
			});
		});
	},

	//for the client -- returns more information about the event
	subscribe:function(req,res)
	{
		//subscribe to messages from a specific event:
		//send message to rest of team
		Event.publishUpdate(req.params.id,{msg: req.session.passport.user.profile.displayName +' signed in to publish',timestamp:new Date().toLocaleDateString()},req.socket);

		//return more information about this event (all the roles, shot types etc)
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (ev)
			{
				var e = ev;				
				//cull shottypes from this list which do not match the appropriate leadlocation value
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
				
				if (e.roleimg == undefined && ev.eventtype.roleimg != undefined)
					e.roleimg = ev.eventtype.roleimg;

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
				return res.json(e,200);
			}
			else
			{
				return res.json({'msg':'No Event Found','status':402},500);
			}
		});
	},

	myevents:function(req,res)
	{
		//find events owned by this user:
		//console.log(req.user.id);
		//console.log('listing my events');
		var myevents = {};
		var codeevents = {};
		
		//console.log(req.session.passport);

		Event.find(
			{'ownedby': {
        		contains: req.session.passport.user.id
      		}}).exec(function(err,data){
			var evs = new Array();
			_.each(data,function(d){
				if (!sails.localmode)
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, description:d.eventtype.description,default_event:(d.id==req.session.passport.user.currentevent)});
					else
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, server:'localhost',description:d.eventtype.description,default_event:(d.id==req.session.passport.user.currentevent)});
				
			});

			//console.log(data);

			myevents = evs;

			Event.find().where({'codes.uid':req.session.passport.user.id}).exec(function(err,event)
			{
				var evs = new Array();
				_.each(event,function(d){
					if (!sails.localmode)
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, server:d.server,description:d.eventtype.description});
					else
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, server:'localhost',description:d.eventtype.description});
				});
				codeevents = evs;
				Event.find().where({public:true}).exec(function(err,event)
				{
					var evs = new Array();
					_.each(event,function(d){
					if (!sails.localmode)
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, server:d.server,description:d.eventtype.description});
					else
						evs.push({name:d.name,id:d.id, server:d.server, starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, server:'localhost',description:d.eventtype.description});
					});
					return res.json({myevents:myevents,codeevents:codeevents,publicevents:evs});	
				});				
			});
		});
	},

	registercode:function(req,res)
	{
		//find the event that matches the code
		Event.find().where({'codes.code':req.param('code')}).exec(function(err,event){
			//find the code that matches this:
			//console.log(event);
			if (event.length > 0)
			{
				_.each(event[0].codes,function(c){
					if (c.code == req.param('code'))
					{
						c.uid = req.session.passport.user.id;
						c.status = 'linked';
					}
				});
				event[0].save(function()
				{
					return res.json({msg:'You have been added as a team member to '+event.name,code:200,event_id:event[0].id},200);
				});
			}
			else
			{
				return res.json({msg:'You have entered an invalid event code',code:401},200);
			}
		});
	},

	me:function(req,res)
	{
		return res.json(req.session.passport.user);
	},

	getlog:function(req,res)
	{
		var eventid = req.params.id;
		Log.find({eventid:eventid}).limit(20).sort('_id DESC').exec(function(err,logs){
			res.json(logs);
		});
	},

	log:function(req,res)
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

		//event config screen -- module selection for the event
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){
			if (event == undefined)
			{
				console.log("no event found to log "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/commision/new');
			}
			//console.log(event);
			res.view({event:event});
		});
	},

	admins:function(req,res)
	{
		//list admins for an event...
		//perhaps lookup names...
		//console.log(req.params.id);
		Event.findOne(req.params.id,function(err,ev){
			if (ev!=null)
			{
				var data = ev.ownedby;
				var output = [];
				var async = require('async');
				var calls = [];
				//match against names:
				_.each(data,function(el)
				{
					calls.push(function(callback) {
						User.findOne(el).exec(function(err,u)
						{
							if (u!=null)
							{
								//console.log(u);
								//el.name = u.profile.displayName;
								output.push({id:el,name:u.profile.displayName})
							}
							callback();
						});
					});
				});

				async.series(calls, function(err, result) {
					//console.log(output);
			       return res.json(output);
				});		
			}
			else
			{
				return res.json({});
			}
		});
	},

	testeventupdate:function(req,res)
	{
		Event.findOne(req.param('id'),function(err,ev){
			//console.log(ev);
			if (err==null && ev!=null)
			{
				//console.log(ev);
				sails.eventmanager.updateevent(ev.id);
				return res.json({msg:'Updated Changed'});
			}
			else
			{
				return res.json({msg:'Problem Updating'});
			}
		});
	},

	changephase:function(req,res)
	{
		Event.findOne(req.param('id'),function(err,ev){
			//console.log(ev);
			if (err==null && ev!=null)
			{
				//console.log(ev);
				ev.currentphase = req.param('phase');
				ev.save(function(err)
				{
					sails.eventmanager.changephase(ev.id,req.param('phase'));
					return res.json({msg:'Phase Changed'});
				});
			}
			else
			{
				return res.json({msg:'Problem Changing Phase'});
			}
		});
	},

	addphase:function(req,res)
	{
		//makes this person an admin on this event (if we can find them and they are not already)
		//check for user exists:
		//console.log(req.param('email'));
		//console.log(req.param());
		Event.findOne(req.param('id'),function(err,ev){
			//console.log(ev);
			if (err==null && ev!=null)
			{
				//console.log(ev);
				ev.phases.push({name:req.param('phase')});
				ev.save(function(err)
				{
					return res.json({msg:'Phase Added'});
				});
			}
			else
			{
				return res.json({msg:'Problem Adding Phase'});
			}
		});
	},

	removephase:function(req,res)
	{
		var index = req.param('index');
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			//console.log(ev);
			//console.log(ev.coverage_classes[parentindex].items[index]);
			//console.log(ev);
			//delete ev.coverage_classes[parentindex].items[index];
			ev.phases.splice( index, 1 );
			if (ev.currentphase > req.param('index'))
				ev.currentphase = 0;

			//console.log(ev.coverage_classes[parentindex]);
			ev.save(function(err,ev)
			{
				return res.json({msg:"Phase Removed"});
			});
		});
	},

	addadmin:function(req,res)
	{
		//makes this person an admin on this event (if we can find them and they are not already)
		//check for user exists:
		//console.log(req.param('email'));
		User.find({'profile.emails.value':req.param('email')}).exec(function(err,u)
		{
			//console.log(u);

			if (u!=null && err==null)
			{
				//console.log(req.params.id);
				Event.findOne(req.param('id'),function(err,ev){
					//console.log(ev);
					if (err==null && ev!=null)
					{
						if (!_.contains(ev.ownedby,u[0].id))
						{
							//console.log(u);
							ev.ownedby.push(u[0].id);
							ev.save(function(err)
							{
								return res.json({msg:'Administrator Added'});
							});	
						}
						else
						{
							return res.json({msg:'This person is already an Admin'});
						}
					}
					else
					{
						return res.json({msg:'Problem Adding That Administrator'});
					}
				});
			}
			else
			{
				return res.json({msg:'Problem Adding That Administrator'});
			}
		});

	},

	updaterole:function(req,res)
	{
		console.log(req.params.all());
		Event.findOne(req.param('id')).exec(function(err,m){
			//console.log(m);
			//console.log(m.eventtype.roles[parseInt(req.param('role'))]);
			console.log(m.eventtype.roles[parseInt(req.param('role'))]);
			m.eventtype.roles[parseInt(req.param('role'))].position = [req.param('x'), req.param('y')];
			console.log(m.eventtype.roles[parseInt(req.param('role'))]);
			m.save(function(ok)
			{
				res.json({msg:'done'});
			});
		});
	},

	map:function(req,res)
	{
		var knox = require('knox');
		//upload map file for an event role:
		var knox_params = {
		    key: sails.config.AWS_ACCESS_KEY_ID,
		    secret: sails.config.AWS_SECRET_ACCESS_KEY,
		    bucket: sails.config.S3_BUCKET
		  }

		if (req.files.map != undefined)
		{
			var uuid = require('node-uuid');
	 		var fakeid = uuid.v1();
			var filename = fakeid + req.files.map.name;
			var tmp = req.files.map.path;
			var client = knox.createClient(knox_params);
			//fs.copySync(tmp,tmpdir + filename);
		

			client.putFile(tmp, 'upload/' + filename, {'x-amz-acl': 'public-read'},
	    		function(err, result) {
	    			//done uploading
	    			if (err)
	    				console.log("s3 upload error: "+err);

	    			fs.unlink(tmp, function (err) {
	    				//console.log(err);
	    			});

	    			Event.findOne(req.param('id')).exec(function(err,m){

						if (!err && m!=undefined)
						{
							m.eventtype.roleimg = sails.config.S3_URL+'/upload/'+filename;
							m.save(function(err){
								req.session.flash = "Upload Complete";
								res.redirect('/event/view');
							});
						}
						else
						{
							req.session.flash = "Error Uploading Image";
							res.redirect('/event/view');
						}
					});
	    		});	
		}
		else
		{
			res.redirect('/event/view');
		}
	},

	registerpush:function(req,res)
	{
		//add push code to the session:
		req.session.pushcode = req.param('pushcode');
		req.session.platform = req.param('platform');

		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			u.pushcode = req.param('pushcode');
			u.platform = req.param('platform');
			u.save(function(err)
			{
				return res.json({msg:'OK'},200);
			});
		});
	},

	addevent:function(req,res,next)
	{
		//console.log("creating: " + req.param('eventtype'));

		//do save
		EventTemplate.findOne(req.param('eventtype')).exec(function(err,myev)
		{
			
			//var myev = tys[req.param('eventtype')];
			var meta_modules = myev.meta_modules;
			var post_modules = myev.post_modules;
			var shoot_modules = myev.shoot_modules;
			var coverage_classes = myev.coverage_classes;
			Event.getnewcode(function(code){
				//console.log(myev);

				var whichserver = sails.config.master_url;

				//var e = req.params.all();
				Event.create(_.extend(req.params.all(),{public:0,eventtype:myev,ownedby:[req.session.passport.user.id],meta_modules:meta_modules,post_modules:post_modules,shoot_modules:shoot_modules,coverage_classes:coverage_classes,offlinecode:code}),function(err,event){

					//event.ownedby = [];
					// if (event.ownedby == undefined)
					// 	event.ownedby = new Array();
					//event.ownedby.push(req.session.passport.user.id);
					//event.save(function(){
						//console.log(err);
					if (err)
					{
						//console.log("error adding event");
						req.session.flash = {err:err.ValidationError};
						//console.log(err.ValidationError);
						return res.redirect('/commission/new');
						//return;
						//return next(err);
					}
					else   
					{
						//console.log("requesting server address");
						var reqs = require('request');

						process.nextTick(function(){
							//console.log("tick");
							reqs(sails.config.multiserver+'/newevent/?id='+event.id,function(err, ress, body){
								if (!err)
								{
									//console.log("got " + body);
								    whichserver = JSON.parse(body).server;
								}

								//console.log("err:"+err);
								//console.log("server:"+whichserver);

								//set default event id in session
								//console.log('new event id: '+event.id);
								req.session.passport.user.currentevent = event.id;
								req.session.event = event.id;
								req.session.save();

								if (sails.localmode || sails.hostname == whichserver || err)
								{
									//get which host is supposed to run this event:
									console.log("adding event to director")
									sails.eventmanager.addevent(event.id);
								}
								else
								{
									//redirect to the correct server (and asume longpoll gets activated)
									console.log("Event allocated to another server, redirecting");
									return res.redirect(whichserver + '/event/view/' + event.id);
								}

								event.server = whichserver;
								event.save(function(err){

									//console.log(req.session.User);
									User.findOne(req.session.passport.user.id).exec(function(err,user){
										if (err)
										{
											req.session.flash = {err:err};
											return res.redirect('/commision/new');
										}
										else
										{
											//console.log(user);
											user.currentevent = event.id;
											user.save(function(err)
											{
												console.log("redirect to view");
												return res.redirect('/event/view');		
											}); //end user update
											  
										} // end if err
									});	//end user find
								});
							});//end request for server
						});//tick
					}//end if err
				});//end event create
			});//end code generate
		});//end get details...
	},

	list:function(req,res)
	{
		Event.find({},function(err,events){
			res.json(events);
		});
	},

	listtypes:function(req,res)
	{
		var tys = EventTypes.listEvents();
		res.json(tys);
	},

	startrecording:function(req,res)
	{
		sails.eventmanager.startrecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	stoprecording:function(req,res)
	{
		sails.eventmanager.stoprecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	holdrecording:function(req,res)
	{
		sails.eventmanager.holdrecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	skiprecording:function(req,res)
	{
		sails.eventmanager.skiprecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	chooserole:function(req,res)
	{
		sails.eventmanager.chooserole(res, req.param('eventid'),req.session.passport.user.id, req.param('roleid'), req.param('confirm'));
		return;
	},

	acceptrole:function(req,res)
	{
		sails.eventmanager.acceptrole(req.param('eventid'),req.session.passport.user.id,req.param('roleid'));
		return res.json({msg:'OK'},200);
	},

	rejectrole:function(req,res)
	{
		sails.eventmanager.rejectrole(req.param('eventid'),req.session.passport.user.id,req.param('roleid'));
		return res.json({msg:'OK'},200);
	},

	acceptshot:function(req,res)
	{
		sails.eventmanager.acceptshot(req.param('eventid'),req.session.passport.user.id,req.param('shotid'));
		return res.json({msg:'OK'},200);
	},

	rejectshot:function(req,res)
	{
		sails.eventmanager.rejectshot(req.param('eventid'),req.session.passport.user.id,req.param('shotid'));
		return res.json({msg:'OK'},200);
	},

	triggerinterest:function(req,res)
	{
		sails.eventmanager.triggerinterest(req.param('eventid'),req.session.passport.user.id,req.param('roleid'),req.param('shotid'));
		return res.json({msg:'OK'},200);
	},

	ready:function(req,res)
	{
		sails.eventmanager.ready(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	unselectrole:function(req,res)
	{
		sails.eventmanager.unselectrole(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	started:function(req,res)
	{
		sails.eventmanager.eventstarted(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	},

	pause:function(req,res)
	{
		sails.eventmanager.eventpaused(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'OK'},200);
	}
};
