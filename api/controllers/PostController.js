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

module.exports = {
  
  /**
   * /post/controller
   */ 
  index: function (req,res) {

    // This will render the view: 
    // D:\Research\Research\bootlegging\server/views/post/controller.ejs
    var lookupid = req.session.event || req.session.passport.user.currentevent;
      //console.log(lookupid);

      //if event is explicitally set in GET
      if (req.params.id)
      {
        lookupid = req.params.id;
      }

      req.session.event = lookupid;
   
    //list post production modules that are enabled:


    Event.findOne(lookupid).exec(function(err,event){
      if (event == undefined)
      {
        //req.session.flash = {err:"Event not found"};
        return res.redirect('/event/new');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event});
    });
  },

  module_function:function(req,res)
  {
    //console.log("done0");
    var module = req.param('id');
    var func = req.param('func');
    var ev = req.param('event');
    sails.eventmanager.module_function(module,func ,ev, req, res);
  },

  module:function(req,res)
  {
    //return html for the module config
    var module = req.param('id');
    //console.log(module);

    sails.eventmanager.post_settings(module,req.session.event,res);
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
            var usersmissing = _.countBy(missing, function(num) { return _.findWhere(allusers, {id: num.created_by}).profile.displayName; });

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
              m.user = _.findWhere(users, {id: m.created_by});
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
              var filename =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + + path.extname(m.path);
              m.originalpath = m.path;
              m.path = filename;

            });            
            res.view({event:ev,data:data,_layoutFile: '../blank.ejs'});
          });
        });
      });
    },

  canceldownload:function(req,res)
  {
    req.session.cancelsync = true;
    cancelthese[req.session.id] = true;
    delete req.session.downloading;
    req.session.save();
    //console.log(req.session);
    res.json({msg:'ok'});
  }, 

  reset:function(req,res)
  {
    delete req.session.downloading;
    req.session.save();
    //console.log('reset download: '+req.session.cancelsync);
    //req.session.flash = 'Download Reset';
    return res.redirect('/post');
  },

  downloadprogress:function(req,res)
  {
    if (!sails.localmode && !req.session.downloading)
    {
      return res.json({msg:'Not currently syncing to dropbox.'});
    }
    else
    {
      //console.log("cancel: " + req.session.cancelsync);
      return res.json(req.session.downloadprogress);
    }
  },  

  downloadall:function(req,res)
  {
    //console.log(req.session);
    var eventid = req.param('id');
    // removed this for now :   !req.session.downloading
    if (!sails.localmode && !req.session.downloading)
    {
        req.session.downloading = true;
        delete req.session.cancelsync;
        delete cancelthese[req.session.id];
        req.session.save();

        process.nextTick(function(){
          var eventid = req.session.passport.user.currentevent;
          if (eventid==null)
          {
            req.session.flash = 'Event not Specified';
            return res.redirect('/post');
          }
          var files = [];
          var missing = [];


          //console.log('ok to download');

          //get list of files...
          dir = path.normalize(path.dirname(require.main.filename) + uploaddir);

          var calls = [];

          var dbClient = new Dropbox.Client({
            key         : sails.config.dropbox_clientid,
            secret      : sails.config.dropbox_clientsecret,
            sandbox     : false,
            token       : req.session.passport.user.dropbox.accessToken,
          });

          process.nextTick(function(){

            //console.log('starting on next tick');

            Event.findOne(eventid,function(err,ev)
            {
              User.find({},function(err,users){

                var eventname = ev.name;
                Media.find({'event_id':eventid},function(err,data)
                {

                  //call function:
                  var request = require('request');
                  //console.log('http://localhost:'+sails.config.port+'/post/document/'+eventid);
                  request('http://localhost:'+sails.config.port+'/post/document/'+eventid,
                    function(err,resp,doc) 
                    {
                      var documentfilename = 'upload/'+eventid+".html";
                      fs.writeFileSync(documentfilename, doc);
                      //console.log('done writing file list');
                      _.each(data,function(d)
                      {
                        if (d.path)
                          files.push(d);
                        else
                          missing.push(d);
                      });
                    
                    //do some more things:
                  var busy = false;
                  var counter = 0;
                  //console.log(files);
                  var counter = 0;

                  //upload document to dropbox:
                  calls.push(function(cb){
                    
                    if (cancelthese[req.session.id])
                    {
                      return cb(true);
                    }
                    else
                    {
                      //console.log('making dropbox dir');
                      req.session.downloadprogress = {value:0,status:'making directory'};
                      req.session.save();
                      //console.log(req.session.downloadprogress);
                      dbClient.mkdir(eventname,function(err,stat)
                      {
                        req.session.downloadprogress = {value:0,status:'uploading shotlist'};
                        req.session.save();

                        fs.readFile(documentfilename, function(error, data) {
                          var request = dbClient.writeFile(eventname + "/shotlist.html", data, function(error, stat) {
                          //error or complete
                            //console.log('uploaded shot list');
                            if (error)
                              console.log("error uploading document:" + error);

                            //console.log("checking for : "+dir + ev.id + ".xml")
                            if (fs.existsSync(dir + ev.id + ".xml"))
                            {
                                //console.log("writing xml file");
                                fs.readFile(dir + ev.id + ".xml", function(error, data) {
                                  var request = dbClient.writeFile(eventname + "/EDL.xml", data, function(error, stat) {
                                  //error or complete
                                    if (error)
                                      console.log("error uploading xml document:" + error);

                                    cb();
                                  });
                                });
                            }
                            else
                            {
                              cb();
                            }
                          });
                        });
                      });
                    }
                  });

                  //for each file:
                  _.each(files,function(f){

                    //download it from s3 to temp storage
                    calls.push(function(cb){
                     // process.nextTick(function(){
                                    
                      //console.log(req.session.cancelsync);
                      //req.session.cancelsync = true;
                      
                      //console.log(req.session);
                      //console.log("x:"+req.session.cancelsync);

                      if (cancelthese[req.session.id])
                      {
                        return cb(true);
                      }
                      else
                      {
                        var file = f;

                        if (fs.existsSync(dir+"/"+file.path))
                        {
                          //console.log(dir+"/"+file.path + ' exists');
                          counter++;
                          var prog = counter/(files.length*2);
                          req.session.downloadprogress = {value:prog*100,status:(counter/2) + ' of ' + files.length};
                          req.session.save();
                          
                          cb();
                        }
                        else
                        {
                          
                          var s3 = ss3.createClient({
                            s3Options: {
                              accessKeyId: sails.config.AWS_ACCESS_KEY_ID,
                              secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY,
                              region: sails.config.S3_REGION
                            },
                          });

                          var params = {
                            localFile: path.normalize(dir+"/"+file.path),
                            s3Params: {
                              Bucket: sails.config.S3_BUCKET,
                              Key: "upload/"+file.path,
                            },
                          };

                          var downloader = s3.downloadFile(params);

                          downloader.on('error', function(err) {
                            console.error("unable to download:", err);
                            counter++;
                            req.session.downloadprogress = {value:(counter/(files.length*2))*100,status:(counter/2) + ' of ' + files.length};
                            req.session.save();
                            cb();
                          });
                          downloader.on('progress', function() {
                            var prog = ((downloader.progressAmount/downloader.progressTotal) + counter)/(files.length*2);
                            //console.log(prog);
                            if ((downloader.progressAmount/downloader.progressTotal) < 1)
                            {
                              //console.log((downloader.progressAmount/downloader.progressTotal) + counter);
                               req.session.downloadprogress = {value:prog*100,status:(counter/2) + ' of ' + files.length};
                               //console.log("prog: "+req.session.downloadprogress.value);
                               req.session.save();
                            }
                            //console.log("progress", downloader.progressAmount, downloader.progressTotal);
                          });
                          downloader.on('end', function() {
                            //console.log('s3 end');
                            //console.log(counter);
                            counter++;
                            req.session.downloadprogress = {value:(counter/(files.length*2))*100,status:(counter/2) + ' of ' + files.length};
                            req.session.save();
                            
                            cb();
                          });
                        }
                      }
                     // });//next tick
                    });

                      //upload the file to dropbox
                      calls.push(function(cb){
                        if (cancelthese[req.session.id])
                        {
                          return cb(true);
                        }
                        else
                        {



                        var file = f;
                        if (fs.existsSync(dir+"/"+file.path))
                        {
                              //var filename = files[c].path;
                              //console.log(c + " : " + files[c]);

                              //FIXED -- change filename to something useful:
                              var thisfile = file;
                              //ev is the current event (for looking up shot names / types)
                              var thisuser = _.findWhere(users, {id: thisfile.created_by});
                              //var timestamp = moment(thisfile.createdAt);
                              var timestamp = thisfile.meta.static_meta.captured_at.split(' ');

                              var shottype = ev.eventtype.shot_types[thisfile.meta.static_meta.shot];
                              if (!shottype)
                                shottype = {name:'Unknown'};

                              var cc =  ev.coverage_classes[thisfile.meta.static_meta.coverage_class];
                              if (cc==undefined)
                              {
                                cc = {name:"Unknown"};
                              }

                              
                              
                              var filename = timestamp[1].replace(':','-').replace(':','-') + '_' + shottype.name + '_' + cc.name + '_' + thisuser.profile.displayName + path.extname(thisfile.path);

                              //console.log(filename);
                              //console.log(files);
                              //console.log('readingfile')
                              //var file = fs.openSync(dir+"/"+filename, 'r');
                              fs.readFile(dir+"/"+file.path, function(error, data) {
                                //console.log('readfile');
                                var request = dbClient.writeFile(eventname + "/" + filename, data, function(error, stat) {
                                  //error or complete
                                  if (error)
                                    console.log("error:" + error);

                                  //console.log(stat);

                                  counter++;
                                  req.session.downloadprogress = {value:(counter/(files.length*2))*100,status:(counter/2) + ' of ' + files.length};
                                  //console.log('counter: '+counter);

                                  //console.log("prog: "+((counter/(files.length*2))*100);
                                  req.session.save();
                                  
                                  cb();
                                });

                                // request.upload.addEventListener('progress', function(e)
                                //   {
                                //     console.log(e);
                                //     req.session.downloadprogress = {value:(e)*100,status:'sync'};
                                //     req.session.save();
                                //   }, false);
                              });

                          }//exists;
                          else
                          {
                            counter++;
                            req.session.downloadprogress = {value:((counter/files.length*2))*100,status:(counter/2) + ' of ' + files.length};
                            req.session.save();
                            cb();
                          }
                        }
                      });

                      //delete the file
                      calls.push(function(cb){
                        var file = f;
                        if (fs.existsSync(dir+"/"+file.path))
                        {
                          //console.log('delete file');
                         
                          //delete file:
                          fs.unlinkSync(dir+"/"+file.path);
                          //console.log('file deleted');
                        }
                        cb();
                      });
                    });

                    //console.log('starting async');
    
                    //console.log(files)

                    async.series(calls,function(err)
                    {
                      if (err)
                      {
                        console.log('sync cancelled');
                        req.session.downloadprogress = {value:0,status:'sync cancelled'};
                        delete req.session.downloading;
                        delete req.session.cancelsync;
                        req.session.save();
                      }
                      else
                      {
                          //done all
                        //console.log("DONE ALL");
                        req.session.downloadprogress = {value:100,status:'done'};
                        req.session.save();
                         var email = req.session.passport.user.profile.emails[0].value;
                        //THIS LINE FAILS!!
                        console.log(email);
                        Email.sendEmail({to:email,subject:"Bootlegger Dropbox Upload Complete",content:"The Dropbox transfer for your Event finished, now you can start editing!"});
                        console.log('email sent');
                      }                     
                    });
                    //console.log('returning req');
                    return res.json({ok:files.length, missing:missing.length});           
                  }); //end of document
              }); //end of find media
            }); // end of find user
          }); // end of find event
        }); // end of next tick
      }); // end of next tick
    }
    else
    {
      console.log("already doing it");
    }
  }

};
