exports.sendSMS = function(options) {
	var nexmo = require('nexmoapi').Nexmo;
	var sender = new nexmo('aa0a6dc2', '597b166a',true);
	var to = options.number;
	var code = options.code;
	var from = "Bootlegger";
	var text = "You have been added as part of a production team on Bootlegger. Download the app from http://bootlegger.tv, and use the code " + code + " to access this event."
	sender.send(from, to, text, function(err){
		//done
		console.log("text sent" + err);
	});
};