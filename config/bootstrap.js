/**
 * Bootstrap
 *
 * An asynchronous boostrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#documentation
 */

var fs = require('fs');

module.exports.bootstrap = function (cb) {
	//starrt http redirect server:
	var request = require('request');

	var myIP = require('my-ip');

	sails.winston = require('winston');
	sails.winston.remove(sails.winston.transports.Console);
	sails.winston.add(sails.winston.transports.Console, {colorize: true, level: 'info' });
    require('winston-mongodb').MongoDB;

    sails.winston.add(sails.winston.transports.MongoDB, {
			level:'verbose',
    	host     : sails.config.db_host,
        port     : sails.config.db_port,
        username : sails.config.db_user,
        collection: 'log',
        password : sails.config.db_password,
        db : sails.config.db_database,
        storeHost:true,
        //handleExceptions: true
    });

  Log.info('bootstrap',"Connected to MongoDB on "+sails.config.db_host);

    //sails.winston.remove(sails.winston.transports.Console);
	Log.info('bootstrap','started',{local:sails.localmode});

	//Log.error('bootstrap','test',{arg1:'testarg1'});

	//load init data:
	Shot.find({}).exec(function(err, shots){
		if (shots.length == 0)
		{
			Shot.create(JSON.parse(fs.readFileSync('assets/data/allshots.json'))).exec(function(err,done)
			{
				Log.info('bootstrap','Init Shots');
			});
		}
		else
		{
			_.each(shots,function(s)
			{
				//console.log('assets/data/images/'+s.image);
				if (!fs.existsSync('assets/data/images/'+s.image))
				{
					Log.error('bootstrap','Missing Large ' + s.image);
				}

				if (!fs.existsSync('assets/data/icons/'+s.icon))
				{
					Log.error('bootstrap','Missing Small ' + s.icon);
				}
			});
		}
	});

	EventTemplate.find({}).exec(function(err, evs){
		if (evs.length == 0)
		{
			EventTemplate.create(JSON.parse(fs.readFileSync('assets/data/alltemplates.json'))).exec(function(err,done)
			{
				Log.info('bootstrap','Init Templates');
			});
		}
	});



	// Media.find({}).exec(function(err,media)
	// {
	// 	_.each(media,function(m)
	// 	{
	// 		if (m.thumb)
	// 		{
	// 			m.thumb = m.thumb.replace('https://bootlegger.s3.amazonaws.com/upload/','');
	// 			//console.log(m.thumb);
	// 			m.save(function(err,done)
	// 			{
	// 				console.log('updated '+done.id);
	// 			});
	// 		}
	// 	});
	// });

	//start passport authentication
	var passport = require('passport');
	//var GoogleStrategy = require('passport-google').Strategy;
	var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
	var LocalStrategy = require('passport-local').Strategy;
	var FacebookStrategy = require('passport-facebook').Strategy;
  var TwitterStrategy = require('passport-twitter').Strategy;
	var DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;


	passport.use(new LocalStrategy(
	  function(username, password, done) {
	  	//console.log("u:"+username);
	  	//console.log("p:"+password);
	    User.findOne({ localcode: password }, function(err, user) {
    		//console.log("logged in");
    		//console.log(user);
    		return done(err, user);
	    });
	  }
	));

	var protocol = (_.contains(process.argv,'--prod')? 'https' : 'http');

	passport.use(new DropboxOAuth2Strategy({
    clientID: sails.config.dropbox_clientid,
    clientSecret: sails.config.dropbox_clientsecret,
    passReqToCallback: true,
    callbackURL: sails.config.master_url+'/auth/dropbox_return'
	  },
	  function(req, accessToken, refreshToken, profile, done) {
			Log.info('dropbox','Login',{user_id:req.session.passport.user.id});
    	req.session.passport.user.dropbox = {};
    	req.session.passport.user.dropbox.id = profile.id;
    	req.session.passport.user.dropbox.refreshToken = refreshToken;
    	req.session.passport.user.dropbox.accessToken = accessToken;
    	return done(null, req.session.passport.user);
	  }
	));

	// passport.use(new TwitterStrategy ({
	//     consumerKey: sails.config.TWITTER_APP_ID,
  //   	consumerSecret: sails.config.TWITTER_APP_SECRET,
  //   	callbackURL: sails.config.master_url+'/auth/twitter_return',
	//   },
	//   function(token, tokensecret,profile,done) {
	//   	//console.log(profile);
	// 		//profile._json.picture = profile.photos[0].value;
	//     User.findOrCreate({ uid: String(profile.id) },{ uid: String(profile.id), profile:profile }, function(err, user) {
	//       	return done(err, user);
	//     });
	//   }
	// ));

	passport.use(new GoogleStrategy ({
	    clientID: sails.config.google_clientid,
    	clientSecret: sails.config.google_clientsecret,
    	callbackURL: sails.config.master_url+'/auth/google_return',
	  },
	  function(token, tokensecret,profile,done) {
	  	//console.log(profile);
	    profile._json.picture = profile.photos[0].value.replace('?sz=50','');
	    User.findOrCreate({ uid: String(profile.id) },{ uid: String(profile.id), profile:profile }, function(err, user) {
				 	Log.info('google','Login',{user_id:profile.id});
	      	return done(err, user);
	    });
	  }
	));

	passport.use(new FacebookStrategy ({
	    clientID: sails.config.FACEBOOK_APP_ID,
    	clientSecret: sails.config.FACEBOOK_APP_SECRET,
    	callbackURL: sails.config.master_url+'/auth/facebook_return',
			profileFields: ['id', 'name','picture.type(small)', 'emails', 'displayName'],
	  },
	  function(token, tokensecret,profile,done) {
			//console.log(profile);
			Log.info('facebook','Login',{user_id:profile.id});
			profile._json.picture = 'http://graph.facebook.com/'+profile.id+'/picture';
	    User.findOrCreate({ uid: String(profile.id) },{ uid: String(profile.id), profile:profile }, function(err, user) {
						return done(err, user);
	    });
	  }
	));

	passport.serializeUser(function (user, done) {
	  done(null, user);
	});

	passport.deserializeUser(function (user, done) {
	    done(null, user);
	});


	sails.localmode = false;
	if (_.contains(process.argv, '--local'))
	{
		Log.info('bootstrap',"** Bootlegger is running in LOCAL mode on "+myIP()+" and broadcasting to local devices **");
		sails.localmode = true;
		sails.localport = 80;
		//broadcast udp so we can find this server...
	    var broadcastAddress = "255.255.255.255";
		var message = new Buffer("Bootlegger Server Hello");

		var dgram = require('dgram');

		var client = dgram.createSocket("udp4");

		client.on("error", function (err) {
    	Log.error('bootstrap',"Socket error: " + err);
		});

		client.on("listening", function () {
		 	//console.log('.');
		    client.setBroadcast(true);
		    //regular intervals:
		    setInterval(function(){
		    	//console.log('.');
	    		client.send(message, 0, message.length, 1338, broadcastAddress);
		    }, 3*1000);
		});

		client.bind(1338);
		//startup the event manager:
		sails.eventmanager = require('./eventmanager.js');
		sails.eventmanager.init(null,function(){
			cb();
		});

	}
	else
	{
		//not local -- tell the central server to reload events:
		Log.info('bootstrap',"Signing on with Multi-Control Server");
		sails.hostname = sails.config.hostname + ':' + sails.config.port;
		Log.info('bootstrap',"Current Hostname is "+sails.hostname);
		var req = require('request');
		req({url:sails.config.multiserver + '/alive/?id='+sails.hostname,timeout:300},function(err){
			if (!err)
			{
				sails.multiserveronline = true;
			Log.info('bootstrap',"signed on to multi-server at "+sails.config.multiserver);

			}
			else
			{
				sails.multiserveronline = false;
				Log.error('bootstrap',"can't connect to multi-server at "+sails.config.multiserver,err);
			}
			//startup the event manager:
			sails.eventmanager = require('./eventmanager.js');
			sails.eventmanager.init(sails,function(){
				cb();
			});
		});
	}
};
