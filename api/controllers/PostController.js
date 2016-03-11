/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * PostController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var fs = require('fs-extra');
//var knox = require('knox');
var uploaddir = "/upload/";
var ss3 = require('s3');
var path = require('path');
var Dropbox = require('dropbox');
var dir = "";
var moment = require('moment');
var _ = require("lodash");
var path = require('path');

var cancelthese = {};
var urlencode = require('urlencode');

module.exports = {

  /**
   * /post/controller
   */
  index: function (req,res) {

    // This will render the view:
    // D:\Research\Research\bootlegging\server/views/post/controller.ejs
    //var lookupid = req.session.event;
      //console.log(lookupid);

      //if event is explicitally set in GET
      //if (req.params.id)
      //{
      var lookupid = req.params.id;
      //}

      //req.session.event = lookupid;

      var cookiesigned = require('cookie-signature');
      var signed = cookiesigned.sign(req.signedCookies['sails.sid'],req.secret);
      signed = "s:" + signed;
      var sessionkey = signed;

    //list post production modules that are enabled:


    Event.findOne(lookupid).exec(function(err,event){
      if (event == undefined)
      {
        //req.session.flash = {err:"Event not found"};
        return res.redirect('/dashboard');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event,sessionkey:sessionkey,pagetitle:'Export'});
    });
  },

  remind:function(req,res)
  {
    Event.findOne(req.params.id).exec(function(err,event){
      Media.find({event_id:event.id},function(err,media){
        //find unique list of users with un-uploaded footage:
        //filter by not uploaded:
        //console.log("media: "+media.length);
        //console.log(media);

        var notuploaded = _.filter(media,function(m){return typeof m.path == 'undefined';});
        //console.log("notuploaded: "+notuploaded.length);
        var usersnotuploaded = _.pluck(notuploaded,'created_by');
        //console.log("user: "+usersnotuploaded.length);
        var uniqueusers = _.unique(usersnotuploaded);
        //console.log("unique users: "+uniqueusers);
        //for each one of these, find the session info:
        //console.log("send msg"+us);
        User.find({id:uniqueusers},function(err, users)
        {
          _.each(users,function(us){
            //push a message to them:
            //console.log("wanting to send push");
            if (us.pushcode)
            {
              Gcm.sendMessage(us.platform,us.pushcode,"Upload Videos","Please upload your " + event.name + " videos",event.id);
            }
          });

          req.session.flash = {msg:"Upload reminder sent!"};
          res.redirect('/post/'+req.params.id);
        });
      });
    });
  },

  broadcast:function(req,res)
  {
    if (req.param('advert'))
    {
      User.find({}).exec(function(err,users)
      {
        _.each(users,function(u){
          if (u.pushcode) //for testing.... && u.profile.emails[0].value == sails.config.admin_email
          {
            //console.log(u.profile.emails[0].value);
            Gcm.sendMessage(u.platform,u.pushcode,"Bootlegger Info","Latest updates from Bootlegger",null,req.param('advert'));
          }
        });
        req.session.flash = {msg:"Broadcast Message Sent!"};
        res.redirect('/event/admin');
      });
    }
    else
    {
      req.session.flash = {msg:"No Message Given!"};
      res.redirect('/event/admin');
    }
  },

  module_function:function(req,res)
  {
    //console.log("done0");
    var module = req.param('id');
    var func = req.param('func');
    var ev = req.param('event');
    //console.log(req.params.all());
    sails.eventmanager.module_function(module,func ,ev, req, res);
  },

  module:function(req,res)
  {
    //return html for the module config
    var module = req.param('id');
    //console.log(module);

    sails.eventmanager.post_settings(module,req.param('event'),res);
  },

  getnumbers:function(req,res)
  {
    var eventid = req.param('id');
    var missing=[];
    var files=[];
    var filesize = 0;
    Media.find({'event_id':eventid},function(err,data)
    {
      //console.log(data);
      //missing ?? files

      _.each(data,function(d)
      {
        if (d.path)
          files.push(d);
        else
          missing.push(d);

        //console.log(d);

        if (d.meta.static_meta.filesize)
        {
          filesize+=parseFloat(d.meta.static_meta.filesize);
        }
      });
      //emit status:

      var users = _.unique(_.pluck(data, 'created_by')).length;
      var mins = _.reduce(data, function(sum, m) {
        if (m.meta.static_meta.clip_length)
        {
          var durations = m.meta.static_meta.clip_length.split(':');
          var duration = (parseFloat(durations[0]) / 3600) + (parseFloat(durations[1]) / 60) + parseFloat(durations[2]);
          //console.log("dir: "+duration + ",");
          return parseFloat(sum) + parseFloat(duration);
        }
        else
        {
          return parseFloat(sum);
        }
      },0);

      //var usersmissing = _.pluck(missing, 'created_by')).length;
      //console.log(usersmissing);

        User.find({}).exec(function(err,allusers)
        {
            var usersmissing = _.countBy(missing, function(num) {
              var x = _.findWhere(allusers, {id: num.created_by});
              if (x)
                return x.profile.displayName;
              else
                return 'Anon';
               });

            var missingfrom = _.reduce(usersmissing,function(prev,next,val){
              return prev + val + " (" + next + "), ";
            },"");

            res.json({ok:files.length, missing:missing.length,crew:users,mins:+parseFloat(mins/60).toFixed(2),missingfrom:missingfrom,filesize:filesize});
        });
    });
  },

  document:function(req,res)
  {
    var eventid = req.param('id');

    User.find({}).exec(function(err,users)
    {
        Event.findOne(eventid,function(err,ev){

          Media.find({'event_id':eventid}).sort('createdAt').exec(function(err,data)
          {
            //for each media, go through and fill in ids:
            _ = require('lodash');
            _.each(data,function(m)
            {
              //role, shot coverage class
              m.meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
              if (m.meta.role_ex==undefined)
                m.meta.role_ex = {name:'Unknown'};
              m.user = _.findWhere(users, {id: m.created_by});
              if (!m.user)
                m.user = {profile:{displayName:'Unknown'}};
              //console.log(m.meta.static_meta.shot);
              //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
              m.meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
              if (!m.meta.shot_ex)
                m.meta.shot_ex = {name:'Unknown'};

              //console.log(ev.coverage_classes);

              m.meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
              if (m.meta.coverage_class_ex==undefined)
              {
                m.meta.coverage_class_ex = {name:"Unknown"};
              }

              var timestamp = m.meta.static_meta.captured_at.split(' ');
              //var filename =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + path.extname(m.path);
              var filename = urlencode((timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.role_ex.name + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + path.extname(m.path)).replace(/ /g,'_'));


              m.originalpath = m.path;
              m.thumb = sails.config.S3_CLOUD_URL + m.thumb;
              m.path = filename;

            });
            res.view({event:ev,data:data,_layoutFile: '../blank.ejs'});
          });
        });
      });
    },

  canceldownload:function(req,res)
  {
    var eventid = req.params.id;
    User.findOne(req.session.passport.user.id).exec(function(err,u)
    {
      //u.dropboxsync = {msg:'Cancelled',status:'queue',percentage:0};
      u.sync[eventid].dropboxsynccancel = true;
      u.save(function(err){
         return res.json({});
      });
    });

    //TODO -- CANCEL BEANSTALK JOB!

    //res.json({msg:'ok'});
  },

  // reset:function(req,res)
  // {
  //   //delete req.session.downloading;
  //   //delete req.session.cancelsync;
  //   //req.session.save();
  //   //console.log('reset download: '+req.session.cancelsync);
  //   //req.session.flash = 'Download Reset';
  //   //return res.redirect('/post');
  // },


  downloadprogress:function(req,res)
  {
    var eventid = req.params.id;
    
    //console.log("d:"+req.session.downloading);
    // console.log("c:"+req.session.cancelsync);
    User.findOne(req.session.passport.user.id).exec(function(err,u)
    { 
      //console.log(u.sync);
      if (u.sync && u.sync[eventid] && u.sync[eventid].dropboxsync && (u.sync[eventid].dropboxsync.status!='cancelled') && (u.sync[eventid].dropboxsync.status!='done') && !(u.sync[eventid].dropboxsynccancel==true && u.sync[eventid].dropboxsync.status=='queue'))
      {
        return res.json(u.sync[eventid].dropboxsync);
      }
      else
      {
        return res.json({msg:'Not currently syncing to dropbox.',stopped:true});
      }
    });
  },

  myoutputtemplates:function(req,res)
  {
    User.findOne(req.session.passport.user.id).exec(function(err,u)
    {
        return res.json({outputtemplates:(u && u.outputtemplates)?u.outputtemplates : []});
    });
  },

  updateoutputs:function(req,res)
  {
    User.findOne(req.session.passport.user.id).exec(function(err,u)
    {
      //console.log(req.param('outputtemplates'));
      u.outputtemplates = req.param('outputtemplates');
      u.save(function(err,ok)
      {
        //console.log(err);
         return res.json({msg:'ok'});
      });
      // console.log('temps');
      // console.log(u);
    });
  },

  downloadall:function(req,res)
  {
    //SUBMIT THIS JOB TO THE EDIT SERVER
    User.findOne(req.session.passport.user.id).exec(function(err,u)
    {
      if (!u.sync) u.sync = {};
      u.sync[req.params.id] = {dropboxsync: {msg:'In Queue',status:'queue',percentage:0}};
      u.sync[req.params.id].dropboxsynccancel = false;
      u.save(function(err){
         //console.log(req.session);
         //req.session.passport.user.dropbox
         var cookiesigned = require('cookie-signature');
         //console.log(req);

         var signed = cookiesigned.sign(req.signedCookies['sails.sid'],req.secret);
         signed = "s:" + signed;

         var config = {
          event_id:req.param('id'),
          user_id:req.session.passport.user.id,
          dropbox_token:req.session.passport.user.dropbox,
          template:req.param('template'),
          from:req.param('from'),
          to:req.param('to'),
          homog:req.param('homog'),
          session:signed
         };
         //console.log(config);

         //submit dropbox transfer:
         Editor.dropbox(config);
         return res.json(u.sync[req.params.id].dropboxsync);
      });
    });
  }

};
