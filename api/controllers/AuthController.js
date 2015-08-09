/**
 * AuthController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var fs = require('fs-extra');
var passport = require('passport');
var uploaddir = "/upload/";
var path = require('path');
var usercount = 0;
var VERSION_STRING = 12;
var moment = require('moment');

module.exports = {

	getapp:function(req,res)
	{
		var MobileDetect = require('mobile-detect'),
    md = new MobileDetect(req.headers['user-agent']);
		//console.log(md);
		if (md.is('iOS'))
		{
			return res.redirect(sails.config.IOS_STORE_LINK);
		}
		if (md.is('AndroidOS'))
		{
			return res.redirect(sails.config.PLAY_STORE_LINK);
		}

		req.session.flash = {msg:'Sorry, we don\'t support your mobile device right now...' };
		return res.redirect('/');
	},

	changename:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,user){
			var nn = req.param('name').split(' ');
			if (nn.length < 1)
			{
				req.session.flash = {msg:'Please enter your full, real name'};
				return res.redirect('/');
			}
			user.profile.displayName = req.param('name');
			req.session.passport.user.profile.displayName = user.profile.displayName;

			//user.profile.name.givenName = nn[0];
			//var first = nn.pop();
			//user.profile.name.familyName =  req.param('name').replace(first,'').trim();

			user.save(function(err,u)
			{
				console.log(u);
				req.session.flash = {msg:'Your name has been updated!'};
				return res.redirect('/');
			});
		});
	},

	terms:function(req,res)
	{
		var markdown = require('marked');
		var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/auth/terms.md'),"utf8");
		//console.log(contents);
		var themarkdown = markdown(contents);
		return res.view('auth/markdown',{markdown:themarkdown});
	},

	privacy:function(req,res)
	{
		var markdown = require('marked');
		var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/auth/privacy.md'),"utf8");
		//console.log(contents);
		var themarkdown = markdown(contents);
		return res.view('auth/markdown',{markdown:themarkdown});
	},

	howtobootleg:function(req,res)
	{
		switch (req.param('platform'))
		{
			case 'app':
				return res.view('help/app',{showhelp:true});
			case 'web':
				return res.view('help/web',{showhelp:true});
			case 'commission':
				return res.view('help/commission',{showhelp:true});
			default:
				return res.view('help/index',{showhelp:true});
		}

	},

	// demo1:function(req,res)
	// {
	// 	return res.view({_layoutFile: null});
	// },
	//
	// demo2:function(req,res)
	// {
	// 	return res.view({_layoutFile: null});
	// },

	setprivacy:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,user)
		{
			if (!user.permissions)
				user.permissions = {};

			user.permissions[req.param('eventid')] = req.param('privacy');
			user.save(function(err,done)
			{
				res.json({msg:'user updated'});
			});
		});
	},

	/**
	 * @api {get} /api/status Get API Server Status
	 * @apiName status
	 * @apiGroup Misc
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {String} msg 'ok' when server is live
	 * @apiSuccess {Number} version Current server version
	 */
	status:function(req,res)
	{
		return res.json({msg:"ok",version:VERSION_STRING},200);
	},

	// localcode:function(req,res)
	// {
	// 	User.getlocalcode(function(code){
	// 		//reset the code and return to the user:
	// 		User.update({
	// 		  id: req.session.passport.user.id
	// 		},
	// 		{
	// 			localcode:code,
	// 		},
	// 		function(err, users) {
	// 		  if (err) {
	// 		    return res.json(err, 500);
	// 		  } else {
	// 		  	req.session.passport.user.localcode = code;
	// 		  	req.session.save();
	// 		    return res.json({msg:'Your new local access code is ',code:code},200);
	// 		  }
	// 		});
	// 	});
	// },


	// //for syncing back to the server
	// upload_media:function(req,res)
	// {
	// 	//uploads all media back to server..
	// 	if (!sails.localmode)
	// 	{
	// 		//console.log(req.media);
	// 		var all = JSON.parse(req.param('media'));
	// 		console.log(all);
	// 		_.each(all,function(m)
	// 		{
	// 			Media.create(m).exec(function(err,ev)
	// 			{
	// 				if (err)
	// 					console.log(err);
	// 			});
	// 		});
	// 		res.json({msg:"OK",status:'ok'});
	// 	}
	// 	else
	// 	{
	// 		res.json({msg:"Server is the Local Server",status:'fail'});
	// 	}
	// },

	// //called by the local machine
	// clone_from_remote:function(req,res)
	// {
	// 	if (sails.localmode)
	// 	{
	// 		//go to remote server and try and sync the information given the connection code:
	// 		var request = require('request');
	// 		//console.log(req.param('code'));
	// 		request(sails.config.central_url+'/auth/clone_output/'+req.param('code'), function (error, response, body) {
	// 		  if (!error && response.statusCode == 200) {
	// 		    //do somthing with the json data:
	//
	// 		    console.log(body);
	//
	// 		    var data = JSON.parse(body);
	// 		    //console.log(data.status);
	// 		    ///data.event
	// 		    //inport event into db
	// 		    if (data.status == 'ok')
	// 			{
	// 			    Event.destroy({id:data.event.id}).exec(function(err)
	// 			    {
	// 			    	Event.create(data.event).exec(function(err, user) {
	// 			    		//add users
	//
	// 			    		//console.log(data.users);
	//
	// 			    		//trigger event added:
	// 			    		sails.eventmanager.addevent(data.event.id);
	//
	// 			    		User.destroy().exec(function(err) {
	// 				    		_.each(data.users,function(u)
	// 				    		{
	// 				    			// User.destroy({uid:u.uid},function(err)
	// 				    			// {
	// 			    				//console.log(err);
	// 			    				//console.log(u.id);
	// 			    				//console.log(u.uid);
	// 			    				//u.id = u.uid;
	//
	// 			    				delete u.id;
	//
	// 			    				User.create(u,function(err){
	// 			    					if (err)
	// 			    					{
	// 			    						console.log(err);
	// 			    					}
	// 			    					else
	// 			    					{
	// 			    						//done all
	// 			    						//console.log('created: '+u.localcode);
	// 			    					}
	//
	// 			    				});
	// 				    			//});
	// 				    		});
	// 			    		});
	// 			    		if (data.status == 'ok')
	// 					    {
	// 					    	return res.json({msg:"Your event has been synced. You can now log in using your personal offline code."});
	// 					    }
	// 					    else
	// 					    {
	// 					    	return res.json({msg:"There was a problem with the sync"});
	// 					    }
	// 			    	});
	// 			    });
	// 			}
	// 			else
	// 			{
	// 				return res.json({msg:"There was a problem with the sync"});
	// 			}
	// 		  }
	// 		  else
	// 		  {
	// 		  	 return res.json({msg:"Cannot contact Remote Server. Do you have an internet connection right now?"});
	// 		  }
	// 		})
	// 	}
	// 	else
	// 	{
	// 		return res.json({msg:"Not in Local Mode"});
	// 	}
	// },

	// clone_output:function(req,res)
	// {
	// 	//output the event information / users for this event, given a valid code
	// 	if (!sails.localmode && req.param('id'))
	// 	{
	// 		var code = req.param('id');
	// 		//console.log(code);
	// 		Event.findOne({offlinecode:code},function(err,ev)
	// 		{
	// 			if (!err && ev)
	// 			{
	// 				var data = {event:ev,status:'ok'};
	// 				//get users:
	// 				// var userids = [ev.ownedby];
	// 				// _.each(ev.codes,function(c)
	// 				// {
	// 				// 	userids.push(c.uid);
	// 				// });
	//
	// 				// //console.log(userids);
	// 			 //   User.find({id: userids},function(err,users)
	// 			 //   {
	// 			 //   	    //console.log(err);
	// 			 //   		data.users = users;
	// 			 //   		res.json(data);
	// 			 //   });
	//
	// 			//dump all users:
	// 			User.find(function(err,users)
	// 			   {
	// 			   	    //console.log(err);
	// 			   		data.users = users;
	// 			   		res.json(data);
	// 			   });
	//
	// 			}
	// 			else
	// 			{
	// 				return res.json({msg:"Invalid code",status:'fail'});
	// 			}
	// 		})
	// 	}
	// 	else
	// 	{
	// 		return res.json({msg:"Not Master Server",status:'fail'});
	// 	}
	// },

	// sync:function(req,res)
	// {
	// 	//no event given...
	// 	res.locals.event = {};
	// 	res.locals.user = undefined;
	// 	return res.view();
	// },
	//
	// syncup:function(req,res)
	// {
	// 	//for each piece of media in the event
	// 	Media.find().exec(function(err,media)
	// 	{
	// 		var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);
	// 		//post up to server
	// 		var request = require('request');
	// 		//console.log(req.param('code'));
	// 		console.log(media);
	// 		request(sails.config.master_url+'/auth/upload_media/',{form:{media:JSON.stringify(media)}}, function (error, response, body) {
	//
	// 			console.log(response.statusCode);
	// 			if (!err && response.statusCode == 200)
	// 			{
	// 				//do uploads:
	// 				var async = require('async');
	// 				var calls = [];
	//
	// 				media.forEach(function(m){
	// 				    calls.push(function(callback) {
	//
	// 				        //do upload function
	// 				        var r = request.post(sails.config.master_url+'/media/upload',function(err,res,body)
	// 			        	{
	// 			        		console.log(body);
	// 			        		if (err)
	// 			                	return callback(err);
	// 			            	callback(null, m);
	// 			        	});
	// 						var form = r.form();
	// 						form.append('id', m.id);
	// 						form.append('sync', '1');
	// 						try
	// 						{
	// 							form.append('thefile', fs.createReadStream(path.join(tmpdir, m.localpath)));
	// 						}
	// 						catch (e)
	// 						{
	// 							//fail with filename
	// 						}
	// 				    });
	//
	// 				    calls.push(function(callback) {
	//
	// 				        //do upload function
	// 				        var r = request.post(sails.config.master_url+'/media/uploadthumb',function(err,res,body)
	// 			        	{
	// 			        		console.log(body);
	// 			        		if (err)
	// 			                	return callback(err);
	// 			            	callback(null, m);
	// 			        	});
	// 						var form = r.form();
	// 						form.append('id', m.id);
	// 						form.append('sync', '1');
	// 						form.append('thumbnail', fs.createReadStream(path.join(tmpdir, m.thumb)));
	// 				    });
	// 				});
	// 				async.series(calls, function(err, result) {
	// 				    /* this code will run after all calls finished the job or
	// 				       when any of the calls passes an error */
	// 				    if (err)
	// 				        return res.json({msg:"Sync Up Fail. We could not copy all your media. Please try again."});
	// 				    else
	// 				    	return res.json({msg:"Sync Up Complete. You can now access your event at "+sails.config.master_url});
	// 				});
	// 			}
	// 			else
	// 			{
	// 				return res.json({msg:"Cannot contact Remote Server. Do you have an internet connection right now?"});
	// 			}
	//
	// 		});
	//
	// 		//when thats done -- go through each piece of media and upload the file using the normal upload procedure...
	//
	//
	// 	});
	//
	// 	//upload logs
	// },

	// local_login:function(req,res,next)
	// {
	// 	req.session.ismobile = true;
	// 	//if its running a local server (not on www)
	//
	// 	if (sails.localmode)
	// 	{
	// 		//console.log("code: "+req.param('code'));
	// 		if (req.param('code') != undefined)
	// 		{
	// 			req.body.username = 'localcode';
	// 			req.body.password = req.param('code');
	// 			return passport.authenticate('local',{successRedirect: '/auth/local_ok',failureRedirect: '/auth/local_fail' })(req, res, next);
	// 		}
	// 		else
	// 		{
	// 			if (req.wantsJSON)
	// 			{
	// 				return res.json({msg:"no code given"},401);
	// 			}
	// 			else
	// 			{
	// 				req.session.flash = "No Local Code Provided";
	// 				return res.view('login');
	// 			}
	// 		}
	// 	}
	// 	else
	// 	{
	// 		return res.json({msg:"server not running in local mode"},401);
	// 	}
	// },

	// local_login_pc:function(req,res,next)
	// {
	// 	req.session.ismobile = false;
	// 	//if its running a local server (not on www)
	//
	// 	if (sails.localmode)
	// 	{
	// 		//console.log("code: "+req.param('code'));
	// 		if (req.param('code') != undefined)
	// 		{
	// 			req.body.username = 'localcode';
	// 			req.body.password = req.param('code');
	// 			return passport.authenticate('local',{successRedirect: '/auth/local_ok',failureRedirect: '/auth/local_fail' })(req, res, next);
	// 		}
	// 		else
	// 		{
	// 			if (req.wantsJSON)
	// 			{
	// 				return res.json({msg:"no code given"},401);
	// 			}
	// 			else
	// 			{
	// 				req.session.flash = "No Local Code Provided";
	// 				return res.view('login');
	// 			}
	// 		}
	// 	}
	// 	else
	// 	{
	// 		return res.json({msg:"server not running in local mode"},401);
	// 	}
	// },

	// local_fail: function(req,res)
	// {
	// 	if (req.wantsJSON || req.session.ismobile)
	// 	{
	// 		res.json({error:'Please login'},403);
	// 	}
	// 	else
	// 	{
	// 		return res.view('login');
	// 	}
	//
	// },
	//
	// local_ok: function(req,res)
	// {
	// 	if (req.wantsJSON || req.session.ismobile)
	// 	{
	// 		res.json({msg:'OK'},200);
	// 	}
	// 	else
	// 	{
	// 		return res.redirect('event/view');
	// 	}
	// },

  login: function (req,res)
	{
		//console.log("testing login");
		//console.log(req.session);

		//console.log(req.session);

		if (req.session.isios && req.session.ismobile && !req.param('viewonly'))
		{
			if (req.session.passport.user)
			{
				return res.json({msg:'Logged in as '+req.session.passport.user.id});
			}
			else
			{
				//console.log('cannot do that (is mobile)');
				return res.json({error:'Please login'},403);
			}
		}
		else
		{
			//console.log("resetting login");
			req.session.ismobile = false;
			req.session.isios = false;
			if (req.session.passport.user)
			{
				if (!req.wantsJSON)
					return res.redirect('/dashboard');
				else
					return res.json({msg:'Logged In'},200);
			}
			else
			{
				if (!req.wantsJSON)
				{
					Event.find({public:[1,true]}).exec(function(err,upcoming){
						//console.log(_.pluck(upcoming,'name'));
					var ups = _.filter(upcoming, function(u)
						{
							//console.log(u.ends);
							//console.log(moment(u.ends,"DD-MM-YYYY"));
							//return true;
							return moment(u.ends,"DD-MM-YYYY").isAfter();
						});
						_.sortBy(ups,function(u){
							return moment(u.ends,"DD-MM-YYYY").toDate();
						});

						ups.reverse();

						//console.log(req.device);
						//console.log(req.device.is_mobile);

						//if (req.device.type == 'phone')
						//	return res.view({upcoming:_.take(ups,3),_layoutFile: '../login_mobile.ejs'});
					//	else
							return res.view({upcoming:_.take(ups,3),_layoutFile: '../login.ejs'});
					});
				}
				else
				{
					//console.log('cannot do that (not mobile)');
					return res.json({error:'Please login'},403);
				}
			}

			// res.view({
			//   _layoutFile: '../login.ejs'
			// });
		}
	},

	mobilelogin:function(req,res)
	{
		//console.log(req.query.ios);
		// if (req.query.ios)
		// {
		//console.log(req.params.id);

		switch(req.params.id)
		{
			case 'google':
				req.session.ismobile = true;
				req.session.isios = true;
				return res.redirect('/auth/google');
				break;
			case 'facebook':
				req.session.isios = true;
				req.session.ismobile = true;
				return res.redirect('/auth/facebook');
				break;
			default:
				return res.redirect('/');
		}
			//redirect directly to google:
		// 	return res.redirect('/auth/google');
		// }
		// else
		// {
		// 	req.session.isios = false;
		// 	req.session.ismobile = true;
		// 	//console.log("ismobile "+req.session.ismobile);
		// 	res.view({
		// 	  _layoutFile: '../mobileapp.ejs'
		// 	});
		// }
	},

	/**
	 * @api {get} /api/login Display Login Screen
	 * @apiDescription Open this link in a browser which redirects to Google authentication. When complete, you will be returned json with a session key valid for API use.
	 * @apiName login
	 * @apiGroup Authentication
	 * @apiVersion 0.0.2
	 * @apiSuccessExample {json} Success-Response:
	 * {
	 * session: "sails.sid=s:jVS765CeN3OJ9NhuNfegnVF4.E1pwiBsK30QSXq78wYH8jh1xnbjlRijf+Bf2wSQyr4Q",
	 * msg: "Logged In OK"
	 * }
	 *
	 * @apiSuccess {String} session Session cookie to use in subsequent requests (if not by the same client)
	 * @apiSuccess {String} msg Should return 'ok'
	 */
	apilogin:function(req,res)
	{
		if(!req.param('apikey'))
		{

		}
		req.session.isios = true;
		req.session.ismobile = true;
		req.session.api = true;
		return res.redirect('/auth/google');
	},
	//
	// twitter_return: function(req,res,next)
	// {
	// 	//console.log('returning from google...');
	// 	req.session.firstlogin = true;
	// 	passport.authenticate('twitter', {successRedirect: '/event/view',failureRedirect: '/auth/login' })(req, res, next);
	// },

	google_return: function(req,res,next)
	{
		//console.log('returning from google...');
		req.session.firstlogin = true;
		passport.authenticate('google', {successRedirect: '/dashboard',failureRedirect: '/auth/login' })(req, res, next);
	},

	facebook_return: function(req,res,next)
	{
		//console.log('returning from google...');
		req.session.firstlogin = true;
		passport.authenticate('facebook', {successRedirect: '/dashboard',failureRedirect: '/auth/login' })(req, res, next);
	},

	dropbox_return: function(req,res,next)
	{
		//return from the server...
		//console.log('returning from google...');
		passport.authenticate('dropbox-oauth2', {successRedirect: '/post',failureRedirect: '/post' })(req, res, next);
	},

	facebook: function(req, res, next)
	{
		passport.authenticate('facebook',{scope:['email']})(req, res,next);
	},

	google: function(req, res, next)
	{
		passport.authenticate('google',{scope:['https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'],prompt:'select_account'})(req, res,next);
	},

	dropbox: function(req, res, next)
	{
		//console.log('Trying Login');
		passport.authenticate('dropbox-oauth2')(req, res,next);
	},

	joincomplete:function(req,res)
	{
			return res.view();
	},

  join:function(req,res)
	{
		var thecode = req.params.id;
		if (!thecode)
		{
			return res.redirect('/');
		}
		//console.log(thecode);
		Event.findOne({'codes.code':thecode}).exec(function(err,event){

			if (event)
			{
				var me = _.find(event.codes,function(f){
					return f.code == thecode;
				});
				me.eventid = event.id;
				req.session.joincode = me;
			}
			return res.view({shoot:event,me:me});
		});
	},

	/**
	 * @api {get} /api/logout Logout of API
	 * @apiName logout
	 * @apiGroup Authentication
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {String} msg Should return 'ok'
	 */
	apilogout:function(req,res)
	{
		req.logout();
		req.session.destroy();
		res.json({msg:'Success'});
	},


	logout: function (req,res)
	{
		req.logout();
		req.session.destroy();
		res.redirect('/');
	},

	fakejson:function(req,res)
 	{
 		if (!_.contains(process.argv,'--prod'))
 		{
	 		var uuid = require('node-uuid');
	 		var fakeid = uuid.v1();
	 		usercount++;
	 		req.session.ismobile = true;
	 		req.session.authenticated = true;
	 		//req.session.User = {name:'Tom'};
	 		User.findOrCreate({uid: fakeid},{uid: fakeid,name:'Test User '+usercount,profile:{emails:[{value:'test@test.com'}],_json:{picture:''},displayName:'Test User '+usercount,name:{givenName:'Test User' +usercount}}}, function(err, user) {
	 			req.session.passport.user = user;
	 	    	return res.json({msg:'logged in'},200);
	 	    });
	 	}
	 	 else
	 	 {
	 	 	return res.json({msg:'no chance'},403);
	 	 }
 	}
};
