/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 process.env.DEBUG = 'apn'
//console.log("starting APN" + __dirname+'/../ssl/ios_key.pem');
var apn = require('apn');
var options = {
	production:true,
	cert:__dirname+'/../../ssl/iospush/aps.pem',
	key:__dirname+'/../../ssl/iospush/private.pem',
    "batchFeedback": true,
    "interval": 300
 };

var feedback = new apn.Feedback(options);
feedback.on("feedback", function(devices) {
    devices.forEach(function(item) {
        // Do something with item.device and item.time;
        //for each device, find user with that apn token, and reset it...
        User.findOne({pushcode:item.device}).exec(function(err,d){
            if (d)
            {
                d.pushcode = null;
                d.platform = null;
                delete d.pushcode;
                delete d.platform;
                d.save(function(err,done){
                    Log.info('APN pushcode removed for '+d.id);                    
                });
            }
        });        
    });
});

exports.sendMessage = function(platform,deviceid,title,msg,uploadid,advert) {
	if (platform=='Android')
	{
		var GCM = require('gcm').GCM;

		var apiKey = sails.config.gcmkey;
		var gcm = new GCM(apiKey);

		var message = {
		    registration_id: deviceid, // required
		    collapse_key: 'bootlegger.tv',
		    'data.msg': msg,
		    'data.title':title,
		    "delay_while_idle" : true

		};

		if (uploadid)
		{
			message['data.upload'] = true;
			message['data.eventid'] = uploadid;
		}

		if (advert)
		{
			message['data.advert'] = advert;
		}

		gcm.send(message, function(err, messageId){
		    if (err) {
				console.log(err);
		        console.log("Something has gone wrong!");
		    } else {
		        console.log("Sent with message ID: ", messageId);
		    }
		});
	}
	else if (platform=='iOS' && deviceid)
	{		
		
		var service = new apn.Connection(options);
		service.on("connected", function() {
			console.log("Connected");
		});
		service.on("transmitted", function(notification, device) {
			console.log("Notification transmitted to:" + device.token.toString("hex"));
		});
		
		service.on("transmissionError", function(errCode, notification, device) {
			Log.error("Notification caused error: " + errCode + " for device ");
			if (errCode === 8) {
				console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
			}
		});
		service.on("timeout", function () {
			console.log("Connection Timeout");
		});
		service.on("disconnected", function() {
			console.log("Disconnected from APNS");
		});
		service.on("socketError", console.error);

		var note = new apn.Notification();	

		note.expiry = Math.floor(Date.now() / 1000) + 36000; // Expires 1 hour from now.
		note.badge = 3;
		note.sound = "ping.aiff";
		note.alert = {title:title,body:msg};
		//note = msg;

		if (uploadid)
		{
            note.category = 'UPLOAD';
            //note.alert["action-loc-key"] = "UPLOAD";
			note.payload = {'upload': true, eventid:uploadid};
		}

		if (advert)
		{
			note.payload = {'advert': advert};
		}
		var myDevice = new apn.Device(deviceid);
		service.pushNotification(note, myDevice);
	}
};
