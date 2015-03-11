exports.sendMessage = function(platform,deviceid,title,msg,uploadid, advert) {
	if (platform=='Android')
	{
		var GCM = require('gcm').GCM;

		var apiKey = 'AIzaSyCVY8qaGUDSItAXOAMrpmn_cpl2aAj8Npc';
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
		        console.log("Something has gone wrong!");
		    } else {
		        console.log("Sent with message ID: ", messageId);
		    }
		});
	}
};