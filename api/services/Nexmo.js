/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 exports.sendSMS = function(options) {
	var nexmo = require('nexmoapi').Nexmo;
	var sender = new nexmo(sails.config.nexmo.id, sails.config.nexmo.key,true);
	var to = options.number;
	var code = options.code;
	var from = "Bootlegger";
	var text = "You have been invited to take part in a Bootlegger film crew. Get involved at "+sails.config.master_url+"/join/" + code + "."
	sender.send(from, to, text, function(err){
		//done
		console.log("text sent" + err);
	});
};
