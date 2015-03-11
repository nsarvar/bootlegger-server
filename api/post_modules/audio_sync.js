var _ = require('lodash');
var path = require('path');
var uploaddir = "/upload/";
var fs = require('fs-extra');
var FFmpeg = require('fluent-ffmpeg');
var moment = require('moment');

function process_files(ev)
{
	console.log("processing " + ev.id);
	var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);

	//start ffmpeg:

	Media.find({event_id:ev.id}).exec(function(err,media)
	{
		//for each media, add to list:
		var async = require('async');
		var calls = [];

		var valid = [];
		_.each(media, function(m)
		{
			console.log("checking "+m);
			if (m.path != undefined && fs.existsSync(tmpdir + m.path))
			{
				console.log("adding to conversion list");
				valid.push(tmpdir + m.path + ".wav");
				calls.push(function(callback) {
					//add to queue:
					console.log('converting '+ tmpdir + m.path);
					if (!fs.existsSync(tmpdir + m.path + '.wav'))
					{
						var command = new FFmpeg({ source: tmpdir + m.path})
						.on('error', function(err) {
			        		console.log('Cannot process video: ' + err.message);
			        		callback(null,m);
			    		})
			    		.on('end', function() {
			        		console.log('Processing finished successfully');
			        		//adjust progress:
			        		callback(null,m);
			        	})
			        	.saveToFile(tmpdir + m.path + '.wav');
		        	}
		        	else
		        	{
		        		callback(null,m);
		        	}
				});
			}
			//path
		});

		calls.push(function(cb) {
			//do matlab processing:
			var esc = require('shell-escape');
			var exec = require('child_process').exec;
			//TODO -- pass arguments
			
			var args = {groundTruthPath:ev.audio, clips:valid};
			console.log(esc([JSON.stringify(args)]));
			var filename = tmpdir + "input_" + ev.id + ".json";
			fs.writeFileSync(filename, JSON.stringify(args));

			exec(path.normalize(path.dirname(require.main.filename)) + '/sync_audio/SyncClips "'+filename+'"', function callback(error, stdout, stderr){
			    // result
			    if (error)
			    {
			    	console.log(error);
			    	cb(error);
			    }
			    else
			    {
			    	 Event.findOne(ev.id).exec(function(err,e)
				    {
				    	e.audio_progress = 100;
				    	e.save(function(err)
				    	{
				    		genedl(ev.id,function(done)
					    	{
					    		console.log("done edl generation");
								cb(null,e);
					    	});
				    	});
				    });
			    }			   
			});
		});

		console.log("valid:" + valid);

		async.series(calls, function(err, result) {
			console.log("done audio processing");
			if (err)
			{
				 Event.findOne(ev.id).exec(function(err,e)
			    {
			    	e.audio_progress = -1;
			    	e.save(function(err)
			    	{
			    	});
			    });
			}
		});		
	});
}

function genedl(event,callback)
{
	var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);
	//get the processed edl for an event

	User.find({}).exec(function(err,users)
    {
		Event.findOne(event).exec(function(err,ev){

			//get media
			//order by captured at (in case no offset)
			Media.find({event_id:event},function(err, medias){

				//load assets master file
				fs.readFile('assets/FCP.xml', 'utf8', function (err,data) {
				  if (err) {
				    return console.log(err);
				  }
				  
				  data = data.replace(/%%sequencename%%/gi,ev.name);

				  var tracks = "";
				  var audiotracks = "";
				  //var audios = "";
				  var trackmaster = fs.readFileSync('assets/VideoTrack_FCP.xml', 'utf8');
				  var audiomaster = fs.readFileSync('assets/AudioTrack_FCP.xml', 'utf8');
				  var clipmaster = fs.readFileSync('assets/ClipItem.xml', 'utf8');
				  var audioclipmaster = fs.readFileSync('assets/AudioClipItem.xml', 'utf8');

				  //console.log(medias);
				  //var i = 0;
				  var totalduration = 0;
				  var alltracks = "";
				  var allaudiotracks = "";
				  var mediatracks = {};

				  //mediatracks.push([]);
				  //check for overlaps???
		
				  var smallest;
				  //find smallest date:
				  smallest = moment(_.min(medias, function(m)
			    	{
				  		return moment(m.createdAt);
				  	}).createdAt);
				  //console.log("smallest: " + smallest.format('LLLL'));

				  //var trackid = 0;
				  _.each(medias,function(m)
				  {
				  	if (m.meta.static_meta.clip_length)
				  	{
				  		if (m.offset == undefined)
				  		{
				  			var mom = moment(m.createdAt);

				  			m.offset = (mom.diff(smallest,'seconds',true)); //need this in seconds
				  			//console.log("offset: "+m.offset);
				  			//console.log("clip length: "+m.meta.static_meta.clip_length / 1000);
				  		}

				  		if (mediatracks[m.created_by] == undefined)
				  			mediatracks[m.created_by] = [];

				  		mediatracks[m.created_by].push(m);
				  	}
				  });

				  //console.log("tracks: "+mediatracks);

				  //for each track / media
				  var framerate = 30.3;
				  var j = 0;
			  	  _.each(mediatracks,function(tt)
				  {
				  	tracks = "";
				  	audiotracks = "";
				  	//console.log(tt);
				  	_.each(tt,function(m,p)
				  	{

					  	if (m.meta.static_meta.clip_length && m.offset!=undefined)
					  	{

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
					  		m.path =  timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + m.user.profile.displayName + ".mp4";


					  		var durations = m.meta.static_meta.clip_length.split(':');
					  		var duration = (parseFloat(durations[0]) / 3600) + (parseFloat(durations[1]) / 60) + parseFloat(durations[2]);

						  	var t = clipmaster;
						  	t = t.replace(/%%id%%/gi,j + "-" + p);
						  	t = t.replace(/%%path%%/gi,(m.path || m.name));
						  	t = t.replace(/%%name%%/gi,(m.path || m.name));
						  	t = t.replace(/%%start%%/gi,(m.offset)*framerate);
						  	t = t.replace(/%%end%%/gi,(m.offset + duration)*framerate);
						  	t = t.replace(/%%duration%%/gi,duration*framerate);
						  	t = t.replace(/%%audioid%%/gi,j + "-a-" + p);
						  	t = t.replace(/%%trackindex%%/gi,j+1);
						  	tracks += t;

						  	var a = audioclipmaster;
						  	a = a.replace(/%%id%%/gi,j + "-" + p);
						  	a = a.replace(/%%audioid%%/gi,j + "-a-" + p);
						  	a = a.replace(/%%path%%/gi,(m.path || m.name));
						  	a = a.replace(/%%out%%/gi,duration*framerate);
						  	a = a.replace(/%%name%%/gi,(m.path || m.name));
						  	a = a.replace(/%%start%%/gi,(m.offset*framerate));
						  	a = a.replace(/%%end%%/gi,(m.offset + duration)*framerate);
						  	a = a.replace(/%%duration%%/gi,duration*framerate);
						  	a = a.replace(/%%trackindex%%/gi,j+1);
						  	audiotracks += a;

						  	totalduration = Math.max(m.offset + duration, totalduration);
						  }
					  });

				  	  thistrack = trackmaster;
				  	  thistrack = thistrack.replace(/%%track%%/gi,tracks);
				  	  var user = _.findWhere(users, {id: tt[0].created_by});
				  	  if (user == undefined)
				  	  	user = tt[0].created_by;
				  	  if (user.profile != undefined)
				  	  {
				  	  	thistrack = thistrack.replace(/%%trackname%%/gi,user.profile.displayName);
				  	  }
				  	  else
				  	  {
				  	  	thistrack = thistrack.replace(/%%trackname%%/gi,user);
				  	  }
				  	  alltracks += thistrack;

					  thisaudiotrack = audiomaster;
				  	  thisaudiotrack = thisaudiotrack.replace(/%%track%%/gi,audiotracks);
				  	  allaudiotracks += thisaudiotrack;
				  	  j++;
				  });//each tracks

 				  //data = data.replace('%%audiotracks%%',audios);
 				  
				  data = data.replace(/%%videotracks%%/gi,alltracks);
				  data = data.replace(/%%audiotracks%%/gi,allaudiotracks);
				  data = data.replace(/%%sequenceduration%%/gi,(totalduration*framerate));

				  //write to file:
				  fs.writeFileSync(tmpdir + ev.id + ".xml", data);

				  callback(data);

				  //res.send(data);
				});//fcp
			});//media
		});//event
	});//users
}

module.exports = {

	codename:'audio_sync',

	init:function()
	{
		//do nothing for now...
		process.env.LD_LIBRARY_PATH = "/usr/local/MATLAB/MATLAB_Compiler_Runtime/v80/bin/glnxa64/:/usr/local/MATLAB/MATLAB_Compiler_Runtime/v80/runtime/glnxa64";
	},

	getedl:function(event,req,res)
	{
		//console.log("done");
		genedl(event,function(data){
			res.setHeader('Content-disposition', 'attachment; filename=EDL.xml');
			res.setHeader('Content-type', 'text/xml');
			res.send(data);
		});
	},

	settings:function(event,res)
	{
		//upload box for audio file...
	  	res.view('post/audio_sync.ejs',{ event: event,name:'Audio Sync',description:'Let us automatically sync your clips to a master audio WAV track. This will produce a FinalCut XML file which you can import to start your edit.', _layoutFile:false });
	},

	progress:function(event,req,res)
	{
		Event.findOne(event).exec(function(err,m){
			if (!err && m!=undefined && m.audio_progress != undefined)
			{

				//open file and get progress + update the db
				res.json({progress:m.audio_progress});
			}
			else
			{
				res.json({progress:-1});
			}
		});
	},

	upload:function(event,req,res)
	{
		//do file upload...
		//console.log("doing upload");
		var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);
		//console.log(req.files);
		if (req.file('file') != undefined)
		{
			req.file('file').upload(function(err,files){

				var filename = files[0].filename;

				var tmp = files[0].fd;

				fs.copySync(tmp,tmpdir + filename);
			
				Event.findOne(event).exec(function(err,m){

					if (!err && m!=undefined)
					{
						//console.log(m);
						m.audio = tmpdir + filename;
						m.audio_progress = 0;
						m.save(function(err){
							//process file...
							process_files(m);
						});
					}
					else
					{
						console.log("err: " + err);
					}
				});
				console.log('done upload');
				req.session.flash = "Done Upload";
				res.redirect('/post');
			});
			
		}
		else
		{
			res.redirect('/post');
		}
	},

	reset:function(event,req,res)
	{
		Event.findOne(event).exec(function(err,m){

			if (!err && m!=undefined)
			{
				m.audio_progress = -1;
				m.save(function(err){
					res.redirect('/post');
				});
			}
			else
			{
				res.redirect('/post');
			}
		});
	}
};