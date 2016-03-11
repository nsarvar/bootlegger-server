var passport = require('passport');
var express = require('express');
var _ = require('lodash');
var device = require('express-device');

module.exports = {
	
	// Name of the application (used as default <title>)
	appName: "Bootlegger",

	// Logger
	// Valid `level` configs:
	// 
	// - error
	// - warn
	// - debug
	// - info
	// - verbose
	//
	log: {
		level: 'info'
	},

	http: { 
        customMiddleware: function(app){
          //console.log('Express midleware for passport');
          app.use(passport.initialize());
          app.use(passport.session());
          //app.use('/app', express.static(process.cwd() + '/../client/www/'));
          app.use('/upload', express.static(process.cwd() + '/upload/'));
          app.use('/cast', express.static(process.cwd() + '/cast/'));
          //app.use(this.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/assets/uploads" }))

          app.use('/api/docs', express.static(process.cwd() + '/doc/'));

          app.use(device.capture());
          device.enableDeviceHelpers(app);
          // app.enableDeviceHelpers();

          //console.log("production: "+_.contains(process.argv,'--production'));

          //LOCAL MODE + PRODUCTION
          if (_.contains(process.argv,'--local') && _.contains(process.argv,'--prod'))
          {
            console.log("info: Setting up Localmode Static Assets Server (for if nginx not installed) in production mode");
            app.use('/static', express.static(process.cwd() + '/.tmp/public/'));
            app.use('/static/images', express.static(process.cwd() + '/.tmp/public/images/'));
            app.use('/static/js', express.static(process.cwd() + '/.tmp/public/js/'));
          }

          //NOT LOCAL MODE and DEVELOPMENT
          if (!_.contains(process.argv,'--local') && !_.contains(process.argv,'--prod'))
          {
            console.log("info: Setting up Localmode Static Assets Server (for if nginx not installed) in development mode");
            app.use('/static', express.static(process.cwd() + '/assets/'));
            app.use('/static/images', express.static(process.cwd() + '/assets/images/'));
            app.use('/static/js', express.static(process.cwd() + '/assets/js/'));
          }
        }},

};