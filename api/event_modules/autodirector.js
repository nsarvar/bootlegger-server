var _ = require('lodash');
var moment = require('moment');

		function selectcoverage(event)
		{
			var total = 0;
			var done = false;

			var dist = [];
			//changed to be uniform distribution weighting:#
			var total = 0;
			_.each(module.exports.AllEvents[event.id].coverageweights,function(c,i)
			{
				if (c.percentage !== undefined)
				{
					dist[i] = 1/((c.weight+1) / c.percentage);
					total += dist[i];
				}
			});

			console.log("total dist: " + total);
			_.each(dist,function(c,i)
			{
				dist[i] = (dist[i] / total);
			});

			console.log("distribution: "+dist);
			var rand = Math.random();
			console.log("picking: " + rand);
			var cumm = 0;
			_.each(dist,function(c,i)
			{
				cumm += c;
				if (rand < cumm && done===false)
				{
					done = i;
				}				
			});

			//no clear weight or no weight, so defaulting...
			if (!done)
			{
				console.log('no coverage classes so defaulting to first one (most obvious)');
				done = 0;
				//console.log(done);
			}
			return done;
		}

		function allocateshot(user,event)
		{
			//this increments the shot in the role when a new one is requested (either a reject or every time they stop being live);
			_.each(event.data.eventtype.roles,function(role){
				if (role.id == user.role && !user.waitingforshotreply)
				{
					
					//CALCULATE WHICH PERSON TO TAKE A SHOT OF
					var coverage_direction = undefined;
					var meta = undefined;
					// shots from my role:
					var allowedshotids = role.shot_ids;
					var sid;


					/** shot_ids LOGIC **/

					/** LIST SHOTS THAT USERS ALREADY HAVE (and running) i.e. waiting for shot reply == false**/
					var alreadyallocated = [];
					_.each(event.users,function(u)
					{
						if (u.id != user.id) //its not me
							//if (u.waitingforshotreply == false)
					    	alreadyallocated.push(u.shot);
					});
					//update filter
					allowedshotids = _.difference(allowedshotids,alreadyallocated);
					//console.log("already allocated: "+alreadyallocated);
					//filter by wanted coverage and direction

					//if this list is long, remove the shot I def said no to...
					if (user.rejectshot)
					{
						sid = user.rejectshot; //rejected shot
						user.rejectshot = false;
						//remove the one that you just asked for
						allowedshotids = _.without(allowedshotids,sid);
					}


					//sum coverage class totals:
					var wantedcoverage = selectcoverage(event);

					//in this coverage, choose a person / meta and get their direction
					var meta = "";
					var tags = module.exports.AllEvents[event.id].coverageweights[wantedcoverage].items;
					console.log("In "+ wantedcoverage + ", pick from: "+ tags);
					var chosen = _.sample(tags);
					if (chosen)
					{
						console.log("chosen " + chosen.name);
						meta = chosen.name;
						//console.log('selected: '+meta);
						coverage_direction = chosen.direction;
					}
					else
					{
						meta = module.exports.AllEvents[event.id].coverageweights[wantedcoverage].name;
					}
					
					console.log("allowed shot ids: "+allowedshotids);

					//reset rejection
 
					//filter for shots that are for this specific coverage class, or all of them
					allshottypes = _.pluck(_.filter(event.data.eventtype.shot_types,function(el){
							return (el.coverage_class == wantedcoverage);
						}),'id');
					console.log("Shots of coverage ("+wantedcoverage+"): "+allshottypes);

					//only keep ones that are in both lists
					allowedshotids = _.intersection(allowedshotids, allshottypes);

					if (allowedshotids.length == 0)
					{
						console.log("no shots, dont do coverage selection");
						allowedshotids = allowedshotids = _.difference(allowedshotids,alreadyallocated);
						if (sid)
							allowedshotids = _.without(allowedshotids,sid);
					}
					else
					{
						console.log("shots to pick after coverage selection: "+allowedshotids);

						if (allowedshotids.length > 0)
						{

							//get all shot types with matching direction
							if (coverage_direction != undefined)
							{
								var allshottypes = _.pluck(_.filter(event.data.eventtype.shot_types,function(el){
									return (el.frame_position == undefined || el.frame_position == coverage_direction);
								}),'id');
								//only keep ones that are in both lists
								allowedshotids = _.intersection(allowedshotids, allshottypes);
								console.log("shots to pick after direction filter ("+coverage_direction+"): "+allowedshotids);
							}
							else //no direction defined, so pick from all shots:
							{
								//do nothing...
							}
						}
					}

					console.log("shots to pick from: "+ allowedshotids);

					/** PICK A RANDOM SHOT FROM THE ONES AVAILABLE **/
					var shottosend = _.sample(allowedshotids);
					user.shot = shottosend;
					console.log("shot selected: "+user.shot);
					/** TELL USER ABOUT THIS SHOT **/
					User.publishUpdate(user.id,{getshot:user.shot, meta:meta, coverage_class:wantedcoverage});
					user.waitingforshotreply = true;
					Log.logmore('autodirector',{msg:'shot allocation',eventid:event.id,userid:user.id,shot:user.shot,meta:meta});
				}
			});
		};


//auto_director
module.exports = {
	codename:'autodirector',
	name:'Auto-Director',
	AllEvents: {},
	cameragap:1,
	UserTimings:
	{
		1:[0],
		2:[0,16],
		3:[0,16,32]
	},

	//initialise the events array
	init:function(multiserver)
	{
		Event.find({}).exec(function(err,ev)
		{
			_.each(ev,function(e)
			{
				//if this server is running it
				if (e.eventtype.shoot_modules[module.exports.codename] == 1)
				{
					//console.log(e.server);
					if (e.server == sails.hostname || !e.server || sails.multiserveronline==false)
					{

						//calc coverage classes:
						var coverage = e.coverage_classes;
						_.each(coverage,function(c,i)
						{
							c.weight = 0;
						});
						//get media:
						//console.log(e.id);
						Media.find({event_id:e.id},function(err,media)
						{
							//console.log(media);
							_.each(media, function(m)
							{
								//console.log(m);
								if (m.meta.static_meta.coverage_class)
									coverage[m.meta.static_meta.coverage_class].weight++;
							});
							
							module.exports.AllEvents[e.id] = {
								id : e.id,
								data : e,
								clock : 0,
								hasstarted : false,
								currentphase : 'stopped',
								coverageweights:coverage,
								users:{}
							}
							module.exports.longpoll();
						});
					}
				}
			});
		});
	},

	addevent:function(eventid)
	{
		if (module.exports.AllEvents[eventid] == undefined)
		{
			Event.findOne(eventid).exec(function(err,e)
			{
				var coverage = e.coverage_classes;
				_.each(coverage,function(c,i)
				{
					c.weight = 0;
				});
				//get media:
				Media.find({event_id:eventid},function(err,media)
				{
					_.each(media, function(m)
					{
						//console.log(m);
						if (m.meta.static_meta.coverage_class)
							coverage[m.meta.static_meta.coverage_class].weight++;
					});
					module.exports.AllEvents[e.id] = {
							id : e.id,
							data : e,
							clock : 0,
							hasstarted:false,
							currentphase : 'stopped',
							users:{},
							coverageweights:coverage,
						};
					module.exports.longpoll();
				});
			});
		}
		else
		{
			module.exports.longpoll();
		}
	},

	//when a file has been uploaded
	process:function(req,media)
	{
		//console.log(media);
		if (!media.path)
		{
			
			//initial import
			//META DATA CHECK
			if (media.meta.static_meta.length < 11)
			{
				User.publishUpdate(media.meta.created_by,{msg:"It would be really helpful to have some extra information about your clips - try adding some!"});
			}

			//calculate new coverage weights:
			var eventid = media.event_id;

			//console.log("processing: ");
			//console.log(media);

			//if the shot has coverage information:
			if (_.has(media.meta.static_meta,'coverage_class'))
			{
				//console.log('captured coverage of '+ media.meta.static_meta.coverage_class);
				module.exports.AllEvents[eventid].coverageweights[media.meta.static_meta.coverage_class].weight++;
			}
			else
			{
				//no coverage class, so add to unknown pot:
				if (!_.has(module.exports.AllEvents[eventid].coverageweights,'unknown'))
				{
					module.exports.AllEvents[eventid].coverageweights.unknown = {weight:0};
				}

				module.exports.AllEvents[eventid].coverageweights.unknown.weight++;
			}

			//console.log('updated coverage: '+ module.exports.AllEvents[eventid].coverageweights);

			//console.log(module.exports.AllEvents[eventid].coverageweights);
			//CHECK FOR CLIP LENGTH -- too long or too short
			//CHECK IF THIS PERSON KEEPS FILMING THE SAME THING
		}
		return;
	},

	//only happens every so often (once a min)
	longpoll:function()
	{
		var moment = require('moment');
		var now = moment();
		//check for event modes changed
		Event.find({}).exec(function(err,ev)
		{
			_.each(ev,function(e){

				//console.log('long poll ' + e.name);

				if (e.server == sails.hostname || !e.server || sails.multiserveronline==false)
				{

				//console.log(e);
				//compare event start time 
				var starttime = moment(e.starts + " " + e.starts_time,"DD-MM-YYYY h:mma");
				var endtime = moment(e.ends + " " + e.ends_time,"DD-MM-YYYY h:mma");


				if (now > endtime)
				{
					//console.log("not in date");
					if (module.exports.AllEvents[e.id] && module.exports.AllEvents[e.id].currentphase!='stopped')
					{
						module.exports.AllEvents[e.id].currentphase = 'stopped';
						Event.publishUpdate(e.id,{phase:'stopped'});
					}
				}
				else
				{
					//console.log('checking phase');
					var current = '';
					var ruleset = '';
					//for each ruleset, work out which phase the event is in:
					_.each(e.eventtype.ruleset,function(i,k,l)
					{
						if (current=='')
						{
							//console.log('start: '+starttime.format('llll'));
							//console.log('pre: '+i.pre_time);
							//console.log('pre: '+starttime.subtract('m', i.pre_time).format('llll'));

							//if now > starts - pre
							if (now > (starttime.subtract('m', i.pre_time)))
							{
								//console.log('within: '+i.direction_engine);
								current = i.direction_engine;
								ruleset = i.name;
							}
						}
					});

					if (current == '')
					{
						current = 'stopped';
						//console.log('stopping as no direction');
					}

					//update coverage:
					var coverage = e.coverage_classes;
					_.each(coverage,function(c,i)
					{
						c.weight = 0;
					});
					//get media:
					Media.find({event_id:e.id},function(err,media)
					{
						_.each(media, function(m)
						{
							//console.log(m);
							if (m.meta.static_meta.coverage_class)
								coverage[m.meta.static_meta.coverage_class].weight++;
						});


						if (module.exports.AllEvents[e.id])
						{
							module.exports.AllEvents[e.id].data = e;
							module.exports.AllEvents[e.id].coverageweights = coverage;
						}

						if (module.exports.AllEvents[e.id] && module.exports.AllEvents[e.id].currentphase!=current)
						{
							//update data:
							
							module.exports.AllEvents[e.id].currentphase = current;
							module.exports.AllEvents[e.id].ruleset = ruleset;
							Event.publishUpdate(e.id,{phase:current,ruleset:ruleset});
							_.each(module.exports.AllEvents[e.id].users,function(u)
							{
								User.publishUpdate(u.id,{modechange:module.exports.AllEvents[e.id].currentphase});
							});
						}
					});
				}

			}//end of server check

				//DEBUG - REMOVE!!!
				//module.exports.AllEvents[e.id].currentphase = 'manual';
				//module.exports.AllEvents[e.id].ruleset = 'interviews';
				//Event.publishUpdate(e.id,{phase:current,ruleset:ruleset});
			});
		});
	},

	//triggered on a timer
	trigger:function()
	{
		//check mode:
		//console.log(module.exports.AllEvents);
		_.each(module.exports.AllEvents,function(i,k,l)
			{
				var event = module.exports.AllEvents[k];

				//Check heartbeats
				
				_.each(event.users,function(u){
					var mom = moment(u.lasthearbeat);
					//console.log("checking heartbeat: "  + mom.diff(moment(),'seconds') +"s");
					if (mom.diff(moment(),'seconds') < -18) //more than 18 seconds kicks out
					{
						//fail
						console.log('missing heartbeat');
						Log.logmore('autodirector',{msg:'User kicked from missing heartbeat',userid:u.id,eventid:event.id});
						delete event.users[u.id];

						//check for a single users???
						
						//update rest of the state:
						Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
					}
				});

				if (event.hasstarted)
				{
					//if the event is in timed mode and there are more than 1 user:
					if (event.currentphase == 'timed' && _.size(event.users) > 1)
					{

						//CLOCK CALCULATION!
						var maxuser = _.max(event.users, function(u){ return u.offset; });
						var maxtime = maxuser.warning + maxuser.live + maxuser.length + module.exports.cameragap;
						//console.log("maxtime: "+maxtime);
						if (event.clock > maxtime)
						{
							event.clock = 0;
						}
						Event.publishUpdate(event.id,{timer:event.clock});
						event.clock++;

						//for each user, calculate what they should be doing.
						_.each(event.users,function(i,k,l)
						{
							var magicnumber = i.warning + i.live + i.length + module.exports.cameragap;
							//calculate the offset:
							var myoffset = (event.clock - i.offset) % magicnumber;
							if (myoffset < 0) // fix circular timeline
							{
								myoffset+=magicnumber;
							}

							//console.log(i.name + " " + myoffset);

							//if role has been set for the first time (so status is still waiting) -- should not get to this case
							if (i.status == 'waiting' && i.role==-1)
							{
								i.status = 'allocating';
								Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
								User.publishUpdate(i.id,{msg:"We are currently allocating your first role."});
							}

							//check they have not JUST signed in (and stop throwing in the deep end)
							//console.log("offset: "+myoffset);
							if (i.status == 'waiting' && i.role!=-1 && (myoffset < i.warning || myoffset > (i.warning + i.live + i.length)))
							{
								i.status = 'allocating';
								Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
							}

							//IF NOT WAITING FOR USER INPUT (INITIAL LOGIN), AND HAS A SHOT ALLOCATED (NOT JUMPED IN ACCIDENTALLY)
							if (i.status != 'waiting' && i.status != 'new' && i.status!='lost')
							{

								//ALLOCATING: ready to accept new shot request
								//console.log("check for allocation: " + myoffset);
								if (myoffset < 0 || myoffset >= i.warning+i.live+i.length)
								{
									console.log('checking allocation');
									//check that the user doe not have to stay on...
										if (i.status != 'allocating')
										{
											var canallocate = true;
											//check if you can pull them from being live:
											if (i.status == 'live')
											{
												var userslive = 0;
												_.each(event.users,function(u,k,l)
												{
													//if other user is live and its not me
													if (u.status == 'live' && u.id != i.id)
													{
														userslive++;
													}
												});
												//console.log(userslive);
												//if there are no other people live, and I am not already extended live
												if (userslive == 0 && i.extendedlive != true)
												{
													//console.log('no others live, make continue this person live');
													Log.logmore('autodirector',{msg:'extended live',eventid:event.id,userid:i.id});
													canallocate = false;
													i.extendedlive = true;
													User.publishUpdate(i.id,{msg:"You have to keep on a little while, as there are no other people live at the moment."});
												}
												
												if (userslive > 0 && i.extendedlive == true)
												{
													//recalculate exteded live valid:
													//ok to allocate
													canallocate = true;
													i.extendedlive = false;
												}
											}
											//console.log('extendedlive: '+i.extendedlive);
											if (canallocate && i.extendedlive == false)
											{
												//console.log('calculating allocation');
												i.extendedlive = false;
												i.status = 'allocating';
												//console.log(event.users);
												User.publishUpdate(i.id,{msg:"We are currently allocating you a new shot"});
												//stop live!!
												Log.logmore('autodirector',{msg:'stop live',eventid:event.id,userid:i.id});
												User.publishUpdate(i.id,{live:false});
												Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});

												//send a new shot allocation out if this user does not want to hold the shot:
												if (!i.hold)
												{
													Log.logmore('autodirector',{msg:'allocating a new shot as not holding',userid:i.id,eventid:event.id});
													allocateshot(i,event);
												}
												else
												{
													i.hold = false;
													Log.logmore('autodirector',{msg:'holding, no shot allocation',userid:i.id,eventid:event.id});
													User.publishUpdate(i.id,{msg:"Just stay with that shot..."});
												}
											}
										}



										//if allocating and rejected last shot
										if (i.status == 'allocating' && !i.shot && !i.hold)
										{
											Log.logmore('autodirector',{msg:'re-allocating a rejected shot',userid:i.id});
											allocateshot(i,event);
										}
									// }
								}

								
								//WARINING: within the warning time window (urgent allocation)
								if (myoffset > 0 && myoffset < (i.warning))
								{

									//TODO -- check if this user has a shot lined up, if so, give them the warning:, if not, make sure there are others lined up...

									//console.log(i.name+' warning');
									//trigger new shot allocation within role
									if (i.status != 'warning' && i.shot && i.role!=-1 && i.status != 'live')
									{
										//console.log('warning');
										i.status = 'warning';
										Log.logmore('autodirector',{msg:'warning',eventid:event.id,userid:i.id});
										User.publishUpdate(i.id,{msg:'You need to get in place, as you will be live soon'});
										Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
									}
									else
									{
										//allocate them a new shot as they dont have one -- this is urgent!
										if (!i.shot)
										{
											Log.logmore('autodirector',{msg:'urgent shot allocation',userid:i.id});
											allocateshot(i,event);
										}
									}
								}

								//COUNTDOWN: within the imminent countdown window (immediate)
								if (myoffset > (i.warning) && myoffset < (i.warning+i.live) && i.status != 'live')
								{
									//if not already counting down, has a shot and role allocated
									if (i.status != 'countdown' && i.status != 'live')
									{
										i.status = 'countdown';
										Log.logmore('autodirector',{msg:'countdown',eventid:event.id,userid:i.id});
										User.publishUpdate(i.id,{shootnow:i.live});
										Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
									}
								}

								//LIVE
								if (myoffset > (i.warning+i.live) && myoffset < (i.warning+i.live + i.length))
								{
									//warning
									//console.log(i.name+' live');
									if (i.status != 'live' && i.status != 'skipping')
									{
										var golive = true;
										i.waitingforshotreply = false;
									
										//if they want to skip...
										
										if (i.skip)
										{
											Log.logmore('autodirector',{msg:'checking if skip is possible',userid:i.id});
											//check that they can skip (enough people)
											var userslive = 0;
											_.each(event.users,function(u,k,l)
											{
												if (u.status == 'live' && u.id != i.id)
												{
													userslive++;
												}
											});

											if (userslive > 0)
											{
												//console.log('skipped');
												Log.logmore('autodirector',{msg:'skipping',eventid:event.id,userid:i.id});
												golive = false;
												i.status = 'skipping'
												i.skip = false;
												Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
											}
										}

										if (golive)
										{
											i.status = 'live';
											Log.logmore('autodirector',{msg:'going live',eventid:event.id,userid:i.id});
											User.publishUpdate(i.id,{live:true, shot_length:i.length});
											Event.publishUpdate(event.id,{users:event.users,ucount:_.size(event.users)});
										}
									}
								}
							}
						});
					}
				}
			});//end loop
		return;
	},

	//triggered on user signin
	signin:function(event,user,profile,resub,force)
	{
		//console.log("resub:"+resub);

		if (force)
		{
			console.log("force new login");
			if (module.exports.AllEvents[event].users[user]!=undefined)
			{
				clearInterval(module.exports.AllEvents[event].users[user].heartbeatid);
			}
			delete module.exports.AllEvents[event].users[user];
		}

		//console.log(module.exports.AllEvents[event]);

		if (module.exports.AllEvents[event].users[user]==undefined && !resub)
		{
			//tell user about this event:
			// Event.findOne(event).done(function(err,event){
			// 	User.publishUpdate(user,{msg:"You are now on the production team for " + event.name});
			// });

			//console.log("sending update");

			User.publishUpdate(user,{modechange:module.exports.AllEvents[event].currentphase});
			User.publishUpdate(user,{eventstarted:module.exports.AllEvents[event].hasstarted});

			//CALCULATE DIRECTION OFFSET
			var newoffset = 0;

			//find which row of user timings they should use
			var userrow = 0;
			if (_.size(module.exports.AllEvents[event].users) < _.size(module.exports.UserTimings))
			{
				userrow = _.size(module.exports.AllEvents[event].users);
			}
			else
			{
				userrow = _.size(module.exports.UserTimings)-1;
			}

			//console.log('userrow: '+userrow);
			var offsetchoices = module.exports.UserTimings[userrow+1];
			var canrandom = true;
			//check there is not an offset that is currently not being used:
			_.each(offsetchoices, function(o)
			{
				var used = false;
				//if there is NOT a user with this offset choice, then allocate them to this, else do random
				_.each(module.exports.AllEvents[event].users,function(u)
				{
					if (u.offset == o)
					{
						used = true;
					}
				});

				if (used == false)
				{
					//console.log('not used '+o);
					newoffset = o;
					canrandom = false;
				}
			});

			if (canrandom)
			{
				console.log('next consecutive');
				//recalculate this user's timings given this row:
				//var i=0;
				//_.each(module.exports.AllEvents[event].users,function(u){
					//give to the correct one in the list (or loop)
					var numusers = _.size(module.exports.AllEvents[event].users);
					var numoptions = _.size(offsetchoices);
					console.log(numusers + " " + numoptions);
					newoffset = offsetchoices[numusers % numoptions];
				//	i++;
				//});
			}

			//CREATE USER
			module.exports.AllEvents[event].users[user] = {
				id:user,
				name:profile.profile.displayName,
				status:'new',
				extendedlive:false,
				offset:newoffset,
				length:25,
				warning:8,
				live:5,
				role:-1,
				shot:false,
				hold:false,
				skip:false,
				reject_shot:false,
				cameragap:module.exports.cameragap,
				lasthearbeat:new Date()
			};


			User.publishUpdate(user,{length:module.exports.AllEvents[event].users[user].length, warning:module.exports.AllEvents[event].users[user].warning,live:module.exports.AllEvents[event].users[user].live,cameragap:module.exports.AllEvents[event].users[user].cameragap});

			Log.logmore('autodirector',{msg:'User signin',userid:user,eventid:event});

			//TELL EVERYONE ELSE ABOUT USER
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			return;
		}
		else
		{
			console.log('reconnect event');
			//if user reconnected:
			if (module.exports.AllEvents[event].users[user]!=undefined)
			{
				//reconnect user:
				console.log('re-connect user');
				module.exports.AllEvents[event].users[user].status = 'allocating';
				User.publishUpdate(user,{msg:'Welcome back...'});
				User.publishUpdate(user,{modechange:module.exports.AllEvents[event].currentphase});
				User.publishUpdate(user,{eventstarted:module.exports.AllEvents[event].hasstarted});
				Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
				return;
			}
			else
			{
				console.log('force user re-connect');
				//if server restarted:
				//force the user to disconnect
				delete module.exports.AllEvents[event].users[user];
				User.publishUpdate(user,{msg:'You need to reconnect, we lost the connection to your device'});
				Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			}
		}
	},

	//triggered on deliberate disconnect
	disconnect:function(event, user)
	{
		Log.logmore('autodirector',{msg:'User lost',userid:user,eventid:event});
		delete module.exports.AllEvents[event].users[user];

		//if there is only 1 user, notify them that they are the only one, stop their recording and tell them to get other people logged in...
		if (_.size(module.exports.AllEvents[event].users) == 1)
		{
			if (_.values(module.exports.AllEvents[event].users)[0].status != 'lost')
			{
				var u = _.values(module.exports.AllEvents[event].users)[0];
				User.publishUpdate(u.id,{msg: "And then there was one. You are alone on the crew, so we are pausing production until someone else joins you"});
				u.status = 'allocating';
				User.publishUpdate(u.id,{live:false});
			}
		}

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
			module.exports.AllEvents[event].users[user].status = 'lost';
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			//check for really lost...
			setTimeout(function()
			{
				if (module.exports.AllEvents[event].users[user] != undefined)
				{
					if (module.exports.AllEvents[event].users[user].status == 'lost')
					{
						delete module.exports.AllEvents[event].users[user];

						if (_.size(module.exports.AllEvents[event].users) == 1)
						{
							//console.log(module.exports.AllEvents[event].users);
							var u = _.values(module.exports.AllEvents[event].users)[0];
							//console.log(u);
							User.publishUpdate(u.id,{msg: "And then there was one. You are alone on the crew, so we are pausing production until someone else joins you"});
							u.status = 'allocating';
							User.publishUpdate(u.id,{live:false});
						}
						Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
					}
				}
			},12000);

			Log.logmore('autodirector',{msg:'User lost',userid:user,eventid:event});
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
			module.exports.AllEvents[event].users[user].status = 'live';
			Log.logmore('autodirector',{msg:'Recording Started',userid:user,eventid:event});
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
			Log.logmore('autodirector',{msg:'Recording Stopped',userid:user,eventid:event});
			if (module.exports.AllEvents[event].currentphase != 'timed')
			{
				module.exports.AllEvents[event].users[user].status = 'allocating';
				Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			}
		}
		catch(e)
		{

		}
		return;
	},

	//triggered when user holds on current shot
	holdrecording:function(event,user)
	{
		try
		{
			if (!module.exports.AllEvents[event].users[user].hold)
			{
				//make sure to NOT recallocate shot next time
				module.exports.AllEvents[event].users[user].hold = true;
				Log.logmore('autodirector',{msg:'Hold',userid:user,eventid:event});
				User.publishUpdate(user,{msg:'Keep holding that shot then!'});
			}
		}
		catch (e)
		{

		}
		return;
	},

	//triggered when user asks to skip
	skiprecording:function(event,user)
	{
		try
		{
			if (!module.exports.AllEvents[event].users[user].skip)
			{
				//make sure to reallocate shot next time
				module.exports.AllEvents[event].users[user].skip = true;
				Log.logmore('autodirector',{msg:'Skip',userid:user,eventid:event});
				User.publishUpdate(user,{msg:'No problem, spend this time getting another shot!'});
			}
		}
		catch (e)
		{

		}
		return;
	},

	//triggered when user chooses their own role, checks to see if its a duplicate and asks to confirm
	chooserole:function(res,event,user,role,confirmed)
	{
		try
		{
			if (module.exports.AllEvents[event].users[user].status == 'waiting' || module.exports.AllEvents[event].users[user].status != 'live')
			{
				//check there is at least one person on each role:

				//console.log(module.exports.AllEvents[event].data.eventtype.roles);
				var allroles = module.exports.AllEvents[event].data.eventtype.roles;
				//console.log(module.exports.AllEvents[event].users);
				// console.log(allroles);
				var doit = true;

				//if there is nobody on the role I'm choosing, then ok
				var withmyrole = _.find(module.exports.AllEvents[event].users,function(u){
					return u.role == role;
				});

				//someone has this role, see if there are empty ones
				if (withmyrole != undefined)
				{
					//console.log("someone has this role, look for others");
					//someone with my role, check if there is another role which does not have someone
					allroles = _.without(_.pluck(allroles,"id"), role);
					_.each(allroles,function(r)
					{
						//console.log("looking at : " + r);
						var uwithrole = _.find(module.exports.AllEvents[event].users,function(u){
							//console.log("match: " + u.role + " = " + r.id);
							return u.role == r;
						});
						//console.log("u with role : " + uwithrole);
						//console.log("role " + r + " has " + uwithrole);
						//there is an empty role somewhere...
						if (uwithrole == undefined)
						{
							//console.log("")
							doit = false;
						}
					});
				}

				//console.log("allow role: "+doit);

				if (!confirmed && !doit)
				{
					Log.logmore('autodirector',{msg:'Take another role?',userid:user,role:role,eventid:event});
					return res.json({status:'confirm',msg:'There are some angles not being covered, any chance you can take another role?'});	
				}
				else
				{
					module.exports.AllEvents[event].users[user].role = role;
					//User.publishUpdate(user,{msg:'Role Set'});
					Log.logmore('autodirector',{msg:'Role Set',userid:user,role:role,eventid:event});
					return res.json({status:'ok',msg:'Role Set'});
				}
			}
			else
			{
				Log.logmore('autodirector',{msg:'Cant change role, already live',userid:user,role:role,eventid:event});
				return res.json({status:'fail',msg:'Cant Change Role, You are Live!'});
			}
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
			Log.logmore('autodirector',{msg:'accept role',userid:user,role:role,eventid:event});
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
			Log.logmore('autodirector',{msg:'reject role',userid:user,role:role,eventid:event});
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
			module.exports.AllEvents[event].users[user].shot = shot;
			module.exports.AllEvents[event].users[user].waitingforshotreply = false;
			Log.logmore('autodirector',{msg:'accept shot',userid:user,shot:shot,eventid:event});
		}
		catch (e){}
			return;
		},

	//triggered when user rejects shot given to them
	rejectshot:function(event,user,shot)
	{
		try
		{
		//increment shot?
		module.exports.AllEvents[event].users[user].shot = false;
		module.exports.AllEvents[event].users[user].rejectshot = shot;
		module.exports.AllEvents[event].users[user].waitingforshotreply = false;
		Log.logmore('autodirector',{msg:'reject shot',userid:user,shot:shot,eventid:event});
	}
	catch (e){}
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
		if (module.exports.AllEvents[event] != null)
		{
			console.log()
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
			Event.publishUpdate(event,{phase:module.exports.AllEvents[event].currentphase,ruleset:module.exports.AllEvents[event].ruleset});
		}
	},


	//user fires this event when they are ready to publish
	ready:function(event, user)
	{
		try
		{
			if (_.size(module.exports.AllEvents[event].users[user]) > 1)
			{
				//actually ready to start allocating roles (the user knows whats going on)
				module.exports.AllEvents[event].users[user].status = 'waiting';
				Log.logmore('autodirector',{msg:'ready',userid:user,eventid:event});
				Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});

				//tell everyone else about this person arriving
				var users = [];
				_.each(module.exports.AllEvents[event].users,function(u)
				{
					if (u.id != user)
						User.publishUpdate(u.id,{msg: module.exports.AllEvents[event].users[user].name+" joining makes "+_.size(module.exports.AllEvents[event].users)+" people filming at this event"});
				});

				//message this user
				if (_.size(module.exports.AllEvents[event].users)>1)
					User.publishUpdate(user,{msg:"Welcome, "+ _.without(_.pluck(module.exports.AllEvents[event].users, 'name'),module.exports.AllEvents[event].users[user].name) + " are on the film crew too"});
				else
					User.publishUpdate(user,{msg:"Welcome, you are the first to join the film crew"});
			}
			else
			{
				//dont trigger starting the event if only one person is ready...
				User.publishUpdate(user,{msg:"You are the only person available at the moment, we are waiting for others to begin"});
			}
		}
		catch (e){

		}
	},

	unselectrole:function(event, user)
	{
		try
		{
			//actually ready to start allocating roles (the user knows whats going on)
			//sails.winston.info("un selecting role");
			module.exports.AllEvents[event].users[user].role = -1;
			module.exports.AllEvents[event].users[user].shot = undefined;  
			module.exports.AllEvents[event].users[user].status = 'new';
			Log.logmore('autodirector',{msg:'unselecting role',userid:user,eventid:event});
			Event.publishUpdate(event,{users:module.exports.AllEvents[event].users,ucount:_.size(module.exports.AllEvents[event].users)});
		}
		catch (e) {}
	},

	eventstarted:function(event, user)
	{
		try
		{
			Log.logmore('autodirector',{msg:'event started',userid:user,eventid:event});
			//console.log('Event Started');
			module.exports.AllEvents[event].hasstarted = true;

			if (_.size(module.exports.AllEvents[event].users) == 1)
			{
				User.publishUpdate(user,{msg:"We will need to wait for someone else to join the team before allocating shots"});
			}

			//transmit mode change:
			_.each(module.exports.AllEvents[event].users,function(u)
			{
				User.publishUpdate(u.id,{eventstarted:true});
			});
		}
		catch (e) {}
	},

	eventpaused:function(event, user)
	{
		try
		{
			Log.logmore('autodirector',{msg:'event paused',userid:user,eventid:event});
			//console.log('Event Started');
			module.exports.AllEvents[event].hasstarted = false;

			_.each(module.exports.AllEvents[event].users,function(u)
			{
				User.publishUpdate(u.id,{eventstarted:false});
			});
		}
		catch (e) {}
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
			Log.logmore('autodirector',{msg:'update event',eventid:ev.id});
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