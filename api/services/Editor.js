//edit file:
var uploaddir = "/upload/";
var ss3 = require('s3');
var path = require('path');
var fs = require('fs');
var os = require('os');
var fivebeans = require('fivebeans');

var client = null;

exports.audiosync = function(config) {
	if (client==null)
	{
		client = new fivebeans.client(sails.config.BEANSTALK_HOST, sails.config.BEANSTALK_PORT);
		client
		    .on('connect', function()
		    {
		        // client can now be used
		        client.use("edits", function(err, tubename) {
		        	sails.winston.info("Using the [edits] beanstalk tube");
		        	client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'audio',payload:config}]) , function(err, jobid) {
		        		if (!err)
		        			sails.winston.info("Audio Sync submitted");
		        		else
		        			sails.winston.error(err);
		        	});
		        });
		    })
		    .on('error', function(err)
		    {
		        // connection failure
		        sails.winston.error(err);
		    })
		    .on('close', function()
		    {
		        // underlying connection has closed
		    })
		    .connect();
	}
	else
	{
		client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'audio',payload:config}]), function(err, jobid) {
			if (!err)
				sails.winston.info("Audio Sync submitted");
			else
				sails.winston.error(err);
		});
	}
}

exports.dropbox = function(config) {
	if (client==null)
	{
		client = new fivebeans.client(sails.config.BEANSTALK_HOST, sails.config.BEANSTALK_PORT);
		client
		    .on('connect', function()
		    {
		        // client can now be used
		        client.use("edits", function(err, tubename) {
		        	sails.winston.info("Using the [edits] beanstalk tube");
		        	client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'dropbox',payload:config}]) , function(err, jobid) {
		        		if (!err)
		        			sails.winston.info("Dropbox Transfer submitted");
		        		else
		        			sails.winston.error(err);
		        	});
		        });
		    })
		    .on('error', function(err)
		    {
		        // connection failure
		        sails.winston.error(err);
		    })
		    .on('close', function()
		    {
		        // underlying connection has closed
		    })
		    .connect();
	}
	else
	{
		client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'dropbox',payload:config}]), function(err, jobid) {
			if (!err)
				sails.winston.info("Dropbox Transfer submitted");
			else
				sails.winston.error(err);
		});
	}
}

exports.edit = function(edit) {
	if (client==null)
	{
		client = new fivebeans.client(sails.config.BEANSTALK_HOST, sails.config.BEANSTALK_PORT);
		client
		    .on('connect', function()
		    {
		        // client can now be used
		        client.use("edits", function(err, tubename) {
		        	sails.winston.info("Using the [edits] beanstalk tube");
		        	client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'edit',payload:edit}]) , function(err, jobid) {
		        		if (!err)
		        			sails.winston.info("Edit submitted with id: "+ jobid + " / " + edit.code);
		        		else
		        			sails.winston.error(err);
		        	});
		        });
		    })
		    .on('error', function(err)
		    {
		        // connection failure
		        sails.winston.error(err);
		    })
		    .on('close', function()
		    {
		        // underlying connection has closed
		    })
		    .connect();
	}
	else
	{
		client.put(10, 0, 1000000000, JSON.stringify(['edits', {type:'edit',payload:edit}]), function(err, jobid) {
			if (!err)
				sails.winston.info("Edit submitted with id: "+ jobid + " / " + edit.code);
			else
				sails.winston.error(err);
		});
	}



	// //console.log(os.platform());
	// if (os.platform()=="win32")
	// {
	// 	process.env.FFMPEG_PATH = path.normalize(path.dirname(require.main.filename) + '/ffmpeg/ffmpeg.exe');
	// 	process.env.FFPROBE_PATH = path.normalize(path.dirname(require.main.filename) + '/ffmpeg/ffprobe.exe');
	// }
	// else
	// {
	// 	process.env.FFMPEG_PATH = path.normalize(path.dirname(require.main.filename) + '/ffmpeg/ffmpeg');
	// 	process.env.FFPROBE_PATH = path.normalize(path.dirname(require.main.filename) + '/ffmpeg/ffprobe');
	// }

	// //download files from s3
	// //console.log(edit.media);
	// //join files
	// var calls = [];
	// var thenewpath = '';

	// var dir = path.normalize(path.dirname(require.main.filename) + uploaddir);

	// //download
	// _.each(edit.media,function(m){
	// 	calls.push(function(cb){
	// 		var media = m;
	// 		//download from s3
	// 		var s3 = ss3.createClient({
	//             s3Options: {
	//               accessKeyId: sails.config.AWS_ACCESS_KEY_ID,
	//               secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY,
	//               region: sails.config.S3_REGION
	//             },
	//           });

	//           var params = {
	//             localFile: path.normalize(dir+"/"+media.path.replace(sails.config.S3_CLOUD_URL,'')),
	//             s3Params: {
	//               Bucket: sails.config.S3_BUCKET,
	//               Key: "upload/"+media.path.replace(sails.config.S3_CLOUD_URL,'')
	//             },
	//           };
	//           //console.log(params);
	//           var downloader = s3.downloadFile(params);

	//           downloader.on('error', function(err) {
	//             cb(true);
	//           });
	//           downloader.on('end', function() {
	//             cb();
	//           });
	// 	});
	// });


	// //-c:v libx264
	// _.each(edit.media,function(m){
	// 	calls.push(function(cb){
	// 		//return cb();
	// 		var media = m;
	// 		//download from s3
	// 		var ff = ffmpeg();
	// 		ff.input(path.normalize(dir+"/"+media.path.replace(sails.config.S3_CLOUD_URL,'')));
	// 		ff.fps(30.333)
	// 		ff.videoCodec('libx264');
	// 		ff.preset('slower');
	// 		ff.size('1920x?').aspect('16:9');
	// 		ff.outputOptions('-g 2')
	// 		ff.keepDAR();

	// 		ff.on('start',function(command){
	// 			console.log("ffmpeg "+command);
	// 		});
	// 		ff.on('error', function(err, stdout, stderr) {
	// 			console.log(stderr);
	// 			console.log(stdout);
	// 		    console.log('An error occurred: ' + err.message);
	// 		    cb(true);
	// 		  })
	// 		  .on('end', function() {
	// 		    console.log('Conversion finished !');
	// 		    cb();
	// 		  })
	// 		  .save(path.normalize(dir+"/"+media.path.replace(sails.config.S3_CLOUD_URL,'')));
	// 	});
	// });


	// //edit
	// // calls.push(function(cb){
	// // 	//# this is a comment
	// // 	// file '/path/to/file1'
	// // 	// file '/path/to/file2'
	// // 	// file '/path/to/file3'
	// // 	var filelist = _.reduce(edit.media,function(all,m)
	// // 	{
	// // 		return all + "file " + m.path.replace(sails.config.S3_CLOUD_URL,'') + "\r\n";
	// // 	},"");
	// // 	//fs.writeFileSync(path.normalize(dir+"/" + edit.code + '.txt'),filelist);
	// // 	cb();
	// // });

	// calls.push(function(cb){
	// 	//return cb();
	// 	var ff = ffmpeg();
	// 	_.each(edit.media,function(m)
	// 	{
	// 		ff.mergeAdd(path.normalize(path.dirname(require.main.filename) + '/upload/' + m.path.replace(sails.config.S3_CLOUD_URL,'')));
	// 	});

	// 	ff.on('start',function(command){
	// 		console.log("ffmpeg "+command);
	// 	});
	// 	ff.on('error', function(err, stdout, stderr) {
	// 		console.log(stderr);
	// 		console.log(stdout);
	// 	    console.log('An error occurred: ' + err.message);
	// 	    cb(true);
	// 	  })
	// 	  .on('end', function() {
	// 	    console.log('Merging finished !');
	// 	    cb();
	// 	  })
	// 	  .mergeToFile(path.normalize(path.dirname(require.main.filename) + '/upload/' + edit.code + '.mp4'), path.normalize(path.dirname(require.main.filename) + '/.tmp/'));
	//});

	// calls.push(function(cb){

	// 	var ff = ffmpeg();
	// 	ff.addInput(path.normalize(path.dirname(require.main.filename) + '/upload/' + edit.code + '.mp4'));
	// 	ff.addInput(path.normalize(path.dirname(require.main.filename)+'/assets/images/logo.png'));
	// 	ff.complexFilter('overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2');
	// 	ff.output(path.normalize(path.dirname(require.main.filename) + '/upload/' + edit.code + '.mp4'));

	// 	ff.on('error', function(err) {
	// 	    console.log('An error occurred: ' + err.message);
	// 	  })
	// 	  .on('end', function() {
	// 	    console.log('Watermarking Finished!');
	// 	    cb();
	// 	  }).run();

	// });


	//ff.addInput(path.normalize(path.dirname(require.main.filename)+'/assets/images/logo.png'));
	//ff.complexFilter('overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2');

	//upload to s3

	// calls.push(function(cb){
	// 	var knox_params = {
	// 	    key: sails.config.AWS_ACCESS_KEY_ID,
	// 	    secret: sails.config.AWS_SECRET_ACCESS_KEY,
	// 	    bucket: sails.config.S3_BUCKET
	// 	  };
	// 	  var client = knox.createClient(knox_params);
	// 	  client.putFile(path.normalize(path.dirname(require.main.filename) + '/upload/' +edit.code + ".mp4"), 'upload/' + edit.code + ".mp4", {'x-amz-acl': 'public-read'},
	// 	   		function(err, result) {
	// 	   			//console.log(err);
	// 	   			cb();
	// 	  });

	// });

	// calls.push(function(cb){
	// 	AWS.config.update({accessKeyId: sails.config.AWS_ACCESS_KEY_ID, secretAccessKey: sails.config.AWS_SECRET_ACCESS_KEY});
	// 	var elastictranscoder = new AWS.ElasticTranscoder();
	// 	elastictranscoder.createJob({
	// 	  PipelineId: sails.config.ELASTIC_PIPELINE,
	// 	  //InputKeyPrefix: '/upload',
	// 	  OutputKeyPrefix: 'upload/',
	// 	  Input: {
	// 	    Key: 'upload/' + edit.code + '.mp4',
	// 	    FrameRate: 'auto',
	// 	    Resolution: 'auto',
	// 	    AspectRatio: 'auto',
	// 	    Interlaced: 'auto',
	// 	    Container: 'auto' },
	// 	  Output: {
	// 	    Key: edit.code + '.mp4',
	// 	    //ThumbnailPattern: 'thumbs-{count}',
	// 	    PresetId: '1351620000001-000020', // specifies the output video format
	// 	    Rotate: 'auto',
	// 	    Watermarks:[
 //            {
 //               "InputKey":"logos/logo.png",
 //               "PresetWatermarkId":"BottomRight"
 //            }]
	// 	}
	// 	  }, function(error, data) {
	// 	    // handle callback
	// 	    //console.log(error);
	// 	    //console.log(data);
	// 	    // console.log('transcode submitted');
	// 	    process.nextTick(cb);
	// 	});

	// });

	// async.series(calls,function(err){
	// 	if (err)
	// 	{
	// 		console.log("editing failed");
	// 		edit.shortlink = edit.code;
	// 		edit.failed = true;
	// 		delete edit.code;
	// 		//update edit record
	// 		edit.save(function(err,done)
	// 		{
	// 			console.log("edit saved");
	// 		});
	// 	}
	// 	else
	// 	{
	// 		console.log("editing done");
	// 		edit.path = edit.code + '.mp4';
	// 		edit.shortlink = edit.code;
	// 		delete edit.code;
	// 		//update edit record
	// 		edit.save(function(err,done)
	// 		{
	// 			console.log("edit saved");
	// 		});
	// 	}
	// 	//Edits.update({edit.id},{path:thenewpath}
	// });


};
