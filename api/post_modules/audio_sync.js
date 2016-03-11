/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var _ = require('lodash');
var path = require('path');
var uploaddir = "/upload/";
var fs = require('fs-extra');
var FFmpeg = require('fluent-ffmpeg');
var moment = require('moment');
var framerate = 29.97;
var uuid = require('node-uuid');

function genedl(req,event,callback)
{

	var tmpdir = path.normalize(path.dirname(require.main.filename) + uploaddir);
	//get the processed edl for an event
	User.find({}).exec(function(err,users)
    {
		//	console.log(event);
		Event.findOne(event).exec(function(err,ev){
			//order by captured at (in case no offset)
			if (!ev)
			{
				return callback("No Event Found");
			}
			Media.find({event_id:event}).exec(function(err, allmedia){
				//console.log(err);
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
				//console.log(allmedia);
				var request = require('request');
				var j = request.jar();
				var cookiesigned = require('cookie-signature');
				var signed = cookiesigned.sign(req.signedCookies['sails.sid'],req.secret);
				signed = "s:" + signed;
				var cookie = request.cookie('sails.sid='+signed);
				var url = sails.config.master_url;

				j.setCookie(cookie, url);
				request({url: sails.config.master_url+ '/media/directorystructure/'+event+'/?template='+req.param('template')+'&apikey='+req.session.CURRENT_API_KEY , jar: j}, function (err,resp,body) {

					//console.log(err);
					if (err)
					{
						return res.json({msg:err},500);
					}

					//console.log(body);

					var media = JSON.parse(body);

					//console.log(body);
					//group all the media into their respective paths and top level:
					var paths = [];
					mappaths(media,'',paths);

					//console.log(media);

					//console.log(bins);
					
					if (paths.length == 0)
					{
						//no media, return blank
						return callback("");
					}
					
					var masterid = 1;
					//map media object against path (to get extra info)
					_.each(paths,function(p){
						p.media = _.find(allmedia,{'id':p.id});
						p.uuid = uuid.v4();
						p.masterclipid = "masterclipid-"+masterid;
						p.clipitemid = "clipitem-"+masterid;
						p.fileid = "fileid-"+masterid;
						var durations = p.media.meta.static_meta.clip_length.split(':');
				  		var duration = (parseFloat(durations[0]) / 3600) + (parseFloat(durations[1]) / 60) + parseFloat(durations[2]);
						p.duration = duration;
						masterid++;
					});
					//sort
					
					var bins = genbins(media);
					
					var sorted = _.sortBy(paths,function(p){
						return moment(p.media.meta.static_meta.captured_at+':00','DD-MM-YYYY hh:mm:ss.SS a Z');
					});

					var smallest = moment(sorted[0].media.meta.static_meta.captured_at+':00','DD-MM-YYYY hh:mm:ss.SS a Z');

					//calculate offsets:
					_.each(sorted,function(m)
					{

						if (m.media.meta.static_meta.clip_length) //if it is a video
						{
							if (m.media.offset == undefined)//not been auto synced / had an offset applied...
							{
								var mom = moment(m.media.meta.static_meta.captured_at+':00','DD-MM-YYYY hh:mm:ss.SS a Z');
								//console.log(mom);
								m.offset = (mom.diff(smallest,'seconds',true)); //need this in seconds
							}
						}
					});

					//group by contributor
					var grouped = _.groupBy(sorted,function(u)
					{
						return u.media.created_by;
					});

					fs.readFile('assets/apple_xml/FCP.xml', 'utf8', function (err,data) {
					  if (err) {
					    return console.log(err);
					  }
						//replace name in the sequence
					  data = data.replace(/%%sequencename%%/gi,ev.name);

					  var mediafortrack = "";
					  var audiofortracks_l = "";
					  var audiofortracks_r = "";
					  //var audios = "";
					  var trackmaster = fs.readFileSync('assets/apple_xml/VideoTrack_FCP.xml', 'utf8');
					  var audiomaster = fs.readFileSync('assets/apple_xml/AudioTrack_FCP.xml', 'utf8');
					  var clipmaster = fs.readFileSync('assets/apple_xml/ClipItem.xml', 'utf8');
					  var audioclipmaster = fs.readFileSync('assets/apple_xml/AudioClipItem.xml', 'utf8');

					  var totalduration = 0;
					  var alltracks = "";
					  var allaudiotracks = "";
					  //var mediatracks = {};

					  //for each track / media
					  
					  var liveeditfilter = _.filter(sorted,function(s){
						 return s.media.edits; 
					  });
					  
					  /**
					   * CHECKING FOR LIVE EDIT TRACK
					   */
					 
					  var editedclips = [];
					  _.each(liveeditfilter,function(l)
					  {
						 _.each(l.media.edits,function(edit){
							 var clip = _.clone(l,true);
							 clip.inpoint = edit.inpoint;
							 clip.outpoint = edit.outpoint;
							 editedclips.push(clip);
						 }) 
					  });
					  
					  grouped['LIVE EDIT'] = editedclips;
					  
					  /**
					   * CHECKING FOR PRE_EDIT TRACK
					   */
					   
					  //console.log(sorted);
					  
					  //TEMP::
					  
					  //grouped = {};
					   
					  if (ev.timeline)
					  {
						  _.each(ev.timeline,function(track){
							var thetrack = [];	 
							 
							 _.each(track.items,function(i)
							 {
								var clip = _.find(sorted,function(r){
									return r.media.id == i.id;
								});
								if (clip)
								{
									var c = _.clone(clip,true);
									c.offset = i.offset;
									thetrack.push(c);
								}
							 });
							 
							 grouped[track.name] = thetrack; 
						  });					  
					  }
					  
					  var clipitemid = 1;
					  var trackindex = 1;
					  
				  	  _.each(grouped,function(clips,group)
					  {
					  		mediafortrack = "";
						    audiofortracks_l = "";
							audiofortracks_r = "";
							var clipindex = 1;
					  		//audiotracks = "";
						  	_.each(clips,function(m,p) //each clip in track
						  	{
							  	if (m.media.meta.static_meta.clip_length && m.offset!=undefined)
							  	{
								  	var t = clipmaster;									
									// console.log(m.inpoint);
									
									var start = (((m.inpoint)?(m.offset + m.inpoint):m.offset) * framerate);
									var end = (((m.outpoint)?(m.offset + m.outpoint):(m.offset+m.duration)) * framerate);
									var inp = (((m.inpoint)?m.inpoint:0)*framerate);
									var out = (((m.outpoint)?m.outpoint:m.duration)*framerate);
									var duration = start-end;
									  
									// console.log('start: '+start);
									// console.log('end: '+end);
									// console.log('in: '+inp);
									// console.log('out: '+out);
									  
									var t = '<clipitem id="clipitem-v-'+clipitemid+'" frameBlend="FALSE"><masterclipid>'+m.masterclipid+'</masterclipid><name>'+m.local+'</name><enabled>TRUE</enabled><duration>'+duration+'</duration><rate><timebase>29.97</timebase><ntsc>TRUE</ntsc></rate><start>'+start+'</start><end>'+end+'</end><in>'+inp+'</in><out>'+out+'</out><alphatype>black</alphatype>';
									t+='<file id="'+m.fileid+'"/>';	
									t+='<link><linkclipref>clipitem-v-'+clipitemid+'</linkclipref><mediatype>video</mediatype><trackindex>'+trackindex+'</trackindex><clipindex>'+clipindex+'</clipindex></link>';
									t+='<link><linkclipref>clipitem-a-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>'+trackindex+'</trackindex><clipindex>'+clipindex+'</clipindex><groupindex>1</groupindex></link>';
									//t+='<link><linkclipref>clipitem-b-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>2</trackindex><clipindex>1</clipindex><groupindex>1</groupindex></link>';
									t+='</clipitem>'; 
									  
									mediafortrack += t;


									var t = '<clipitem id="clipitem-a-'+clipitemid+'" frameBlend="FALSE" premiereChannelType="stereo"><masterclipid>'+m.masterclipid+'</masterclipid><name>'+m.local+'</name><enabled>TRUE</enabled><duration>'+duration+'</duration><rate><timebase>29.97</timebase><ntsc>TRUE</ntsc></rate><start>'+start+'</start><end>'+end+'</end><in>'+inp+'</in><out>'+out+'</out>';
									t+='<file id="'+m.fileid+'"/>';
									t+='<sourcetrack><mediatype>audio</mediatype><trackindex>'+trackindex+'</trackindex></sourcetrack>';
									t+= '<link><linkclipref>clipitem-v-'+clipitemid+'</linkclipref><mediatype>video</mediatype><trackindex>'+trackindex+'</trackindex><clipindex>'+clipindex+'</clipindex></link>';
									t+='<link><linkclipref>clipitem-a-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>'+trackindex+'</trackindex><clipindex>'+clipindex+'</clipindex><groupindex>1</groupindex></link>';
									// t+='<link><linkclipref>clipitem-b-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>2</trackindex><clipindex>1</clipindex><groupindex>1</groupindex></link>';
									t+='</clipitem>';

									
									audiofortracks_l+=t;
									
									// var t = '<clipitem id="clipitem-b-'+clipitemid+'"><masterclipid>'+m.masterclipid+'</masterclipid><name>'+m.local+'</name><enabled>TRUE</enabled><duration>'+(m.duration*framerate)+'</duration><rate><timebase>29.97</timebase><ntsc>TRUE</ntsc></rate><start>'+(m.offset * framerate)+'</start><end>'+((m.duration + m.offset) * framerate)+'</end><in>0</in><out>'+(m.duration*framerate)+'</out><file id="'+m.fileid+'"/>';
									// t+='<sourcetrack><mediatype>audio</mediatype><trackindex>2</trackindex></sourcetrack>';
									// // t+= '<link><linkclipref>clipitem-v-'+clipitemid+'</linkclipref><mediatype>video</mediatype><trackindex>1</trackindex><clipindex>1</clipindex></link>';
									// // t+='<link><linkclipref>clipitem-a-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>1</trackindex><clipindex>1</clipindex><groupindex>1</groupindex></link>';
									// // t+='<link><linkclipref>clipitem-b-'+clipitemid+'</linkclipref><mediatype>audio</mediatype><trackindex>2</trackindex><clipindex>1</clipindex><groupindex>1</groupindex></link>';
									// t+='</clipitem>'; 
									
									// audiofortracks_r+=t;
								  	totalduration = Math.max(m.offset + m.duration, totalduration);
									clipitemid++;
									clipindex ++;
								  }
							  });//end of each clip in track

					  	  thistrack = trackmaster;
					  	  thistrack = thistrack.replace(/%%track%%/gi,mediafortrack);
					  	  var user = _.find(users, {'id': group});

						  if (!user)
					  	  {
					  	  	thistrack = thistrack.replace(/%%trackname%%/gi,group);
					  	  }
					  	  else
					  	  {
					  	  	thistrack = thistrack.replace(/%%trackname%%/gi,user.profile.displayName);
					  	  }

					  	  alltracks += thistrack;//add video track to file
							
						  var thisaudiotrack = audiomaster;
					  	  thisaudiotrack = thisaudiotrack.replace(/%%track%%/gi,audiofortracks_l);
						  thisaudiotrack = thisaudiotrack.replace(/%%channelindex%%/gi,1);
					  	  allaudiotracks += thisaudiotrack;//add audio track to file
							
						  // thisaudiotrack = audiomaster;
					  	  // thisaudiotrack = thisaudiotrack.replace(/%%track%%/gi,audiofortracks_r);
						  // thisaudiotrack = thisaudiotrack.replace(/%%channelindex%%/gi,2);
					  	  //allaudiotracks += thisaudiotrack;//add audio track to file
					  	  trackindex++;
					  });//each grouped track (user)
					  
					  //WRAPPING IT UP:
					  var uuid = require('node-uuid');
					  data = data.replace(/%%uuid%%/gi,uuid.v4());
					  data = data.replace(/%%projecttitle%%/gi,ev.name);

					  data = data.replace(/%%videotracks%%/gi,alltracks);
					  data = data.replace(/%%audiotracks%%/gi,allaudiotracks);
					  data = data.replace(/%%sequenceduration%%/gi,(totalduration*framerate));			
					  data = data.replace(/%%date%%/gi,new Date());		
					  data = data.replace(/%%bins%%/gi,bins);		    
					  
					  //send the data back...
					  callback(data);
					});//fcp
				});//media
			});
		});//event
	});//users
}

function mappaths(data,path,init)
{
	//console.log(data);
	_.each(data,function(e,k){
		//console.log(k);
		// console.log(e);		
		if (e.local)
		{
			e.path = path;
			init.push(e);
		}
		else
		{
			mappaths(e,path + '/' + k,init);
		}
	});
}

function genbins(data)
{
	var output = "";
	_.each(data,function(e,k){
		if (e.local)
		{
			output+='<clip id="'+e.masterclipid+'" explodedTracks="true" frameBlend="FALSE"><uuid>'+e.uuid+'</uuid><masterclipid>'+e.masterclipid+'</masterclipid><ismasterclip>TRUE</ismasterclip><duration>'+(e.duration*framerate)+'</duration><rate><timebase>29.97</timebase><ntsc>TRUE</ntsc></rate><in>0</in><out>'+(e.duration*framerate)+'</out><name>'+e.local+'</name><media><video><track><clipitem id="'+e.clipitemid+'" frameBlend="FALSE"><masterclipid>'+e.masterclipid+'</masterclipid><name>'+e.local+'</name><rate><timebase>29.97</timebase><ntsc>FALSE</ntsc></rate><alphatype>straight</alphatype><pixelaspectratio>square</pixelaspectratio><anamorphic>FALSE</anamorphic><file id="'+e.fileid+'"><name>'+e.local+'</name><pathurl>file://localhost/'+e.path + '/' + e.local+'</pathurl><rate><timebase>29.97</timebase><ntsc>FALSE</ntsc></rate><timecode><rate><timebase>29.97</timebase><ntsc>FALSE</ntsc></rate><string>00;00;00;00</string><frame>0</frame><displayformat>DF</displayformat></timecode><media><video><samplecharacteristics><rate><timebase>29.97</timebase><ntsc>FALSE</ntsc></rate><width>1920</width><height>1080</height><anamorphic>FALSE</anamorphic><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></video><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount><layout>mono</layout><audiochannel><sourcechannel>1</sourcechannel><channellabel>discrete</channellabel></audiochannel></audio></media></file></clipitem></track></video></media></clip>';
			
		}
		else
		{
			output+="<bin><name>"+k+"</name><labels><label2>Mango</label2></labels><children>" + genbins(e) + "</children></bin>";
		}
	});

	return output;
}

module.exports = {

	codename:'audio_sync',
	name:'Auto Audio Synchronisation',
	description:'Auto syncronises content given a master audio track, e.g. for live recordings.',

	init:function()
	{
		//do nothing for now...

	},

	getedl:function(event,req,res)
	{
		//console.log("done");
		genedl(req,event,function(data){
			res.setHeader('Content-disposition', 'attachment; filename='+event+"_template_" + req.param('template') + '.xml');
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
		Event.findOne(event).exec(function(err,u)
    {

      if (!u.audiosynccancel==true && u.audiosync && (u.audiosync.status!='cancelled') && (u.audiosync.status!='done') && !(u.audiosynccancel==true && u.audiosync.status=='queue'))
      {
        return res.json(u.audiosync);
      }
      else
      {
        return res.json({msg:'Not currently audio syncing.',stopped:true});
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
			req.file('file').upload({
				maxBytes:99999999999,
				adapter: require('skipper-s3'),
  			key: sails.config.AWS_ACCESS_KEY_ID,
  			secret: sails.config.AWS_SECRET_ACCESS_KEY,
  			bucket: sails.config.S3_BUCKET,
				//dirname: 'audiosync'
			},function(err,files){
				//console.log(err);
				//console.log(files[0]);
				if (err)
				{
					req.session.flash = {msg:err};
					return res.redirect('/post');
				}

				if (files.length != 1)
				{
					req.session.flash = {msg:'No file given'};
					return res.redirect('/post');
				}

				var filename = files[0].filename;

				var tmp = files[0].fd;

				//fs.copySync(tmp,tmpdir + filename);

				Event.findOne(event).exec(function(err,m){

					if (!err && m!=undefined)
					{
						//console.log(m);
						// m.audiosync.audio = tmpdir + filename;
						m.audiosync = {msg:'In Queue',status:'queue',percentage:0};
						m.audiosynccancel = false;
						m.save(function(err){
							//process file...
							var config = {};
							config.event = event;
							config.audiofile = tmp;
							config.user_id = req.session.passport.user.id;

							Editor.audiosync(config);
							console.log('done upload');
							req.session.flash = "Audio File Uploaded!";
							return res.redirect('/post');
						});
					}
					else
					{
						console.log("err: " + err);
						return res.redirect('/post');
					}
				});
			});

		}
		else
		{
			return res.redirect('/post');
		}
	},

	reset:function(event,req,res)
	{
		Event.findOne(event).exec(function(err,m){
			if (!err && m!=undefined)
			{
				m.audiosynccancel = true;
				req.session.flash = {msg:'Audio Processing Cancelled'};
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
