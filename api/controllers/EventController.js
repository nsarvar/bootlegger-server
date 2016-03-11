/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * EventController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var urlencode = require('urlencode');
var path = require('path');
var fs = require('fs');
var lwip = require('lwip');
var _ = require('lodash');
var moment = require('moment');

function phonenumber(inputtxt)
{
  var phoneno = /^\+?([0-9]{6,})$/;
  if(inputtxt.match(phoneno))
        {
      return true;
        }
      else
        {
        //alert("message");
        return false;
        }
}

function ValidateEmail(inputText)
{
var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
if(inputText.match(mailformat))
{
return true;
}
else
{
return false;
}
}

module.exports = {

	admin:function(req,res)
	{
		res.view();
	},

	admin_edits:function(req,res)
	{
		User.find({}).exec(function(err,users){
			Edits.find({}).exec(function(err,alledits){
				_.each(alledits,function(e){
					e.user = _.find(users,function(u){
						return u.id.toString() == e.user_id.toString();	
					});
					//console.log(e.user)
				});
				return res.json({edits:alledits});
			});
		});
	},

	admin_events:function(req,res)
	{
		User.find({}).exec(function(err,users){
			// console.log(users);
		Media.find({}).exec(function(err,allmedia){

				var med_grp = _.groupBy(allmedia,'event_id');

				Event.find({},function(err,events){
					_.each(events,function(ev){
						ev.totalmedia = _.size(med_grp[ev.id]);
						ev.lasttouched = _.max(_.pluck(med_grp[ev.id],'createdAt'));
						ev.participants = _.size(_.unique(_.pluck(med_grp[ev.id],'created_by')));
						ev.users = _.map(ev.ownedby,function(u)
						{
							return _.find(users,{'id':u});
						});
						ev.totalfilesize = _.sum(_.map(med_grp[ev.id],function(g){
							return g.meta.static_meta.filesize;
						})) / 1024.0;

					});
					return res.json({events:_.groupBy(events,'server')});
				});
		});
	});
	},

	admin_users:function(req,res)
	{
		Edits.find({}).exec(function(err,edits){
		Media.find({}).exec(function(err,allmedia){

				var med_grp = _.groupBy(allmedia,'event_id');

				Event.find({},function(err,events){

					//group by user:
					_.each(events,function(ev){
						ev.totalmedia = _.size(med_grp[ev.id]);
						ev.lasttouched = _.max(_.pluck(med_grp[ev.id],'createdAt'));
						ev.participants = _.size(_.unique(_.pluck(med_grp[ev.id],'created_by')));
						ev.totalfilesize = _.sum(_.map(med_grp[ev.id],function(g){
							return g.meta.static_meta.filesize;
						})) / 1024.0;
					});

						User.find({},function(err,users){

							_.each(users,function(u){
								u.events = _.filter(events,function(e){
									return _.contains(e.ownedby,u.id);
								});

								u.owned = _.size(u.events);
								u.created = _.size(_.filter(allmedia,{'created_by':u.id}));
								u.participatedin = _.size(_.unique(_.pluck(_.filter(allmedia,{'created_by':u.id}),'event_id')));
								u.edits = _.size(_.find(edits,{'user_id':u.id}));
							});

							return res.json({users:users});
						});
				});
		});
	});
	},

	removeuser:function(req,res)
	{
		//find user
		User.findOne(req.params.id).exec(function(err,user){
			//remove all personal info

			user.profile = {_json:{picture:''},emails:[{value:'no-reply@anon.com'}],displayName:'Deleted User',name:{givenName:'Deleted User'}};
			user.deleted = {by:req.session.passport.user.id,on:new Date()};
			user.name = 'Deleted User';
			user.pushcode = '';
			user.platform = '';
			user.currentevent = '';
			user.save(function(err,done){
				//console.log(done);
				req.session.flash = {msg:'User Removed'};
					return res.redirect('/event/admin');
			});
		});
	},

	dashboard:function(req,res)
	{
		//JOIN CODE
		if (req.session.joincode)
		{
			if (req.session.joincode.status == 'sent')
			{
				//do join
				Event.findOne(req.session.joincode.eventid).exec(function(err,event){
					//find the code that matches this:
					//console.log(event);
					if (event != null)
					{
						_.each(event.codes,function(c){
							if (c.code == req.session.joincode.code)
							{
								c.uid = req.session.passport.user.id;
								c.status = 'linked';
							}
						});
						event.save(function()
					{
						delete req.session.joincode;
							return res.view('auth/joincomplete');
						});
					}
					else {
						delete req.session.joincode;

						return res.view('auth/joincomplete');
					}
				});

			}
			else {
				delete req.session.joincode;

					return res.view('auth/joincomplete');
			}
		}
		else //NOT JOIN CODE:
		{
			// if (req.session.ismobile || req.wantsJSON)
			// {
			// // 	if (req.session.isios == true)
			// // 	{
			// // 		//get signed cookie:
			// // 		// var cookiesigned = require('cookie-signature');
			// // 		// var signed = cookiesigned.sign(req.signedCookies['sails.sid'],req.secret);
          // // //
			// // 		// signed = "s:" + signed;
			// // 		//console.log(urlencode(signed));
			// // 		// if (req.session.api)
			// // 		// {
			// // 			return res.json({session:'sails.sid=' + signed,msg:'Logged In OK'});
			// // 		// }
			// // 		// else
			// // 		// {
			// // 			// return res.redirect('bootlegger://success/?'+urlencode(signed));
			// // 		// }
			// // 	}
			// //	else
			// //	{
			// 		//console.log("trying to render dashboard view");
			// 		return res.view('event/mobileok.ejs',{
			// 		  _layoutFile: '../mobileapp.ejs'
			// 		});
			// //	}
			// }
			// else
			// {
				//NORMAL WEB LOGIN...
				return res.view();
			// }
		}
	},

	index:function(req,res)
	{
		return res.redirect('/dashboard');
	},

	view:function(req,res)
	{
		//console.log("event view"+req.params.id)

		//console.log(sails.express);
		//console.log(req.signedCookies['sails.sid']);
		//var lookupid = req.session.event;
		//console.log(lookupid);

		//if event is explicitally set in GET
		if (req.params.id)
		{
			lookupid = req.params.id;
		}

		//req.session.event = lookupid;

		//event config screen -- module selection for the event
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){

			//console.log(err);

			if (event == undefined)
			{
				console.log("no event found view page "+lookupid);
				req.session.flash = {err:"Event not found"};
				return res.redirect('/dashboard');
			}
			event.calcphases();
			if (typeof event.eventtype.roleimg != 'undefined' && event.eventtype.roleimg !== false)
				event.eventtype.roleimg = sails.config.S3_CLOUD_URL+event.eventtype.roleimg;

			if (event.icon)
				event.icon = sails.config.S3_CLOUD_URL+event.icon;

			if (event.iconbackground)
				event.iconbackground = sails.config.S3_CLOUD_URL+event.iconbackground;
			//console.log(event);

			//console.log(event.ownedby);
			var usr = (Array.isArray(event.ownedby))?event.ownedby:[event.ownedby];
			console.log("looking for "+usr);
			User.findOne(usr[0]).exec(function(err,u){
				if (u)
				{
					event.ownedby_user = u;
				}
				else
				{
					event.ownedby_user = {profile:{displayName:'Unknown User'}};
				}
				res.view({event:event,pagetitle:'Prepare'});

			});
		});

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
					return res.redirect('/dashboard');
				  });
				}
				else
				{
					return res.redirect('/dashboard');
				}
			});
	},

	coverage:function(req,res)
	{
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			//console.log(ev);

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
			{

				User.find({}).exec(function(err,users){
					_.each(ev.codes,function(f){
						if (f.uid)
						  f.user = _.find(users,{id:f.uid});
					});

					return res.json({codes:ev.codes});
				});
			}
		});
	},

	resendcode:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,ev)
		{
			 var thecode = _.find(ev.codes,function(c){
				 return c.code == req.param('code');
			 });
			 Event.getnewcode(function(newcode){
				 _.each(ev.codes,function(e){
					 if (e.code == req.param('code'))
					 	e.code = newcode;
				 });


				if (thecode.number.length>1)
					Nexmo.sendSMS({number:thecode.number,code:newcode});
				if (thecode.email)
					Email.joinInvite(thecode.email,req.param('id'),newcode);
				ev.save(function(err)
				{
					console.log(err);
					return res.json({msg:'ok'});
				});
			});
		});
	},

	remcode:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,ev)
		{
			var index = -1;
			_.each(ev.codes,function(c,i){
				if (c.code == req.param('code'))
					index = i;
					//delete ev.codes[i];
			});
			ev.codes.splice(index, 1);
			ev.save(function()
			{
				return res.json({msg:'ok'});
			});
		});
	},

	addcode:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,ev)
		{
			if (ev.codes == undefined)
				ev.codes = new Array();

			Event.getnewcode(function(code){

				var number = req.param('number');
				if (!_.find(number,'+'))
					number = '+'+number;
				var doit = false;
				if (number && phonenumber(req.param('number')))
				{
					doit = true;
					Nexmo.sendSMS({number:number,code:code});
				}
				if (req.param('email') && ValidateEmail(req.param('email')))
				{
					doit = true;
					Email.joinInvite(thecode.email,req.param('id'),newcode);
					//Email.sendEmail({to:req.param('email'),subject:'Invite to Join a Film Crew',content:'You have been invited to join the Bootlegger film crew for '+ev.name + ". Click the link to accept. " + sails.config.master_url + '/join/'+code});
				}
				if (doit)
				{
					ev.codes.push({number:number,email:req.param('email'),status:'sent',code:code});
					ev.save(function()
					{
						return res.json({msg:'ok'});
					});
				}
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
			// console.log("cheese");
			// console.log(index);

			//fix for bad coverage classes:
			if (!index)
			{
				var coverage_classes = ev.coverage_classes;
				//console.log(coverage_classes);
				_.each(coverage_classes,function(c)
				{
					c.items = [];
				});
	
				//if (!coverage_classes.hasOwnProperty("0"))
				//{
				//console.log("fixing coverage array");
				//fix for non array based coverage class
				var i = 0;
				var tmp = {};
				_.each(coverage_classes,function(e,f)
				{
					tmp[i.toString()] = e;
					i++;
				});
				coverage_classes = tmp;
			}
			
			// if (!ev.coverage_classes[index].items)
			// 	ev.coverage_classes[index].items = [];
				
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
		//console.log("removing coverage");
		var parentindex = req.param('parentindex');
		//console.log(parentindex);
		var index = req.param('index');
		//console.log(index);
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
		var id = req.params.id;
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

	/**
	* @apiDefine Shoot_Participation Shoot Participation
	*
	* The powerful Bootlegger API allows you to create clients which interact with the platform to produce content. 
	* 
	* A client can be interactive and implement the auto-director, allow custom interaction with a template, be implemented on custom hardware or provide an automated way of importing content into a Bootlegger film shoot. In any case, 
	* each client must following this workflow:
	* 1. Get the user to login and obtain a session key
	* 2. List the shoots that the user can contribute to
	* 3. Connect to a given shoot and accept the privacy policy
	* 4. Select a role, and confirm to continue if requested
	* 5. (optional) Download image assets for the shoot template
	* 
	*
	* Shoots are run in either Auto-Director or Pallet Mode. Pallet mode does not nessesitate a live websocket connection to the API.
	* ## Autodirector Mode (AD)
	* 1. Connect socket.io websocket and register for updates
	* 2. Respond to any websocket messages in the appropriate manner, as described in the documentation.
	* 
	* ![Client Message Order](/images/client_messages.png)
	*
	*/

	/**
	 * @api {get} /data/:id.zip Get Shoot Assets
	 * @apiName getshoottemplate
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot Id
	 * @apiSampleRequest off
	 * @apiSuccess {File} .zip Zip file filled with overlay assets
	 * @apiDescription These assets are also available directly from the /data/images and /data/icons URL on the server. Filenames are provided in each shot object in the template. 
	 */

	/**
	 * @api {socket.io get} /api/shoot/join/:id Register as Contributor
	 * @apiName join
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot id
	 *
	 * @apiSuccess {String} msg 'subscribed'
	 */
	sub:function(req,res)
	{
		//subscribe to event feed and direction engine (socket.io)
		if (!req.param('id'))
			return res.json({msg:'no shoot id given'},500);


		req.socket.on('disconnect',function(){
			//console.log('sub_disconn: '+ req.socket.id);

			User.unsubscribe(req.socket,[req.session.passport.user.id]);
			sails.eventmanager.signout(req.param('id'),req.session.passport.user.id);
		});

		//unsubscribe all other people (same users) connected to this event:

		var subscribers = User.subscribers(req.session.passport.user.id);
		_.each(subscribers,function(s)
		{
		//if its not the exact same socket trying to connect now...
		if (s!=req.socket)
		{
					User.publishUpdate(req.session.passport.user.id,{loginelsewhere:true});
					User.unsubscribe(s,[req.session.passport.user.id]);
		}
		});

		User.subscribe(req.socket,[req.session.passport.user.id]);

		res.json({msg:"OK"},200);

		//register this user with the event manager
		sails.eventmanager.signin(req.param('id'),req.session.passport.user.id,req.session.passport.user,false,req.param('force'));
		return res.json({msg:'subscribed'});
	},

	resub:function(req,res)
	{
		User.subscribe(req.socket,[req.session.passport.user.id]);
		sails.eventmanager.signin(req.param('id'),req.session.passport.user.id,req.session.passport.user,true,req.param('force'));
		//console.log('Attempted re-subscribe (after connection drop) with: ' + req.socket.id);
		return res.json({msg:'subscribed'});
	},

	search:function(req,res){
		//console.log("doing search");
		Event.find({ name: { 'contains': req.param('term') }}).exec(function(err,results){
			//console.log(results);
			return res.json(results);
		});
	},

	leaveshoot:function(req,res)
	{
		User.unsubscribe(req.socket,[req.session.passport.user.id]);
		sails.eventmanager.signout(req.param('id'),req.session.passport.user.id);
		return res.json({msg:'ok'});
	},

	/**
	 * @api {socket.io get} /api/shoot/updates/:id Register to Monitor
	 * @apiDescription Register for realtime socket.io events for this shoot.
	 * @apiPermission admin
	 * @apiName monitor
	 * @apiGroup Shoot Management
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot id
	 *
	 * @apiSuccess {String} msg 'Subscribed'
	 */
	updates:function(req,res)
	{
		//this is for the web view (not producing content) to get updates

		if (!req.param('id'))
			return res.json({msg:'no shoot id given'},500);

		//console.log('subscribe to: '+ req.param('id'));
		Event.subscribe(req.socket,[req.param('id')]);
		sails.eventmanager.checkstatus(req.param('id'));
		return res.json({msg:'subscribed'});
	},


    /**
     * Removes limit on number of shoots the can be created by user
     */
    removelimit:function(req,res)
    {
        User.findOne(req.param('id')).exec(function(err,u){
           u.nolimit = 1;
           u.save(function(err,u){
               req.session.flash = {msg:'Limit Removed'};           
               return res.redirect('/event/admin');                            
           });
        });
    },

	/**
	 * @api {socket.io post} /api/shoot/discon/:id Disconnnect
	 * @apiName discon
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot id
	 *
	 * @apiSuccess {String} msg 'logged out'
	 */
	signout:function(req,res)
	{
		if (!req.param('id'))
			return res.json({msg:'no shoot id given'},500);

		sails.eventmanager.disconnect(req.param('id'),req.session.passport.user.id);
		//also remove from server / logout
		var request = require('request');
		//also do this for facebook...
		request('https://mail.google.com/mail/u/0/?logout&hl=en',function(err,res,body)
		{
			req.session.destroy(function(err)
			{
				//req.logout();
				//console.log("done logout");
				return res.json({msg:'logged out'});
			});
		});
	},

    //returns info for an event for role selection, including how many contributors etc:
    info:function(req,res)
    {
        Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (ev)
			{
				var e = ev;
				//cull shottypes from this list which do not match the appropriate leadlocation value
				//var direction = ev.leadlocation;

				var allroles = ev.eventtype.roles;
				//reduce coverage classes down to the same format as last time...

				e.roles = allroles;
				e.ispublic = e.public;
                e.shotrelease = ev.eventtype.shotrelease?ev.eventtype.shotrelease:'';
                e.description = e.eventtype.description;
                delete e.codes;
                delete e.timeline;
                
                // var i = 0;
                // var tmp = {};
                // _.each(ev.eventtype,function(e,f)
                // {
                //     tmp[i.toString()] = e;
                //     i++;
                // });
                var tempcoverage = ev.coverage_classes;
				_.each(tempcoverage,function(el)
				{
					el.items = _.pluck(el.items, 'name');
				});
                
                ev.coverage_classes = tempcoverage;
                
                // ev.eventtype = tmp;
                
                User.findOne(e.ownedby[0]).exec(function(err,user){
                    //extra info:
                    e.organiserprofile = user.profile._json.picture;
                    e.organisedby = user.profile.displayName;
                    
                    Media.find({event_id:e.id}).exec(function(err,media){
                        
                        e.numberofcontributors = _.size(_.unique(media,'created_by'));
                        e.numberofclips = _.size(media);

                        e.icon = (e.icon && e.icon!='') ? sails.config.S3_CLOUD_URL+e.icon : '';
                        e.iconbackground = (e.iconbackground && e.iconbackground!='') ? sails.config.S3_CLOUD_URL+e.iconbackground : '';

                        if (e.roleimg == undefined && ev.eventtype.roleimg != undefined)
                            e.roleimg = sails.config.S3_CLOUD_URL + ev.eventtype.roleimg;

                        if (ev.eventtype.offline!=null)
                            e.offline = ev.eventtype.offline;
                        else
                            e.offline = false;

                        delete e.eventtype;
                        return res.json(e);
                     });
                });
			}
			else
			{
				return res.json(403,{'msg':'No Event Found','status':403});
			}
        });
    },

	/**
	 * @api {socket.io post} /api/shoot/connect/:id Connect
	 * @apiName connect
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot id
	 *
	 * @apiSuccess {Object} shoot Shoot template information
	 */
	subscribe:function(req,res)
	{
		if (!req.params.id)
			return res.json({msg:'no shoot id given'},500);
		//subscribe to messages from a specific event:
		//send message to rest of team
		Event.publishUpdate(req.params.id,{msg: req.session.passport.user.profile.displayName +' signed in to publish',timestamp:new Date().toLocaleDateString()},req.socket);

		//return more information about this event (all the roles, shot types etc)
		Event.findOne(req.params.id).exec(function(err,ev)
		{
			if (ev)
			{
				var e = ev;
				
				//fix for no phases in template:
				if (!e.phases || e.phases.length == 0)
				{
					e.phases = [{name:'Default Phase',description:''}];
				}
				//cull shottypes from this list which do not match the appropriate leadlocation value
				//var direction = ev.leadlocation;

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
				e.shotrelease = ev.eventtype.shotrelease?ev.eventtype.shotrelease:'';
                e.description = ev.eventtype.description;

				e.icon = (e.icon && e.icon!='') ? sails.config.S3_CLOUD_URL+e.icon : '';
				e.iconbackground = (e.iconbackground && e.iconbackground!='') ? sails.config.S3_CLOUD_URL+e.iconbackground : '';

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

                User.findOne(e.ownedby[0]).exec(function(err,user){
                    //extra info:
                    e.organiserprofile = user.profile._json.picture;
                    e.organisedby = user.profile.displayName;
                    
                    delete e.eventtype;
				    return res.json(e,200);
                });
			}
			else
			{
				return res.json({'msg':'No Event Found','status':402},500);
			}
		});
	},

	myeventsowned:function(req,res)
	{
		var foundalready = new Array();

		User.find({}).exec(function(err,users){

			//OWNER
			Event.find(
				{'ownedby': {
	        		contains: req.session.passport.user.id
	      		}}).exec(function(err,data){

				_.each(data,function(d){
					d.status = 'OWNER';
				});
				var output = [];
				_.each(data,function(d)
				{
					if (d.groupevent)
					{
						//console.log("grouping");
						var mm = _.find(users,{id:d.ownedby[0]});
						//console.log(mm);
						if (!_.contains(output,{group:mm.profile.displayName})){
							//console.log('creating group');
							output.push({group:mm.profile.displayName,icon:mm.profile._json.picture,events:[]});
						}
						_.find(output,{group:mm.profile.displayName}).events.push({status:d.status,iconbackground:(d.iconbackground && d.iconbackground!='') ? sails.config.S3_CLOUD_URL+d.iconbackground : '',icon:(d.icon && d.icon!='') ? sails.config.S3_CLOUD_URL+d.icon : '',name:d.name,id:d.id,starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, description:d.eventtype.description,offlinecode:d.offlinecode});
					}
					else
					{
						output.push({status:d.status,iconbackground:(d.iconbackground && d.iconbackground!='') ? sails.config.S3_CLOUD_URL+d.iconbackground : '',icon:(d.icon && d.icon!='') ? sails.config.S3_CLOUD_URL+d.icon : '',name:d.name,id:d.id,starts:d.starts,ends:d.ends,ends_time:d.ends_time,starts_time:d.starts_time, description:d.eventtype.description,offlinecode:d.offlinecode});
					}
				});
				return res.json(output);
			});	
				
		});
	},
    
    /**
	 * @api {get} /api/profile/contributed List Contributed
	 * @apiDescription List all the shoots the user has contributed to
	 * @apiName contributed
	 * @apiGroup Profile
	 * @apiVersion 0.0.2
	 * @apiPermission authenticated
	 *
	 * @apiSuccess {Object[]} List of shoot objects
	 */
	mycontributions:function(req,res)
	{
        Media.find({created_by:req.session.passport.user.id}).exec(function(err,media){
           var events = _.unique(_.pluck(media,'event_id'));
            //from media
            Event.find(events).exec(function(err,all)
            {
                User.find({}).exec(function(err,users){
                    
                    events = _.map(all,function(d){
                        var mm = _.find(users,{id:d.ownedby[0]});
                        return {
                            iconbackground:(d.iconbackground && d.iconbackground!='') ? sails.config.S3_CLOUD_URL+d.iconbackground : '',
                            icon:(d.icon && d.icon!='') ? sails.config.S3_CLOUD_URL+d.icon : '',
                            organiserprofile:(mm!=null)?mm.profile._json.picture : '',
                            name:d.name,
                            id:d.id,
                            starts:d.starts,
                            ends:d.ends,
                            ends_time:d.ends_time,
                            starts_time:d.starts_time, 
                            description:d.eventtype.description,
                            offline:d.eventtype.offline,
                            offlinecode:d.offlinecode,
                            ispublic: d.public
                        };
                    });
                    return res.json(events);
                });
            });   
        });
    },

	/**
	 * @api {get} /api/profile/mine List Shoots
	 * @apiDescription List the current user's shoots
	 * @apiName mine
	 * @apiGroup Profile
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {Array} myevents
	 * @apiSuccess {Array} codeevents
	 * @apiSuccess {Array} publicevents
	 */
	myevents:function(req,res)
	{
		var foundalready = new Array();

		User.find({}).exec(function(err,users){
			//OWNER
			Event.find(
				{'ownedby': {
	        		contains: req.session.passport.user.id
	      		}}).exec(function(err,data){

				_.each(data,function(d){
					d.status = 'OWNER';
					foundalready.push(d);
				});

				//INVITED
				Event.find().where({'codes.uid':req.session.passport.user.id}).exec(function(err,event)
				{
					var codeevents = new Array();
					_.each(event,function(d){
						d.status = 'INVITED';
						foundalready.push(d);
					});

					//CONTRIBUTED
					Media.find({created_by:req.session.passport.user.id}).exec(function(err,media)
					{
						var events = _.pluck(media,'event_id');

						Event.find(events).exec(function(err,all)
						{                            
							_.each(all,function(d)
							{
								d.status = 'INVITED';
								foundalready.push(d);
							});
							
							//PUBLIC
							Event.find().where({public:[1,true]}).exec(function(err,event)
							{
								var publicevents = new Array();
								_.each(event,function(d){
									d.status = 'PUBLIC';
									foundalready.push(d);
								});

								//now remove dupes:
								var nodupes = _.uniq(foundalready,'id');
								
								var output = [];
								_.each(nodupes,function(d)
								{								
                                    var mm = _.find(users,{id:d.ownedby[0]});
                                    //console.log(d.ownedby[0]);
                                    //console.log(mm);
                                    //console.log(d.id + " : "  + mm.id);
									if (d.groupevent)
									{
										//console.log("grouping");
										
										//console.log(mm);
										if (!_.contains(output,{group:mm.profile.displayName})){
											//console.log('creating group');
											output.push({group:mm.profile.displayName,icon:mm.profile._json.picture,events:[]});
										}
										_.find(output,{group:mm.profile.displayName}).events.push({
                                            status:d.status,
                                            iconbackground:(d.iconbackground && d.iconbackground!='') ? sails.config.S3_CLOUD_URL+d.iconbackground : '',
                                            icon:(d.icon && d.icon!='') ? sails.config.S3_CLOUD_URL+d.icon : '',
                                            organiserprofile:mm.profile._json.picture,
                                            name:d.name,id:d.id,
                                            starts:d.starts,
                                            ends:d.ends,
                                            ends_time:d.ends_time,
                                            starts_time:d.starts_time, 
                                            description:d.eventtype.description,
                                            offline:d.eventtype.offline,
                                            offlinecode:d.offlinecode
                                       });
									}
									else
									{
										output.push({
                                            status:d.status,
                                            iconbackground:(d.iconbackground && d.iconbackground!='') ? sails.config.S3_CLOUD_URL+d.iconbackground : '',
                                            icon:(d.icon && d.icon!='') ? sails.config.S3_CLOUD_URL+d.icon : '',
                                            organiserprofile:(mm!=null)?mm.profile._json.picture : '',
                                            name:d.name,
                                            id:d.id,
                                            starts:d.starts,
                                            ends:d.ends,
                                            ends_time:d.ends_time,
                                            starts_time:d.starts_time, 
                                            description:d.eventtype.description,
                                            offline:d.eventtype.offline,
                                            offlinecode:d.offlinecode});
									}
								});
								return res.json(output);
							});
						});
					});
				});
			});
		});
	},

	registercode:function(req,res)
	{
		//find the event that matches the code
		Event.findOne().where({'codes.code':req.param('code')}).exec(function(err,event){
			//find the code that matches this:
			//console.log(event);
			if (event != null)
			{
				_.each(event.codes,function(c){
					if (c.code == req.param('code'))
					{
						c.uid = req.session.passport.user.id;
						c.status = 'linked';
					}
				});
				event.save(function()
				{
					return res.json({msg:'You have been added as a team member to '+event.name,code:200,event_id:event.id},200);
				});
			}
			else
			{
				return res.json({msg:'You have entered an invalid event code',code:401},200);
			}
		});
	},

	/**
	 * @api {get} /api/profile/me Profile Information
	 * @apiName User Profile
	 * @apiGroup Profile
	 * @apiVersion 0.0.2
	 *
	 * @apiSuccess {Object} result Current user's profile information
	 */
	me:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			if (u)
			{
				delete u.pushcode;
			}
			return res.json(u);
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
								output.push({id:el,name:u.profile.displayName,isme:(u.id == req.session.passport.user.id)});
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

	/**
	 * @api {socket.io post} /api/shoot/changephase/:id Change Phase
	 * @apiName changephase
	 * @apiPermission admin
	 * @apiGroup Shoot Management
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Shoot id
	 * @apiParam {Number} phase Phase to change to
	 *
	 * @apiSuccess {String} msg Subscribed
	 */
	changephase:function(req,res)
	{
		Event.findOne(req.param('id'),function(err,ev){
			if (!req.param('id') || err || !ev)
				return res.json({msg:'no shoot found'},500);

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
				return res.json({msg:'Problem Changing Phase'},500);
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
				if (!ev.phases)
					ev.phases = [];
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

	removeadmin:function(req,res){
		Event.findOne(req.param('id'),function(err,ev){
			if (req.param('userid') != req.session.passport.user.id)
			{
				var ix = _.indexOf(ev.ownedby,req.param('userid'));
				ev.ownedby.splice(ix,1);
				ev.save(function(err,e)
				{
					return res.json({msg:'ok'});
				});
			}
			else {
				return res.json({msg:'ok'});
			}
		});
	},

	addadmin:function(req,res)
	{
		//makes this person an admin on this event (if we can find them and they are not already)
		//check for user exists:
		//console.log(req.param('email'));
		User.findOne({'profile.emails.value':req.param('email')}).exec(function(err,u)
		{
			//console.log(u);

			if (u!=null && err==null)
			{
				//console.log(req.params.id);
				Event.findOne(req.param('id'),function(err,ev){
					//console.log(ev);
					if (err==null && ev!=null)
					{
						if (!_.contains(ev.ownedby,u.id))
						{
							//console.log(u);
							ev.ownedby.push(u.id);
							ev.ownedby = _.compact(ev.ownedby);
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
		try{
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
		}
		catch (e)
		{
			console.log(e);
		}
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


		  //console.log(req.method);
		if (req.method == "POST" && req.file('map') != undefined)
		{

			req.file('map').upload(function(err, tt)
			{
				if (err)
				{
					req.session.flash = {msg:err};
					return res.redirect('/event/view/'+req.param('id'));
				}

				if (tt.length != 1)
				{
					req.session.flash = {msg:'No file given'};
					return res.redirect('/event/view/'+req.param('id'));
				}
				var uuid = require('node-uuid');
		 		var fakeid = uuid.v1();
				var filename = fakeid + tt[0].filename;
				var tmp = tt[0].fd;
				var client = knox.createClient(knox_params);
				//fs.copySync(tmp,tmpdir + filename);

				//console.log('ready with file');


				client.putFile(tmp, 'upload/' + filename, {'x-amz-acl': 'public-read'},
		    		function(err, result) {
		    			//done uploading
		    			//console.log('done uploading');
		    			if (err)
		    				console.log("s3 upload error: "+err);

		    			// fs.unlink(tmp, function (err) {
		    			// 	//console.log(err);
		    			// });

		    			Event.findOne(req.param('id')).exec(function(err,m){

							if (!err && m!=undefined)
							{
								m.eventtype.roleimg = filename;
								m.save(function(err){
									req.session.flash = {msg:"Upload Complete"};
									res.redirect('/event/view/'+req.param('id'));
								});
							}
							else
							{
								req.session.flash = {msg:"Error Uploading Image"};
								res.redirect('/event/view/'+req.param('id'));
							}
						});
		    		});
			});
		}
		else
		{
			res.redirect('/event/view/'+req.param('id'));
		}
	},

	background:function(req,res)
	{
		var knox = require('knox');
		//upload map file for an event role:
		var knox_params = {
		    key: sails.config.AWS_ACCESS_KEY_ID,
		    secret: sails.config.AWS_SECRET_ACCESS_KEY,
		    bucket: sails.config.S3_BUCKET
		  }

		  //console.log(req.method);
		if (req.method == "POST" && req.file('image') != undefined)
		{
			req.file('image').upload(function(err, tt)
			{
				var uuid = require('node-uuid');
	 			var fakeid = uuid.v1();
				var filename = fakeid + tt[0].filename;
				var tmp = tt[0].fd;
				var client = knox.createClient(knox_params);
				try
				{
				lwip.open(tmp, function(err, image) {
				    if (err)
					{
						req.session.flash = {msg:"Error Uploading Image"};
						return res.redirect('/event/view/'+req.param('id'));
					}
				    image.cover(600,250,function(err, image){
				        image.writeFile(tmp+"_small.png", function(err){
				            if (err)
							{
								req.session.flash = {msg:"Error Uploading Image"};
								return res.redirect('/event/view/'+req.param('id'));
							}
							client.putFile(tmp+"_small.png", 'upload/' + filename + ".png", {'x-amz-acl': 'public-read'},
					    		function(err, result) {
					    			//done uploading


					    			console.log('done uploading');
					    			if (err)
					    				console.log("s3 upload error: "+err);

					    			Event.findOne(req.param('id')).exec(function(err,m){

										if (!err && m!=undefined)
										{
											m.iconbackground = filename + ".png";
											m.save(function(err){
												req.session.flash = {msg:"Upload Complete"};
												res.redirect('/event/view/'+req.param('id'));
											});
										}
										else
										{
											req.session.flash = {msg:"Error Uploading Image"};
											res.redirect('/event/view/'+req.param('id'));
										}
									});
					    		});
					        });
					    });
					});
				}
				catch (e)
				{
					req.session.flash = {msg:"Error Uploading Image"};
					return res.redirect('/event/view/'+req.param('id'));
				}
			});

		}
		else
		{
			res.redirect('/event/view/'+req.param('id'));
		}
	},

	clearbackground:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,m){

			if (!err && m!=undefined)
			{
				m.iconbackground = "";
				m.save(function(err){
					console.log(err);
					req.session.flash = {msg:"Background removed!"};
					res.redirect('/event/view/'+req.param('id'));
				});
			}
			else
			{
				req.session.flash = {msg:"Error Removing Background"};
				res.redirect('/event/view/'+req.param('id'));
			}
		});
	},

	clearicon:function(req,res)
	{
		Event.findOne(req.param('id')).exec(function(err,m){

			if (!err && m!=undefined)
			{
				m.icon = "";
				m.save(function(err){
					req.session.flash = {msg:"Icon removed!"};
					res.redirect('/event/view/'+req.param('id'));
				});
			}
			else
			{
				req.session.flash = {msg:"Error Removing Icon"};
				res.redirect('/event/view/'+req.param('id'));
			}
		});
	},

    featured:function(req,res)
    {
        User.find({}).exec(function(err,users){
            Event.find({where:{public:1},sort:'starts DESC',limit:12}).exec(function(err,shoots){
                _.each(shoots,function(e){
                    var mm = _.find(users,{id:e.ownedby[0]});
                    e.icon = (e.icon && e.icon!='') ? sails.config.S3_CLOUD_URL+e.icon : '';
                    e.iconbackground = (e.iconbackground && e.iconbackground!='') ? sails.config.S3_CLOUD_URL+e.iconbackground : '';
                    delete e.eventtype;
                    delete e.apikey;
                    e.organiserprofile = (mm!=null)?mm.profile._json.picture : '';
                });
                return res.json(_.sample(shoots,6));
            });
        });
    },

	image:function(req,res)
	{
		var knox = require('knox');
		//upload map file for an event role:
		var knox_params = {
		    key: sails.config.AWS_ACCESS_KEY_ID,
		    secret: sails.config.AWS_SECRET_ACCESS_KEY,
		    bucket: sails.config.S3_BUCKET
		  }

		  //console.log(req.method);
		if (req.method == "POST" && req.file('image') != undefined)
		{
			req.file('image').upload(function(err, tt)
			{

				var uuid = require('node-uuid');
	 			var fakeid = uuid.v1();
				var filename = fakeid + tt[0].filename;
				var tmp = tt[0].fd;
				var client = knox.createClient(knox_params);

			try
			{
				lwip.open(tmp, function(err, image) {
				    if (err)
					{
						req.session.flash = {msg:"Error Uploading Image"};
						return res.redirect('/event/view/'+req.param('id'));
					}
				    image.cover(100,100,function(err, image){
				        image.writeFile(tmp+"_small.png", function(err){
				            if (err)
							{
								req.session.flash = {msg:"Error Uploading Image"};
								return res.redirect('/event/view/'+req.param('id'));
							}
							client.putFile(tmp+"_small.png", 'upload/' + filename + ".png", {'x-amz-acl': 'public-read'},
					    		function(err, result) {
					    			//done uploading
					    			//console.log('done uploading');
					    			if (err)
					    				console.log("s3 upload error: "+err);

					    			Event.findOne(req.param('id')).exec(function(err,m){

										if (!err && m!=undefined)
										{
											m.icon = filename + ".png";
											m.save(function(err){
												req.session.flash = {msg:"Upload Complete"};
												res.redirect('/event/view/'+req.param('id'));
											});
										}
										else
										{
											req.session.flash = {msg:"Error Uploading Image"};
											res.redirect('/event/view/'+req.param('id'));
										}
									});
					    		});
					        });
					    });
					});
			}
			catch (e)
			{
				req.session.flash = {msg:"Error Uploading Image"};
				return res.redirect('/event/view/'+req.param('id'));
			}

			});
		}
		else
		{
			res.redirect('/event/view/'+req.param('id'));
		}
	},

	/**
	 * @api {socket.io post} /api/shoot/registerpush/:id Register for Push Notifications
	 * @apiName push
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	* @apiParam {String} pushcode Pushcode for platform
	* @apiParam {String} platform Platform of device
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	registerpush:function(req,res)
	{
		if (!req.param('pushcode') || !req.param('platform'))
			return res.json({msg:'no pushcode or platform given'},500);

		//add push code to the session:
		req.session.pushcode = req.param('pushcode');
		req.session.platform = req.param('platform');

		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			if (u)
			{
				u.pushcode = req.param('pushcode');
				u.platform = req.param('platform');
				u.save(function(err)
				{
					return res.json({msg:'ok'},200);
				});
			}
			else
			{
				return res.json(500,{msg:'no user found'});
			}
		});
	},

	triggeradd:function(req,res)
	{
		console.log("new event triggered: "+req.param('id'));
		sails.eventmanager.addevent(req.param('id'));
		res.json({});
	},


	/**
	 * @api {post} /api/shoot/create Create New Shoot
	 * @apiName create
	 * @apiGroup Shoot Management
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} eventtype Shoot Template to Use
	 * @apiParam {String} name Shoot Name
	 * @apiParam {Date} starts Start Date
	 * @apiParam {Date} start_time Start Time
	 * @apiParam {Date} ends End Date
	 * @apiParam {Date} end_time End Time
	 * @apiSuccess {String} msg Subscribed
	 */
	addevent:function(req,res,next)
	{
		if (!req.param('agree'))
		{
			req.session.flash = {msg:'Please agree to the terms and conditions.'};
			return res.redirect('/commission/new');
		}

		if (!req.param('eventtype'))
		{
				return res.json({msg:'no template given'},500);
		}

		//do save
		EventTemplate.findOne(req.param('eventtype')).exec(function(err,myev)
		{
			if (err || !myev)
				return res.json({msg:'no template found'},500);



			//console.log(myev);
			//var myev = tys[req.param('eventtype')];
			//console.log(myev);
			var coverage_classes = myev.coverage_classes;
			//console.log(coverage_classes);
			_.each(coverage_classes,function(c)
			{
				c.items = [];
			});

			//if (!coverage_classes.hasOwnProperty("0"))
			//{
			//console.log("fixing coverage array");
			//fix for non array based coverage class
			var i = 0;
			var tmp = {};
			_.each(coverage_classes,function(e,f)
			{
				tmp[i.toString()] = e;
				i++;
			});
			coverage_classes = tmp;
			//}

			//console.log(coverage_classes);

			//add in missing modules:
			if (!myev.post_modules)
			{
				myev.post_modules = {};
				_.each(_.pluck(sails.eventmanager.post_modules,'codename'),function(m)
				{
					myev.post_modules[m] = 0;
				});
			}

			if (!myev.shoot_modules)
			{
				myev.shoot_modules = {};
				_.each(_.pluck(sails.eventmanager.event_modules,'codename'),function(m)
				{
					myev.shoot_modules[m] = 0;
				});

				//var lastone = _.last(_.pluck(sails.eventmanager.event_modules,'codename'));
				myev.shoot_modules['marathondirector'] = "1";
			}

			if (!myev.ruleset)
			{
				myev.ruleset = [{direction_engine:'manual', name:'manual', pre_time:0}];
			}


			var meta_modules = myev.meta_modules;
			var post_modules = myev.post_modules;
			var shoot_modules = myev.shoot_modules;
			var phases = myev.phases;

            // 'offlinecode' is actually used as the shortlink for sharing...
			Event.getnewcode(function(code){
				//console.log(myev);

				var whichserver = sails.config.hostname + ':' + sails.config.port;

				//var e = req.params.all();
				//console.log(req.params.all());
				var neevent = _.extend(req.params.all(),{publicshare:0,public:1,publicview:1,eventtype:myev,ownedby:[req.session.passport.user.id],meta_modules:meta_modules,post_modules:post_modules,shoot_modules:shoot_modules,coverage_classes:coverage_classes,offlinecode:code, codes:[], phases:phases});
				delete neevent.id;
				neevent.created_by = req.session.passport.user.id;
				var regex = /(<([^>]+)>)/ig;
        		var newval = neevent.name.replace(regex,"");
				neevent.name = newval;

				Event.create(neevent,function(err,event){

					//event.ownedby = [];
					// if (event.ownedby == undefined)
					// 	event.ownedby = new Array();
					//event.ownedby.push(req.session.passport.user.id);
					//event.save(function(){
				    console.log(err);
					if (err)
					{
						//console.log("error adding event");
						req.session.flash = {err:err.ValidationError};

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


								//console.log(body);

								//console.log("server:"+whichserver);
								//console.log("me:"+sails.hostname + ':'+ sails.port);
								//console.log(err);

								//set default event id in session
								//console.log('new event id: '+event.id);
								//req.session.passport.user.currentevent = event.id;
								//req.session.event = event.id;
								//req.session.save();

								if (sails.localmode || sails.hostname == whichserver || err)
								{
									//get which host is supposed to run this event:
									console.log("adding event to director")
									sails.eventmanager.addevent(event.id);
								}

								console.log("whichserver: " + whichserver);

								event.server = whichserver;
								event.save(function(err){

									//console.log(req.session.User);
									// User.findOne(req.session.passport.user.id).exec(function(err,user){
									if (err)
									{
										//console.log(err);
										req.session.flash = {err:err};
										return res.redirect('/commision/new');
									}
									// 	else
									// 	{
									// 		//console.log(user);
									// 		//user.currentevent = event.id;
											// user.save(function(err)
											// {
												//console.log("redirect to view");
									if (req.param('adjust'))
									{
										return res.redirect('/commission/'+event.id);
									}
									else
									{
										return res.redirect('/event/view/'+event.id);
									}
											// }); //end user update

										// } // end if err
									// });	//end user find
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

	/**
	 * @api {socket.io post} /api/shoot/startrecording Start Recording
	 * @apiName record
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	  * @apiParam {String} eventid Shoot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	startrecording:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg:'no eventid given'},500);

		sails.eventmanager.startrecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/stoprecording Stop Recording
	 * @apiName stoprecord
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	  * @apiParam {String} eventid Shoot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	stoprecording:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg:'no eventid given'},500);

		sails.eventmanager.stoprecording(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},

	
	/**
	 * @api {socket.io post} /api/shoot/holdrecording (AD) Keep Current Allocation
	 * @apiName hold
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	  * @apiParam {String} eventid Shoot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
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

	/**
	 * @api {socket.io post} /api/shoot/selectrole Select Role
	 * @apiName selectrole
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	  * @apiParam {String} eventid Shoot id
	 * @apiParam {Number} roleid Role id
	 * @apiParam {Boolean} confirm Confirmed role
	 *
	 * @apiSuccess {String} msg Subscribed
	 */
	chooserole:function(req,res)
	{
		//console.log(req.allParams());
		if (!req.param('eventid') || typeof req.param('roleid') == 'undefined')
			return res.json({msg:'no eventid or roleid given'},500);

		sails.eventmanager.chooserole(res, req.param('eventid'),req.session.passport.user.id, req.param('roleid'), req.param('confirm'));
		return;
	},

	/**
	 * @api {socket.io post} /api/shoot/acceptrole (AD) Accept Role
	 * @apiName acceptrole
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 * @apiParam {Number} roleid Role id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	acceptrole:function(req,res)
	{
		//console.log(req.allParams());

		if (!req.param('eventid') || typeof req.param('roleid') == 'undefined')
			return res.json({msg:'no eventid or roleid given'},500);

		sails.eventmanager.acceptrole(req.param('eventid'),req.session.passport.user.id,req.param('roleid'));
		return res.json({msg:'ok'},200);
	},

	rejectrole:function(req,res)
	{
		f (!req.param('eventid') || typeof req.param('roleid') == 'undefined')
			return res.json({msg:'no eventid or roleid given'},500);

		sails.eventmanager.rejectrole(req.param('eventid'),req.session.passport.user.id,req.param('roleid'));
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/acceptshot (AD) Accept Shot
	 * @apiName acceptshot
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 * @apiParam {Number} shotid Shot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	acceptshot:function(req,res)
	{
		if (!req.param('eventid') || typeof req.param('shotid') == 'undefined')
			return res.json({msg:'no eventid or shotid given'},500);

		sails.eventmanager.acceptshot(req.param('eventid'),req.session.passport.user.id,req.param('shotid'));
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/rejectshot (AD) Reject Shot
	 * @apiName rejectshot
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 * @apiParam {Number} shotid Shot id
	 *
	 * @apiSuccess {String} msg Subscribed
	 */
	rejectshot:function(req,res)
	{
		if (!req.param('eventid') || typeof req.param('shotid') == 'undefined')
			return res.json({msg:'no eventid or shotid given'},500);

		sails.eventmanager.rejectshot(req.param('eventid'),req.session.passport.user.id,req.param('shotid'));
		return res.json({msg:'OK'},200);
	},

	// triggerinterest:function(req,res)
	// {
	// 	sails.eventmanager.triggerinterest(req.param('eventid'),req.session.passport.user.id,req.param('roleid'),req.param('shotid'));
	// 	return res.json({msg:'OK'},200);
	// },

	/**
	 * @api {socket.io post} /api/shoot/ready:id (AD) Ready to Shoot
	 * @apiName ready
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	ready:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg:'no eventid given'},500);

		sails.eventmanager.ready(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/notready:id (AD) Not-Ready to Shoot
	 * @apiName notready
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
  notready:function(req,res)
  {
    if (!req.param('eventid'))
      return res.json({msg:'no eventid given'},500);

    sails.eventmanager.notready(req.param('eventid'),req.session.passport.user.id);
    return res.json({msg:'ok'},200);
  },

	/**
	 * @api {socket.io post} /api/shoot/leverole/:id Leave Role
	 * @apiName leaverole
	 * @apiGroup Shoot_Participation
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot id
	 * @apiParam {Number} shotid Shot id
	 * 
	 * @apiSuccess {String} msg 'ok'
	 */
	unselectrole:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg: 'no shoot id given'},500);

		sails.eventmanager.unselectrole(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/started (AD) Start Shoot
	 * @apiName started
	 * @apiGroup Shoot Management
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot Id
	 *
	 * @apiSuccess {String} msg Subscribed
	 */
	started:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg: 'no shoot id given'},500);
		sails.eventmanager.eventstarted(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},

	/**
	 * @api {socket.io post} /api/shoot/pause (AD) Pause Shoot
	 * @apiName paused
	 * @apiPermission admin
	 * @apiGroup Shoot Management
	 * @apiVersion 0.0.2
	 * @apiParam {String} eventid Shoot Id
	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	pause:function(req,res)
	{
		if (!req.param('eventid'))
			return res.json({msg: 'no shoot id given'},500);
		//console.log("trying pause"+req.param('eventid'));
		sails.eventmanager.eventpaused(req.param('eventid'),req.session.passport.user.id);
		return res.json({msg:'ok'},200);
	},
    
    /**
     * Displays public facing shortlink for a shoot -- which can be shared on social media
     */
    shortlink:function(req,res)
    {
        //console.log(req.param('shortlink'));
		if (!req.param('shortlink'))
		{
			req.session.flash = {error:'Sorry, that\'s not a link we recognise.'};
			return res.redirect('/dashboard');
		}

		Event.findOne({offlinecode:req.param('shortlink')}).exec(function(err,event){
			if (event && event.public)
			{
                
                User.findOne(event.ownedby[0]).exec(function(err,user){
                    res.locals.user = false;
                    res.locals.event = false;
                    res.locals.flash = false;
                    res.locals.action='error';
                    res.locals.rtl = false;
                    res.locals.notonthisserver = false;
                    res.locals.apikey='';
                    var starts = moment(event.starts,"DD-MM-YYYY");
                    var ends = moment(event.ends,"DD-MM-YYYY");
                    var issameday = starts.isSame(ends,'day');
                    if (issameday)
                        event.datetext = starts.format('dddd, MMMM Do YYYY') + ' ' + event.starts_time + ' - ' + event.ends_time;
                    else
                        event.datetext = event.starts_time + ' on ' + starts.format('dddd, MMMM Do YYYY') + ' to ' + event.ends_time + ' ' + ends.format('dddd, MMMM Do YYYY');
                        
                    event.icon = (event.icon && event.icon!='') ? sails.config.S3_CLOUD_URL+encodeURIComponent(event.icon) : false;
                    if (!event.icon)
                    {
                        //console.log(user);
                        if (user.profile.photos)
                        event.icon = user.profile._json.picture;
                    }
                    event.iconbackground = (event.iconbackground && event.iconbackground!='') ? sails.config.S3_CLOUD_URL+encodeURIComponent(event.iconbackground) : '';
                    //console.log(ends.diff(moment()));
                    event.closed = ends.isBefore(moment());
                    event.user = user;
                    
                    var MobileDetect = require('mobile-detect'),
                    md = new MobileDetect(req.headers['user-agent']);
                    
                    Media.find({event_id:event.id}).exec(function(err,media){
                        var contr = media.length;
                        var users = _.unique(media,'created_by').length;
                        
                        event.mediacount = contr;
                        event.usercount = users;
                        res.view({publicevent:event,mobile:md});                                    
                    });
                });
			}
			else
			{
				req.session.flash = {error:'Sorry, that\'s not a link we recognise.'};
				return res.redirect('/dashboard');
			}
		});
    }
};
