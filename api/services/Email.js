/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 // EmailService.js - in api/services

// var nodemailer = require('nodemailer');
// var directTransport = require('nodemailer-direct-transport');
// var transporter = nodemailer.createTransport(directTransport());
 var sendgrid  = require('sendgrid')(sails.config.email.SENDGRID_ID);
 var moment = require('moment');

exports.sendEmail = function(options) {
    
    var email     = new sendgrid.Email({
    to:       options.to,
    replyto:  "no-reply@bootlegger.tv",
    from:     "info@bootlegger.tv",
    fromname: "Bootlegger",
    subject:  options.subject,
    html:     options.content
    });
    
    email.addFilter('templates', 'enable', 1);
    email.addFilter('templates', 'template_id', sails.config.email.SENDGRID_TEMPLATE);
    email.addSubstitution('%sentat%', moment().format('HH:mm'));
    email.addSubstitution('%senton%', moment().format('ddd Do MMM'));
    email.addSubstitution('%url%', sails.config.master_url);
    email.addSubstitution('%btnurl%', options.btnurl);
    email.addSubstitution('%btntext%', options.btntext);
    email.addSubstitution('%name%', options.name);
    
    sendgrid.send(email, function(err, json) {
    if (err) { return console.error(err); }
        console.log(json);
    });
};


exports.newUser = function(user)
{
    //open app??
    var options = {
        to:user.profile.emails[0].value,
        name:user.profile.displayName,
        subject:'Welcome to Bootlegger',
        content : "Welcome to Bootlegger. We are here to help you create great films.",
        btnurl : sails.config.master_url,
        btntext : "Get Started Now"
    };
    exports.sendEmail(options);
};

exports.joinInvite = function(email, eventid, newcode)
{
  Event.findOne(eventid).exec(function(err,ev){
    var options = {
        to:email,
        subject:'Invite to Join a Film Crew',
        content:'You have been invited to join the Bootlegger film crew for ' + ev.name + ".",
        btnurl : sails.config.master_url + "/join/" + newcode,
        btntext : "Join a Shoot Now"
        }
    exports.sendEmail(options);
  });  
};

exports.newShoot = function(options)
{
    
};

exports.finishedShoot = function(options)
{
    
};
