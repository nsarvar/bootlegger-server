/**
 * MediaController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */
var fs = require('fs-extra');
var knox = require('knox');
var path = require('path');
//var formidable = require('formidable');
var uploaddir = "/upload/";
var _ = require('lodash');
var crypto = require('crypto');

var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var urlencode = require('urlencode');
var ss3 = require('s3');
var ObjectId = require('mongodb').ObjectID;

Object.resolve = function(path, obj, safe) {
    return path.split('.').reduce(function(prev, curr) {
        return !safe ? prev[curr] : (prev ? prev[curr] : undefined)
    }, obj || self)
}

module.exports = {

	index:function(req,res)
	{
		return res.redirect('/event/view');
	},

	transcodefile:function(req,res)
	{
		Log.logmore('Media',{msg:'Transcode File',userid:req.session.passport.user.id});
		
		var filename = decodeURI(req.param('filename'));
		console.log(filename);
		
		  AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
          var elastictranscoder = new AWS.ElasticTranscoder();
          elastictranscoder.createJob({
            PipelineId: sails.config.ELASTIC_PIPELINE,
            //InputKeyPrefix: '/upload',
            OutputKeyPrefix: 'upload/',
            Input: {
              Key: 'upload/' + filename.replace(sails.config.S3_CLOUD_URL,'').replace('_homog.mp4',''),
              FrameRate: 'auto',
              Resolution: 'auto',
              AspectRatio: 'auto',
              Interlaced: 'auto',
              Container: 'auto' },
            Output: {
              Key: filename.replace(sails.config.S3_CLOUD_URL,''),
              // CreateThumbnails:false,
              PresetId: sails.config.HOMOG_PRESET, // specifies the output video format
          	}
            }, function(error, data) {
              if (error)
              {
                  res.json({msg:error});
              }
              else
              {
                 Log.info("Transcode submitted");
				  res.json({jobid:data.Job.Id});
              }
          });	
	},

	transcode:function(req,res)
	{
		Log.logmore('Media',{msg:'Transcode Event',userid:req.session.passport.user.id,eventid:req.param('id')});
		AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
		var elastictranscoder = new AWS.ElasticTranscoder();
		Media.find({event_id:req.param('id')}).exec(function(err,media)
		{
			var calls = [];
			_.each(media,function(m)
			{
				calls.push(function(cb){
					elastictranscoder.createJob({
					  PipelineId: sails.config.ELASTIC_PIPELINE,
					  //InputKeyPrefix: '/upload',
					  OutputKeyPrefix: 'upload/',
					  Input: {
					    Key: 'upload/' + m.path,
					    FrameRate: 'auto',
					    Resolution: 'auto',
					    AspectRatio: 'auto',
					    Interlaced: 'auto',
					    Container: 'auto' },
					  Output: {
					    Key: m.path,
					    //ThumbnailPattern: 'thumbs-{count}',
					    PresetId: '1351620000001-000020', // specifies the output video format
					    Rotate: 'auto' }
					  }, function(error, data) {
					    // handle callback
					    //console.log(error);
					    //console.log(data);
					    // console.log('transcode submitted');
					    process.nextTick(cb);
					});
				});
			});
			async.series(calls,function(err)
			{

				req.session.flash = {msg:'Transcode Submitted'};
				res.redirect('/event/admin');
			});
		});
	},

  remove:function(req,res)
  {
    var mid = req.param('id');
    Media.findOne(mid).exec(function(err,m){
      var path = m.path;
      var thumb = m.thumb;
      //delete m.path;
      //delete m.thumb;
      //m.deleted = new Date();

      // console.log(m.id);

      Media.native(function(err, collection) {
          collection.findAndModify(
              {_id: new ObjectId(m.id)},
              [['_id','asc']],
              {$unset: {path: "",thumb:""},$set:{deleted:new Date()}},
              {update: true},
              function (err, object) {
                 // Continue...
                // console.log(err);
                // console.log(object);

            //console.log(m);
            //console.log(m.meta.static_meta);
            //m.save(function(done,saved)
            //{

              //console.log(done);

              //console.log(saved);
              res.json({msg:'ok'});
              //submit request to remove from s3 and from thumbnail and from transcode
              var s3 = ss3.createClient({
                s3Options: {
                  accessKeyId: sails.config.AWS_ACCESS_KEY_ID,
                  secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY,
                  region: sails.config.S3_REGION
                },
              });
              var params = {

                  Delete: { /* required */
                    Objects: [ /* required */
                      {
                        Key: "upload/"+path,
                      },
                      /* more items */
                    ],
                    Quiet: true
                  },
                  Bucket: sails.config.S3_BUCKET
              };
              var downloader = s3.deleteObjects(params);
              downloader.on('error', function(err) {

              });
              downloader.on('end', function() {
                console.log('file removed');
              });

              var params = {

                  Delete: { /* required */
                    Objects: [ /* required */
                      {
                        Key: "upload/"+thumb,
                      },
                      /* more items */
                    ],
                    Quiet: true
                  },
                  Bucket: sails.config.S3_BUCKET
              };
              var downloader = s3.deleteObjects(params);
              downloader.on('error', function(err) {

              });
              downloader.on('end', function() {
                console.log('thumb removed');
              });

              var params = {
                  Delete: { /* required */
                    Objects: [ /* required */
                      {
                        Key: "upload/"+path,
                      },
                      /* more items */
                    ],
                    Quiet: true
                  },
                  Bucket: sails.config.S3_TRANSCODE_BUCKET
              };
              var downloader = s3.deleteObjects(params);
              downloader.on('error', function(err) {

              });
              downloader.on('end', function() {
                console.log('transcode removed');
              });

        //});//save
      });
    });

      });
  },

  rm_tag:function(req,res)
  {
    var mid = req.param('id');
    var field = req.param('field');
    Media.findOne(mid).exec(function(err,m){
      delete m.meta.static_meta[field];
      //console.log(m.meta.static_meta);
      m.save(function(done)
      {
        res.json({msg:'ok'});
      });
    });
  },

  add_tag:function(req,res)
	{
		var mid = req.param('id');
		var field = req.param('field');
    var value = req.param('val');
		Media.findOne(mid).exec(function(err,m){
      m.meta.static_meta[field] = value;
      //console.log(m.meta.static_meta);
			m.save(function(done)
			{
				res.json({msg:'ok'});
			});
		});
	},

	star:function(req,res)
	{
		var mid = req.param('id');
		var val = req.param('star');
		Media.findOne(mid).exec(function(err,m){

			if (m.stars && m.stars[req.session.passport.user.id] && !val)
			{
				delete m.stars[req.session.passport.user.id];
			}

			if (val)
			{
				if (!m.stars)
					m.stars = {};
				m.stars[req.session.passport.user.id] = true;
			}

			//console.log(m);

			Log.logmore('Media',{msg:'star',userid:req.session.passport.user.id,media:mid,start:val});

			m.save(function(done)
			{
				res.json({msg:'ok'});
			});
		});
	},

	/**
	 * @api {post} /api/media/uploadcomplete/:id Notify on Upload
	 * @apiDescription Notify the API that the upload has completed (and that transcoding can begin)
	 * @apiName s3notify
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Id of media that is now uploaded
	 * @apiParam {String} filename Filename of file that was uploaded
	 *
	 */
	s3notify:function(req,res)
	{
		if (!req.param('filename'))
			return res.json({msg:'No filename given'},500);

		if (!req.param('id'))
			return res.json({msg:'No id given'},500);

		var filename = req.param('filename');
		var mid = req.param('id');
		Media.findOne(mid).exec(function(err,m){
			if (!err && m!=undefined)
			{
				m.path = filename;
				//console.log(filename);
				m.save(function(err){
					sails.eventmanager.process(req, m);

					m.nicify(function(){
						Event.publishUpdate(m.event_id,{update:true,media:m});
					});

					//trigger transcode into a streamable format for the web:
					AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
					var elastictranscoder = new AWS.ElasticTranscoder();
					elastictranscoder.createJob({
					  PipelineId: sails.config.ELASTIC_PIPELINE,
					  //InputKeyPrefix: '/upload',
					  OutputKeyPrefix: 'upload/',
					  Input: {
					    Key: 'upload/' + filename,
					    FrameRate: 'auto',
					    Resolution: 'auto',
					    AspectRatio: 'auto',
					    Interlaced: 'auto',
					    Container: 'auto' },
					  Output: {
					    Key: filename,
					    //ThumbnailPattern: 'thumbs-{count}',
					    PresetId: '1351620000001-000020', // specifies the output video format
					    Rotate: 'auto' }
					  }, function(error, data) {
					    // handle callback
					    //console.log(error);
					    //console.log(data);
					    console.log('transcode submitted');
					});

					Log.logmore('Media',{msg:'s3notify',userid:req.session.passport.user.id,media:mid});
					return res.json({msg:'OK'});
				});
			}
			else
			{
				console.log(err);
				return res.json({msg:'FAIL'},500);
			}
		});
	},

	/**
	 * @api {post} /api/media/uploadthumbcomplete/:id Notify on Thumb
	 * @apiDescription Notify the API that the thumbnail has uploaded
	 * @apiName s3notifythumb
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Id of media that the thumbnail belongs to
     * @apiParam {String} filename Filename of file that was uploaded
	 *
	 */
	s3notifythumb:function(req,res)
	{
		if (!req.param('filename'))
			return res.json({msg:'No filename given'},500);

		if (!req.param('id'))
			return res.json({msg:'No id given'},500);


		var filename = req.param('filename');
		var mid = req.param('id');
		Media.findOne(mid).exec(function(err,m){
			if (!err && m!=undefined)
			{
				m.thumb = filename;
				//console.log(filename);
				m.save(function(err){
					m.nicify(function(){
						Event.publishUpdate(m.event_id,{update:true,media:m});
					});
					//Event.publishUpdate(m.event_id,{update:true,media:m});
					sails.eventmanager.checkstatus(m.event_id);
					Log.logmore('Media',{msg:'s3notifythumb',userid:req.session.passport.user.id,media:mid});

					return res.json({msg:'OK'});
				});
			}
			else
			{
				console.log(err);
				return res.json({msg:'FAIL'},500);
			}
		});
	},

	/**
	 * @api {post} /api/media/signuploadthumb/:id Get Thumb Upload Url
	 * @apiDescription Retrieve an S3 PUT url to upload the thumbnail to
	 * @apiName signuploadthumb
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} filename Name of the file to upload
	 *
	 * @apiSuccess {String} signed_request Url that you can use to PUT file to.
	 */
	uploadsignthumb:function(req,res)
	{
		if (!req.param('filename'))
			return res.json({msg:'No filename given'},500);

	    var filename = req.param('filename');

	    //console.log(sails.config);
	    //console.log(filename);
	    //AWS.config.loadFromPath('./awscreds.json');
	    AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
	    var s3 = new AWS.S3({computeChecksums: true}); // this is the default setting
		var params = {Bucket: sails.config.S3_BUCKET, Key: 'upload/'+filename, ACL: "public-read"};
		var url = s3.getSignedUrl('putObject', params);
		//console.log("The URL is", url);
		var credentials = {
	        signed_request: url
	    };
		res.json(credentials);
	},

	/**
	 * @api {post} /api/media/signupload/:id Get Upload Url
	 * @apiDescription Retrieve an S3 PUT url to upload the media to
	 * @apiName signupload
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} filename Name of the file to upload
	 *
	 * @apiSuccess {String} signed_request Url that you can use to PUT file to.
	 */
	uploadsign:function(req,res)
	{
		if (!req.param('filename'))
			return res.json({msg:'No filename given'},500);

	    var filename = req.param('filename');

	    //console.log(sails.config);
	    //console.log(filename);
	    //AWS.config.loadFromPath('./awscreds.json');
	    AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
	    var s3 = new AWS.S3({computeChecksums: true}); // this is the default setting
		var params = {Bucket: sails.config.S3_BUCKET, Key: 'upload/'+filename, ACL: "public-read", ContentType: "video/mp4"};
		var url = s3.getSignedUrl('putObject', params);
		//console.log("The URL is", url);
		var credentials = {
	        signed_request: url
	    };
		res.json(credentials);
	},

	/**
	 * @api {post} /api/media/create Create Media
	 * @apiDescription Create a new item of media, and return the id to use for uploads and updates.
	 * @apiName createmedia
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 *
	 */
	addmedia:function(req,res)
	{
		//console.log("mediaparams: "+req.param);
		//create media with meta-data
		var themeta = req.params.all();
		//console.log(themeta);
		if (themeta.static_meta)
		{
			var static_meta = JSON.parse(themeta.static_meta);
			var timed_meta = JSON.parse(themeta.timed_meta);

			//console.log("meta:"+static_meta);
			var ev = static_meta.event_id;
			//console.log('eventid: '+ev);
			var createdby = static_meta.created_by;
			//console.log('created_by: '+createdby);
			//console.log("event_id: "+themeta.static_meta);
			delete static_meta.event_id;
			delete static_meta.created_by;
			var allmeta = {static_meta:static_meta,timed_meta:timed_meta};
			var newv = {meta:allmeta, event_id:ev, created_by:createdby};
			Media.create(newv).exec(function(err,m){
				//console.log(m);
				if (!err)
				{
					sails.eventmanager.process(req,m);
					m.nicify(function(){
						Event.publishUpdate(m.event_id,{media:m});
					});
					//Event.publishUpdate(ev,{media:m});
					newv.id = m.id;
					Media.publishCreate(newv);
					res.send(m.id);
				}
				else
				{
					console.log("error processing media: "+err);
					res.send(-1);
				}
			});
		}
		else
		{
			res.json({msg:'no media provided'},500)
		}
	},

	// uploadthumb:function(req,res)
	// {
	// 	var knox_params = {
	// 	    key: sails.config.AWS_ACCESS_KEY_ID,
	// 	    secret: sails.config.AWS_SECRET_ACCESS_KEY,
	// 	    bucket: sails.config.S3_BUCKET
	// 	  }

	// 	var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);

	// 	//console.log(req.files);
	// 	var mid = req.param('id');

	// 	if (req.file('thumbnail') != null)
	// 	{
	// 		req.file('thumbnail').upload(function(err, tt)
	// 		{
	// 			//console.log("uploading thumb");
	// 			//console.log(tt[0]);
	// 			var thefile = tt[0];

	// 			//check upstream
	// 			var canupload = false;
	// 			//var request = require('request');

	// 			var client = knox.createClient(knox_params);
	// 			var tmp = thefile.fd;
	// 			//console.log(req.files.thumbnail);
	// 			if (req.param('sync'))
	// 				var filename = thefile.filename;
	// 			else
	// 				var filename = (new Date().getTime()) + '_tb_' + urlencode(thefile.filename);


	// 	    	//console.log('screenshots were saved')
	// 	    	if (!sails.localmode)
	// 	    	{
	// 	    		if (req.param('sync'))
	// 	    			var tpng = filename.replace('/upload/','');
	// 	    		else
	// 	    			var tpng = filename+'.png';

	// 				client.putFile(tmp, 'upload/' + tpng, {'x-amz-acl': 'public-read'},
	// 		    		function(err, result) {
	// 		    			//done uploading
	// 		    			if (err)
	// 		    				console.log("s3 upload error: "+err);

	// 		    			console.log("uploaded thumb " + tpng + " to s3");

	// 		    			fs.unlink(tmp, function (err) {
	// 		    				//console.log(err);
	// 		    			});

	// 		    			Media.findOne(mid).exec(function(err,m){
	// 							if (!err && m!=undefined)
	// 							{
	// 								m.thumb = tpng;
	// 								m.save(function(err){
	// 									Log.logmore('Media',{msg:'thumb',userid:req.session.passport.user.id,media:mid});
	// 									res.json({msg:'upload successful'},200);
	// 									m.thumb = sails.config.S3_CLOUD_URL + m.thumb;
	// 									m.nicify(function(){
	// 										Event.publishUpdate(m.event_id,{update:true,media:m});
	// 									});
	// 									//Event.publishUpdate(m.event_id,{update:true,media:m});
	// 									sails.eventmanager.checkstatus(m.event_id);
	// 								});
	// 							}
	// 							else
	// 							{
	// 								console.log(err);
	// 								res.json({msg:'upload fail'},500);
	// 							}
	// 						});
	// 		    		});
	// 			}
	// 			else
	// 			{
	// 				//save locally
	// 				fs.copySync(tmp,tmpdir + filename + '.png');
	// 				Media.findOne(mid).exec(function(err,m){
	// 					if (!err && m!=undefined)
	// 					{
	// 						m.thumb = '/upload/'+filename+'.png';
	// 						m.save(function(err){
	// 							res.json({msg:'upload successful'},200);
	// 							console.log('notify thumb: '+m.event_id);
	// 							m.nicify(function(){
	// 								Event.publishUpdate(m.event_id,{update:true,media:m});
	// 							});
	// 							//Event.publishUpdate(m.event_id,{update:true,media:m});
	// 						});
	// 					}
	// 					else
	// 					{
	// 						console.log(err);
	// 						res.json({msg:'upload fail'},500);
	// 					}
	// 				});
	// 			}
	// 		});
	// 	}
	// 	else
	// 	{
	// 		res.json({msg:"No File Given"},500);
	// 	}
	// },

	// upload:function(req,res)
	// {

	// 	var knox_params = {
	// 	    key: sails.config.AWS_ACCESS_KEY_ID,
	// 	    secret: sails.config.AWS_SECRET_ACCESS_KEY,
	// 	    bucket: sails.config.AWS_S3_BUCKET
	// 	  }

	// 	var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);

	// 	//return res.json({msg:'debug'});
	// 	if (req.files.thefile != null)
	// 	{
	// 		process.nextTick(function(){
	// 			//check upstream
	// 			var canupload = false;
	// 			var request = require('request');

	// 			var client = knox.createClient(knox_params);

	// 			var tmp = req.files.thefile.path;

	// 			//upload a new file:
	// 			if (!req.param('sync'))
	//     			var filename = (new Date().getTime()) + '_' + req.files.thefile.name + '.mp4';
	//     		else
	//     			var filename = req.files.thefile.name;

	// 			//console.log('snapshot saved to snapshot.png (200x125) with a frame at 00:00:22');
	// 			if (!sails.localmode)
	// 			{
	// 				//notify user NOW, so they dont hang
	// 				console.log("staring s3 upload");
	// 				client.putFile(tmp, 'upload/' + filename, {'Content-Type': req.files.thefile.type,'x-amz-acl': 'public-read'},
	// 			    function(err, result) {
	// 			      if (err) {
	// 			        //res.json({msg:"Upload transfer failed"},500);
	// 			        return;
	// 			      } else {
	// 			        if (200 == result.statusCode) {
	// 			          console.log('Uploaded to Amazon S3!');

	// 			          fs.unlink(tmp, function (err) {
	// 			            if (err) throw err;
	// 			            	console.log('successfully deleted temp file '+req.files.thefile.path);
	// 			            //CHANGE TO UPDATE MEDIA THAT ALREADY EXISTS

	// 			            var mid = req.param('id');
	// 			            console.log("media id: "+mid);
	// 						Media.findOne(mid).exec(function(err,m){
	// 							if (!err && m!=undefined)
	// 							{
	// 								//console.log("updating: "+m);

	// 								m.path = filename;
	// 								m.save(function(err){
	// 									//console.log(m);
	// 									sails.eventmanager.process(req, m);
	// 									//Event.publishUpdate(m[0].event_id,{media:m[0]});
	// 									//Media.publishUpdate(m.id,m);
	// 									m.nicify(function(){
	// 										Event.publishUpdate(m.event_id,{update:true,media:m});
	// 									});
	// 									//Event.publishUpdate(m.event_id,{update:true,media:m});
	// 									// res.json({msg:'upload successful'},200);
	// 								});
	// 							}
	// 							else
	// 							{
	// 								console.log(err);
	// 								//res.json({msg:'upload save faild'},500);
	// 								//console.log(m);
	// 							}
	// 						});
	// 			          });
	// 			        } else {
	// 			          //res.json({msg:"Upload transfer failed"},500);
	// 			        }

	// 			      }
	// 			  });

	// 				return res.json({msg:'upload successful'},200);
	// 			}
	// 			else
	// 			{
	// 				//copy file locally
	// 				var mid = req.param('id');
	// 				fs.copySync(tmp,tmpdir + filename);
	// 				Media.findOne(mid).exec(function(err,m){
	// 					if (!err && m!=undefined)
	// 					{
	// 						console.log("updating locally: "+m.id);

	// 						m.localpath = filename;
	// 						m.save(function(err){
	// 							//console.log(m);
	// 							console.log('done local update');
	// 							sails.eventmanager.process(req,m);
	// 							//Event.publishUpdate(m[0].event_id,{media:m[0]});
	// 							//Media.publishUpdate(m.id,m);
	// 							m.nicify(function(){
	// 								Event.publishUpdate(m.event_id,{update:true,media:m});
	// 							});
	// 							//Event.publishUpdate(m.event_id,{update:true,media:m});
	// 							return res.json({msg:'upload to local successful'},200);
	// 							console.log("saved");
	// 						});
	// 					}
	// 					else
	// 					{
	// 						console.log(err);
	// 						return res.json({msg:'local upload error'},500);
	// 						//console.log(m);
	// 					}
	// 				});
	// 			}
	// 		});
	// 	}
	// 	else
	// 	{
	// 		return res.json({msg:"No File Given"},500);
	// 	}
	// },

	/**
	 * @api {socket.io get} /api/media/update/:id Update Meta-Data
	 * @apiDescription Update the meta-data of the give media
	 * @apiName update
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 * @apiParam {String} id Media id to update
	 * @apiParam {Object} static_meta Static Meta-data Object
	 * @apiParam {Object} timed_meta Time stamped Meta-data Object
 	 *
	 * @apiSuccess {String} msg 'ok'
	 */
	update:function(req,res)
	{
		if (!req.param('id'))
			return res.json({msg:'no id given'},500);
		//console.log(req.param('id'));
		Media.findOne(req.param('id')).exec(function(err,media)
		{
			if (err || media == undefined)
				return res.json({msg:"No Media Found"},500);

			//console.log(media);

			media.meta.static_meta = JSON.parse(req.param('static_meta'));
			media.meta.timed_meta = JSON.parse(req.param('timed_meta'));

			delete media.meta.static_meta.event_id;
			delete media.meta.static_meta.uploadedby;

			media.save(function(err){
				if (err)
					return res.json({msg:"Error Saving Media " + err},500);
				else
					return res.json({msg:"ok"});
			});
		});
	},
	
	
	update_edits:function(req,res)
	{
		if (!req.param('id'))
			return res.json({msg:'no id given'},500);
		//console.log(req.param('id'));
		Media.findOne(req.param('id')).exec(function(err,media)
		{
			if (err || media == undefined)
				return res.json({msg:"No Media Found"},500);
			
			media.edits = req.param('edits');
			media.meta.static_meta.edit_tag = new Date();
			
			media.save(function(err){
				if (err)
					return res.json({msg:"Error Saving Media " + err},500);
				else
					return res.json({msg:"ok"});
			});
		});
	},

	// event:function(req,res)
	// {
	// 	Event.findOne(req.params.id, function(err,ev)
	// 	{
	// 		User.find({}).exec(function(err,users)
  //   		{
	// 			//console.log(req.params.id);
	// 			//gets media for event
	// 			var criteria = {'event_id':req.params.id};
	// 		  	if (req.param('limit'))
	// 			  	criteria.limit = req.param('limit');
  //
	// 		      if (req.param('skip'))
	// 			  	criteria.skip = req.param('skip');
  //
	// 			Media.find(criteria).sort('createdAt DESC').exec(function(err,data)
	// 			{
	// 				_.each(data,function(m)
	// 				{
	// 					//for each media, set nice name;
  //
  //
	// 					 if (m.meta.static_meta.role)
	// 		              {
	// 		            	  m.meta.static_meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
	// 		          		}
	// 		          		else
	// 		          		{
	// 		          			m.meta.static_meta.role_ex = {name:'Unknown'};
	// 		          		}
  //
	// 			         m.user = _.findWhere(users, {id: m.created_by});
	// 			          //console.log(m.meta.static_meta.shot);
	// 			          //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
	// 			         m.meta.static_meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
	// 			          if (!m.meta.static_meta.shot_ex)
	// 			            m.meta.static_meta.shot_ex = {name:'Unknown'};
  //
	// 			          //console.log(ev.coverage_classes);
  //
	// 			          m.meta.static_meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
	// 			          if (m.meta.static_meta.coverage_class_ex==undefined)
	// 			          {
	// 			            m.meta.static_meta.coverage_class_ex = {name:"Unknown"};
	// 			          }
  //
	// 			          if (m.meta.static_meta.meta_phase && ev.phases)
	// 			          {
	// 				          m.meta.static_meta.meta_phase = ev.phases[m.meta.static_meta.meta_phase];
	// 				          if (m.meta.static_meta.meta_phase==undefined)
	// 				          {
	// 				            m.meta.static_meta.meta_phase;
	// 				          }
	// 		      		  }
  //
	// 			  		var timestamp = m.meta.static_meta.captured_at.split(' ');
	// 			  		var uu = "unknown";
	// 			  		if (m.user)
	// 			  			uu = m.user.profile.displayName;
  //
	// 			  		//m.meta.static_meta.nicepath = urlencode(timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.static_meta.role_ex.name + '_' + m.meta.static_meta.shot_ex.name + '_' + m.meta.static_meta.coverage_class_ex.name + '_' + uu + path.extname(m.path));
	// 			  		m.meta.static_meta.nicepath = urlencode((timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.static_meta.role_ex.name + '_' + m.meta.static_meta.shot_ex.name + '_' + m.meta.static_meta.coverage_class_ex.name + '_' + uu + path.extname(m.path)).replace(/ /g,'_'));
  //
  //
	// 			  		delete m.meta.static_meta.coverage_class;
	// 			  		delete m.meta.static_meta.role;
	// 			  		delete m.meta.static_meta.shot;
  //
  //
	// 			  		if (m.path)
	// 			  		{
	// 			  			m.originalpath = sails.config.S3_CLOUD_URL + m.path;
  //         			m.path = sails.config.S3_TRANSCODE_URL + m.path;
  //         		}
  //         		if (m.thumb)
  //         		{
  //         			m.originalthumb = m.thumb;
  //         			m.thumb = sails.config.S3_CLOUD_URL + m.thumb;
  //         		}
	// 			  	});
  //
  //
	// 				//console.log(data);
	// 				return res.json(data);
	// 			});
	// 		});
	// 	});
	// },

	totals:function(req,res)
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
	        // else
	        //   missing.push(d);

	        //console.log(d);

	        // if (d.meta.static_meta.filesize)
	        // {
	        //   filesize+=parseFloat(d.meta.static_meta.filesize);
	        // }
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

	      var mine = _.filter(data, {created_by:req.session.passport.user.id}).length;

	      //var usersmissing = _.pluck(missing, 'created_by')).length;
	      //console.log(usersmissing);

	        // User.find({}).exec(function(err,allusers)
	        // {
	        //     var usersmissing = _.countBy(missing, function(num) {
	        //       var x = _.findWhere(allusers, {id: num.created_by});
	        //       if (x)
	        //         return x.profile.displayName;
	        //       else
	        //         return 'Anon';
	        //        });

	            // var missingfrom = _.reduce(usersmissing,function(prev,next,val){
	            //   return prev + val + " (" + next + "), ";
	            // },"");

	            res.json({mine:mine,total:files.length,people:users,mins:+parseFloat(mins/60).toFixed(1)});
//	        });
	    });
	},

	availableoutputs:function(req,res)
	{

		if (!req.param('id'))
		{
			return res.json({msg:'no id given'},500);
		}
		var eventid = req.param('id');

		Media.getnicejson(req,res,eventid,function(thedata){

			var keys = _.reduce(thedata, function(result, n, key) {

						//for properties that are not objects (user added ones)
						var props = _.keys(n.meta.static_meta);
						_.each(props,function(p)
						{
							if (p != 'inspect' && typeof p != "object" && p!='clip_length' && p!='nicepath' && p!='local_filename' && p!='captured_at' && p!='filesize')
							{
								//console.log('adding prop '+p);
								if (!result['meta.static_meta.'+p])
									result['meta.static_meta.'+p] = {title:p,examples:[]};
							  	result['meta.static_meta.'+p].examples.push(n.meta.static_meta[p]);
							}
						});

						//console.log(result);

						if (!result['meta.static_meta.clip_length'])
							result['meta.static_meta.clip_length'] = {title:'Clip Length',examples:[],transform:'Math.round'};

              if (n.meta.static_meta.clip_length)
              {
						      var len = n.meta.static_meta.clip_length.split(':');
						      result['meta.static_meta.clip_length'].examples.push(Math.round((len[0] * 60 * 60) + (len[1]*60) + len[2] ));
              }

						if (!result['meta.static_meta.filesize'])
							result['meta.static_meta.filesize'] = {title:'File Size',examples:[],transform:'Math.round'};
						result['meta.static_meta.filesize'].examples.push(Math.round(n.meta.static_meta.filesize/1024));


						if (!result['user.profile.displayName'])
							result['user.profile.displayName'] = {title:'Contributor Name',examples:[]};
						result['user.profile.displayName'].examples.push(n.user.profile.displayName);

						if (!result['meta.role_ex.name'])
							result['meta.role_ex.name'] = {title:'Role',examples:[]};
						result['meta.role_ex.name'].examples.push(n.meta.role_ex.name);

						if (!result['meta.phase_ex.name'])
							result['meta.phase_ex.name'] = {title:'Phase',examples:[]};
						result['meta.phase_ex.name'].examples.push(n.meta.phase_ex.name);

						if (!result['meta.coverage_class_ex.name'])
							result['meta.coverage_class_ex.name'] = {title:'Subject',examples:[]};
						result['meta.coverage_class_ex.name'].examples.push(n.meta.coverage_class_ex.name);

						if (!result['meta.shot_ex.name'])
							result['meta.shot_ex.name'] = {title:'Shot',examples:[]};
						result['meta.shot_ex.name'].examples.push(n.meta.shot_ex.name);

					  return result;
					}, {});

			var output = [];
			_.forOwn(keys,function(value, key)
			{
				output.push({key: key,title:keys[key].title,transform:keys[key].transform,examples:keys[key].examples = _.unique(value.examples)});
			});

			res.json(output);
		});

		//var request = require('request');
		//request('http://'+sails.config.hostname+':'+sails.config.port+'/post/document/'+eventid,
	        // function(err,resp,doc)
	        // {

	        // });
			//group things together:

	},

	directorystructure:function(req,res)
	{
		if (!req.param('id') || !req.param('template'))
		{
			return res.json({msg:'no shoot id or template id given'},500);
		}
		//console.log("template: "+ req.param('template'));

		Event.findOne(req.param('id')).exec(function(err,event)
		{
			User.findOne(req.session.passport.user.id).exec(function(err,u)
		    {
		    	var template = {}
          var flagged = false;
		    	//console.log(u.outputtemplates);
		    	if (u.outputtemplates && u.outputtemplates[parseInt(req.param('template'))])
		    	{
              flagged = u.outputtemplates[parseInt(req.param('template'))].flagged;
					    template = u.outputtemplates[parseInt(req.param('template'))].outputs;
					       //console.log(template);
				  }
				//get all media:
				var dirs = [];

        //console.log(u.outputtemplates[parseInt(req.param('template'))]);

				Media.getnicejson(req,res,event.id,function(data){
          //reject media if only flagged ones are chosen:
          if (flagged==true)
          {
            //console.log('flagged');
            data = _.filter(data,function(m){
              return m.meta.static_meta.edit_tag;
            });
          }

          //console.log(data.length + " clips");

					var finaldirs = dodir(data,template,0);
					var output = {};
					output[event.name] = finaldirs;
					res.json(output);
				});
			});
		});
		//calculate test directory structure:

		var dodir = function(files,template,index)
		{
			//group files by current template level:
			var subdir = [];

			if (index < template.length)
			{
				//console.log('index: '+index);
				var key = template[index].key;
				//console.log("key: "+key);
				var grouped = _.groupBy(files, function(u)
				{
					return Object.resolve(key,u);
				});
				//console.log(_.keys(grouped));

				return _.mapValues(grouped,function(fs)
				{
					//console.log('dodir for: '+ g + ' ' + fs.length);
					//dirs[g] = [];
					return dodir(fs,template,index+1);
				});
			}
			else
			{
				//console.log('bottom of tree, return files');
				//console.log(_.pluck(files,'path'));
				
				return _.map(files,function(r){
					//console.log(r.meta.static_meta.nicepath);
					return {local:r.meta.static_meta.nicepath,remote:r.originalpath,id:r.id };}
				);
			}

		};
	},


	/**
	 * @api {get} /api/media/shoot/:id List Shoot Media
	 * @apiDescription List all the media from a given shoot
	 * @apiName eventmedia
	 * @apiGroup Media
	 * @apiVersion 0.0.2
	 * @apiPermission viewonly
	 *
	 * @apiParam {String} id Shoot ID
	 *
	 * @apiSuccess {Array} result List of media
	 */
	nicejson:function(req,res)
	{
		if (!req.param('id'))
		{
			return res.json({msg:'no id given'},500);
		}
		var eventid = req.param('id');
		Media.getnicejson(req,res,eventid,function(data)
		{
			return res.json(data);
		});
	},

	castlist:function(req,res)
	{
		Event.findOne(req.params.id, function(err,ev)
		{
			User.find({}).exec(function(err,users)
    		{
				//console.log(req.params.id);
				//gets media for event
				Media.find({'event_id':req.params.id,path:{'!':undefined}}).sort('createdAt DESC').limit(100).exec(function(err,data)
				{
					_.each(data,function(m)
					{
						//for each media, set nice name;
						//m.meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
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
				  		var uu = "unknown";
				  		if (m.user)
				  			uu = m.user.profile.displayName;

				  		//taken out: timestamp[1].replace(':','-').replace(':','-') + ' ' +
				  		m.title = m.meta.shot_ex.name + ' of ' + m.meta.coverage_class_ex.name + ' by ' + uu;
				  		m.contentId = sails.config.S3_CLOUD_URL + m.path;
				  		m.image = m.thumb;
				  		delete m.meta;
				  		delete m.path;
				  		delete m.name;
				  		delete m.user;
				  		delete m.thumb;
				  		delete m.updatedAt;
				  		delete m.createdAt;
				  		delete m.id;
				  		delete m.event_id;
				  		delete m.created_by;
				  	});
					//console.log(data);
					return res.json(data);
				});
			});
		});
	}
};
