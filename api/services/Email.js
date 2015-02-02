// EmailService.js - in api/services

var nodemailer = require('nodemailer');
var directTransport = require('nodemailer-direct-transport');
var transporter = nodemailer.createTransport(directTransport());

exports.sendEmail = function(options) {

    transporter.sendMail({
		from: "Bootlegger <no-reply@bootlegger.tv>", // sender address
        to: options.to, // list of receivers
        subject: options.subject, // Subject line
        text: options.content, // plaintext body
	});
};