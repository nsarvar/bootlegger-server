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

	s3notify:function(req,res)
	{
		var filename = req.param('filename');
		var mid = req.param('id');
		Media.findOne(mid).exec(function(err,m){
			if (!err && m!=undefined)
			{
				m.path = filename;
				m.save(function(err){
					sails.eventmanager.process(req, m);
					Event.publishUpdate(m.event_id,{update:true,media:m});
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
					Event.publishUpdate(ev,{media:m});
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

		if (req.files.thumbnail != null)
		{
			console.log("uploading thumb");
			var mid = req.param('id');

			//check upstream
			var canupload = false;
			//var request = require('request');

			var client = knox.createClient(knox_params);
			var tmp = req.files.thumbnail.path;
			//console.log(req.files.thumbnail);
			if (req.param('sync'))
				var filename = req.files.thumbnail.name;
			else
				var filename = (new Date().getTime()) + '_tb_' + req.files.thumbnail.name + '.mp4';


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
								m.thumb = sails.config.S3_URL+'/upload/' + tpng;
								m.save(function(err){
									res.json({msg:'upload successful'},200);
									Event.publishUpdate(m.event_id,{update:true,media:m});
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
							Event.publishUpdate(m.event_id,{update:true,media:m});
						});
					}
					else
					{
						console.log(err);
						res.json({msg:'upload fail'},500);
					}
				});
			}

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
										Event.publishUpdate(m.event_id,{update:true,media:m});
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
								Event.publishUpdate(m.event_id,{update:true,media:m});
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
				  		var uu = "unknown";
				  		if (m.user)
				  			uu = m.user.profile.displayName;



				  		m.nicepath =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + uu + path.extname(m.path);
				  	});


					//console.log(data);
					return res.json(data);
				});
			});
		});
	},

	nicejson:function(req,res)
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
	              var filename =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + path.extname(m.path);
	              m.originalpath = m.path;
	              m.path = filename;

	            });
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
				  		m.contentId = sails.config.S3_URL+'/upload/' + m.path;
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
