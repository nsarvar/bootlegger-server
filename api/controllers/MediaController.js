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

module.exports = {

	index:function(req,res)
	{
		return res.redirect('/event/view');
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

	s3notify:function(req,res)
	{
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

	uploadsign:function(req,res)
	{
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

	addmedia:function(req,res)
	{
		//console.log("mediaparams: "+req.param);
		//create media with meta-data
		var themeta = req.params.all();
		if (themeta.static_meta != undefined)
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

	uploadthumb:function(req,res)
	{
		var knox_params = {
		    key: sails.config.AWS_ACCESS_KEY_ID,
		    secret: sails.config.AWS_SECRET_ACCESS_KEY,
		    bucket: sails.config.S3_BUCKET
		  }

		var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);

		//console.log(req.files);
		var mid = req.param('id');

		if (req.file('thumbnail') != null)
		{
			req.file('thumbnail').upload(function(err, tt)
			{
				//console.log("uploading thumb");	
				//console.log(tt[0]);
				var thefile = tt[0];

				//check upstream
				var canupload = false;
				//var request = require('request');

				var client = knox.createClient(knox_params);
				var tmp = thefile.fd;
				//console.log(req.files.thumbnail);
				if (req.param('sync'))
					var filename = thefile.filename;
				else
					var filename = (new Date().getTime()) + '_tb_' + thefile.filename;


		    	//console.log('screenshots were saved')
		    	if (!sails.localmode)
		    	{
		    		if (req.param('sync'))
		    			var tpng = filename.replace('/upload/','');
		    		else
		    			var tpng = filename+'.png';

					client.putFile(tmp, 'upload/' + tpng, {'x-amz-acl': 'public-read'},
			    		function(err, result) {
			    			//done uploading
			    			if (err)
			    				console.log("s3 upload error: "+err);

			    			console.log("uploaded thumb " + tpng + " to s3");

			    			fs.unlink(tmp, function (err) {
			    				//console.log(err);
			    			});

			    			Media.findOne(mid).exec(function(err,m){
								if (!err && m!=undefined)
								{
									m.thumb = tpng;
									m.save(function(err){
										Log.logmore('Media',{msg:'thumb',userid:req.session.passport.user.id,media:mid});
										res.json({msg:'upload successful'},200);
										m.thumb = sails.config.S3_CLOUD_URL + m.thumb;
										m.nicify(function(){
											Event.publishUpdate(m.event_id,{update:true,media:m});
										});
										//Event.publishUpdate(m.event_id,{update:true,media:m});
										sails.eventmanager.checkstatus(m.event_id);
									});
								}
								else
								{
									console.log(err);
									res.json({msg:'upload fail'},500);
								}
							});
			    		});
				}
				else
				{
					//save locally
					fs.copySync(tmp,tmpdir + filename + '.png');
					Media.findOne(mid).exec(function(err,m){
						if (!err && m!=undefined)
						{
							m.thumb = '/upload/'+filename+'.png';
							m.save(function(err){
								res.json({msg:'upload successful'},200);
								console.log('notify thumb: '+m.event_id);
								m.nicify(function(){
									Event.publishUpdate(m.event_id,{update:true,media:m});
								});
								//Event.publishUpdate(m.event_id,{update:true,media:m});
							});
						}
						else
						{
							console.log(err);
							res.json({msg:'upload fail'},500);
						}
					});
				}
			});
		}
		else
		{
			res.json({msg:"No File Given"},500);
		}
	},

	upload:function(req,res)
	{

		var knox_params = {
		    key: sails.config.AWS_ACCESS_KEY_ID,
		    secret: sails.config.AWS_SECRET_ACCESS_KEY,
		    bucket: sails.config.AWS_S3_BUCKET
		  }

		var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);

		//return res.json({msg:'debug'});
		if (req.files.thefile != null)
		{
			process.nextTick(function(){
				//check upstream
				var canupload = false;
				var request = require('request');
				
				var client = knox.createClient(knox_params);

				var tmp = req.files.thefile.path;
				
				//upload a new file:
				if (!req.param('sync'))
	    			var filename = (new Date().getTime()) + '_' + req.files.thefile.name + '.mp4';
	    		else
	    			var filename = req.files.thefile.name;

				//console.log('snapshot saved to snapshot.png (200x125) with a frame at 00:00:22');
				if (!sails.localmode)
				{
					//notify user NOW, so they dont hang
					console.log("staring s3 upload");
					client.putFile(tmp, 'upload/' + filename, {'Content-Type': req.files.thefile.type,'x-amz-acl': 'public-read'},
				    function(err, result) {
				      if (err) {
				        //res.json({msg:"Upload transfer failed"},500);
				        return;
				      } else {
				        if (200 == result.statusCode) {
				          console.log('Uploaded to Amazon S3!');

				          fs.unlink(tmp, function (err) {
				            if (err) throw err;
				            	console.log('successfully deleted temp file '+req.files.thefile.path);
				            //CHANGE TO UPDATE MEDIA THAT ALREADY EXISTS

				            var mid = req.param('id');
				            console.log("media id: "+mid);
							Media.findOne(mid).exec(function(err,m){
								if (!err && m!=undefined)
								{
									//console.log("updating: "+m);

									m.path = filename;
									m.save(function(err){
										//console.log(m);
										sails.eventmanager.process(req, m);
										//Event.publishUpdate(m[0].event_id,{media:m[0]});
										//Media.publishUpdate(m.id,m);
										m.nicify(function(){
											Event.publishUpdate(m.event_id,{update:true,media:m});
										});
										//Event.publishUpdate(m.event_id,{update:true,media:m});
										// res.json({msg:'upload successful'},200);
									});
								}
								else
								{
									console.log(err);
									//res.json({msg:'upload save faild'},500);
									//console.log(m);
								}
							});
				          });
				        } else {
				          //res.json({msg:"Upload transfer failed"},500);
				        }

				      }
				  });
					
					return res.json({msg:'upload successful'},200);
				}
				else
				{
					//copy file locally
					var mid = req.param('id');
					fs.copySync(tmp,tmpdir + filename);
					Media.findOne(mid).exec(function(err,m){
						if (!err && m!=undefined)
						{
							console.log("updating locally: "+m.id);

							m.localpath = filename;
							m.save(function(err){
								//console.log(m);
								console.log('done local update');
								sails.eventmanager.process(req,m);
								//Event.publishUpdate(m[0].event_id,{media:m[0]});
								//Media.publishUpdate(m.id,m);
								m.nicify(function(){
									Event.publishUpdate(m.event_id,{update:true,media:m});
								});
								//Event.publishUpdate(m.event_id,{update:true,media:m});
								return res.json({msg:'upload to local successful'},200);
								console.log("saved");
							});
						}
						else
						{
							console.log(err);
							return res.json({msg:'local upload error'},500);
							//console.log(m);
						}
					});
				}	
			});
		}
		else
		{
			return res.json({msg:"No File Given"},500);
		}
	},

	update:function(req,res)
	{
		console.log(req.param('id'));	
		Media.findOne(req.param('id')).exec(function(err,media)
		{
			if (err || media == undefined)
				return res.json({msg:"No Media Given"},500);

			console.log(media);

			media.meta.static_meta = JSON.parse(req.param('static_meta'));
			media.meta.timed_meta = JSON.parse(req.param('timed_meta'));

			delete media.meta.static_meta.event_id;
			delete media.meta.static_meta.uploadedby;

			media.save(function(err){
				if (err)
					return res.json({msg:"Error Saving Media"},500);
				else
					return res.json({msg:"OK"},200);
			});
		});
	},

	event:function(req,res)
	{
		Event.findOne(req.params.id, function(err,ev)
		{
			User.find({}).exec(function(err,users)
    		{
				//console.log(req.params.id);
				//gets media for event
				Media.find({'event_id':req.params.id}).sort('createdAt DESC').exec(function(err,data)
				{
					_.each(data,function(m)
					{
						//for each media, set nice name;
						m.meta.static_meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
				         m.user = _.findWhere(users, {id: m.created_by});
				          //console.log(m.meta.static_meta.shot);
				          //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
				         m.meta.static_meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
				          if (!m.meta.static_meta.shot_ex)
				            m.meta.static_meta.shot_ex = {name:'Unknown'};

				          //console.log(ev.coverage_classes);

				          m.meta.static_meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
				          if (m.meta.static_meta.coverage_class_ex==undefined)
				          {
				            m.meta.static_meta.coverage_class_ex = {name:"Unknown"};
				          }

				          if (m.meta.static_meta.meta_phase && ev.phases)
				          {
					          m.meta.static_meta.meta_phase = ev.phases[m.meta.static_meta.meta_phase];
					          if (m.meta.static_meta.meta_phase==undefined)
					          {
					            delete m.meta.static_meta.meta_phase;
					          }
			      		  }

				  		var timestamp = m.meta.static_meta.captured_at.split(' ');
				  		var uu = "unknown";
				  		if (m.user)
				  			uu = m.user.profile.displayName;

				  		m.meta.static_meta.nicepath = timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.static_meta.shot_ex.name + '_' + m.meta.static_meta.coverage_class_ex.name + '_' + uu + path.extname(m.path);

				  		delete m.meta.static_meta.coverage_class;
				  		delete m.meta.static_meta.role;
				  		delete m.meta.static_meta.shot;


				  		if (m.path)
				  		{
				  			m.originalpath = m.path;
	              			m.path = sails.config.S3_TRANSCODE_URL + m.path;
	              		}
	              		if (m.thumb)
	              		{
	              			m.originalthumb = m.thumb;
	              			m.thumb = sails.config.S3_CLOUD_URL + m.thumb;
	              		}
				  	});


					//console.log(data);
					return res.json(data);
				});
			});
		});
	},

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

	nicejson:function(req,res)
	{
		var eventid = req.param('id');

	    User.find({}).exec(function(err,users)
	    {	
	        Event.findOne(eventid,function(err,ev){
	        	//console.log(err);

	          Media.find({'event_id':eventid}).sort('createdAt').exec(function(err,data)
	          {
	          	//console.log(data);

	            //for each media, go through and fill in ids:
	            _ = require('lodash');
	            _.each(data,function(m)
	            {
	              //role, shot coverage class
	              if (m.meta.static_meta.role)
	              {
	            	  m.meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
	          		}
	          		else
	          		{
	          			m.meta.role_ex={name:'Unknown'};
	          		}
	              m.user = _.findWhere(users, {id: m.created_by});
	              //console.log(m.user);
	              if (!m.user)
	              {
	              	m.user = {profile:{displayName:'Anon'}};
	              }
	              else
	              {
	              	delete m.user.pushcode;
	              	delete m.user.localcode;
	              	//privacy:
	              	if (m.user.permissions)
	              	{
	              		if (m.user.permissions[ev.id])
	              		{
	              			m.user = {profile:{displayName:'Anon'}};
	              		}
	              	}
	              }
	              delete m.user.pushcode;
	              //console.log(m.meta.static_meta.shot);
	              //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
	              if (m.meta.static_meta.shot)
	              {
	            	  m.meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
	          	  }
	              if (!m.meta.shot_ex)
	                m.meta.shot_ex = {name:'Unknown'};

            	  if (m.meta.static_meta.coverage_class)
            	  {
            	    m.meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
          		  }
	              if (!m.meta.coverage_class_ex)
	              {
	                m.meta.coverage_class_ex = {name:"Unknown"};
	              }

	              var timestamp = m.meta.static_meta.captured_at.split(' ');
	              var ext = '.mp4';
	              if (m.path)
	              	ext = path.extname(m.path);

	              var filename =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + ext;
	              if (m.path)
	              {
	              	m.originalpath = sails.config.S3_CLOUD_URL + m.path;
	              	m.lowres = sails.config.S3_TRANSCODE_URL + m.path;
	              	m.path = sails.config.S3_CLOUD_URL + m.path;
	              }
	              if (m.thumb)
	              {
	              	m.originalthumb = m.thumb;
	                m.thumb = sails.config.S3_CLOUD_URL + escape(m.originalthumb);
	          	  }
	          	  //console.log(m);
	            });//end each
	            res.json(data);
	          });
	        });
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
