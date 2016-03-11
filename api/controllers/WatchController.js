/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * LogController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var moment = require('moment');
var cloudfront = require('aws-cloudfront-sign');

var editprogresses = {};
function checkStatus(edit)
{		
	setTimeout(function(){
		var ed = edit;
        process.nextTick(function(){
            //db query			
            Edits.findOne(ed).exec(function(err, edd){
                
                if (typeof(editprogresses[edit])=='undefined')
                    editprogresses[edit] = -1;
                    
                if (err || typeof(edd)=='undefined' || (edd.progress && edd.progress > 98) || edd.failed)
                {
                    //cancel the timer
                    if (edd)
                        Edits.publishUpdate(edd.id,{edit:edd});
                    //console.log('timer cancelled');
                }
                else
                {
                    if (typeof(edd.progress) != 'undefined' && editprogresses[edit] != edd.progress)
                    {
                        //console.log(editprogresses[edit] + ' and ' + edd.progress);
                        editprogresses[edit] = edd.progress;
                        //console.log('updated with '+edd.progress);
                        //pump update to socket
                        Edits.publishUpdate(edd.id,{edit:edd});
                    }
                    checkStatus(edd.id);
                }
            });
		});
	},5000);
}

module.exports = {

	index:function(req,res)
	{
		//list my shoots, and also any edits that I have made:
		return res.view();
	},
    
    edits:function(req,res)
    {
        //list all edits for a shoot:
        Event.findOne(req.params.id,function(err,ev){
            if (ev)
		      return res.view({theevent:ev});
            else
              return res.redirect('/dashboard');
        })
    },

	mymedia:function(req,res)
	{
		Edits.find({user_id:req.session.passport.user.id}).exec(function(err,edits){
			Media.find({created_by:req.session.passport.user.id}).exec(function(err,media){
				var grouped = _.groupBy(media,'event_id');
				//group by shoot
				var shoots = _.keys(grouped);
			//	console.log(shoots);
				Event.find(shoots).exec(function(err,events){

					var keep = events;

					Media.find({event_id:shoots}).exec(function(err,allmedia){

						var allmedia_grouped = _.groupBy(allmedia,'event_id');

						var regrouped = [];
						var plucked = _.pluck(keep,'id');
					  _.each(grouped,function(val,key){
							if (_.contains(plucked,key))
							{
								var ev = _.find(keep,{'id':key});
								//combine with more media if public view allowed:

								if (ev.publicview)
									ev.media = _.merge(val,allmedia_grouped[key]);
								else
									ev.media = val;

								ev.media = 	_.filter(ev.media,function(m){
										return m.thumb;
								});

								ev.media = _.shuffle(ev.media);

								ev.media = _.take(ev.media, 20);

								_.each(ev.media,function(m){
                                    if (m.thumb)
                                    {
                                        m.thumb = sails.config.master_url+'/media/thumbnail/'+m.id;
                                    }
								});
								regrouped.push(ev);
							}
						});
						//check the permissions on these shoots
						Event.find({}).exec(function(err,allevents){
							
							var events = _.filter(allevents,function(e){
								return _.contains(e.ownedby,req.session.passport.user.id);
							});
							return res.json({edits:edits,shoots:regrouped,owned:events});
						});
					});
				});
			});
		});
	},


	/**
	 * @apiDefine Post_Production Post Production
	 * TODO -- FORMAT OF EDIT JSON
	 * 
	 */
	

	/**
	 * @api {post} /api/post/myedits List User Edits
	 * @apiName listedits
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {Array} edits List of edits.
	 */
	myedits:function(req,res){
		Edits.find({user_id:req.session.passport.user.id}).exec(function(err,edits){
			return res.json(edits);
		});
	},
    
    alledits:function(req,res)
    {
        if (!req.params.id)
            return res.json(403,{msg:'No edit found'});
            
        Edits.find({'media.0.event_id':req.params.id}).exec(function(err,edits){
			return res.json(edits);
		});
    },

	queuelength:function(req,res)
	{
		Editor.queuelength(function(val){
			return res.json(val);
		});
	},
	
	/**
	 * @api {get} /api/post/media List Shoot Media
	 * @apiName listmediapost
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 * @apiSuccess {Object} edit The edit that was created.
	 */
	mediaforview:function(req,res)
	{
         req.params.criteria = {
                path: {
                    '!':null
                    }
            };
            
			Media.getnicejson(req,res,req.param('id'),function(media){
					Event.findOne(req.param('id')).exec(function(err,event){

						//filter out clips that are not mine
						if (!event.publicview)
						{
								allmedia = _.reject(media,function(m){
									return m.ownedby != req.session.passport.user.id;
								});
						}
						else
						{
							allmedia = media;
						}
						return res.json({publicview:event.publicview,canshare:event.publicshare,media:allmedia});
				});
			});
	},

	/**
	 * @api {post} /api/post/edit Get Edit
	 * @apiName getedit
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {id} id of edit
	 *
	 * @apiSuccess {Object} edit The edit
	 */
	edit:function(req,res)
	{
		Edits.findOne(req.param('id')).exec(function(err,edit){
			if (!err && edit)
			{
				//re-load edits from db into the result:
				//var ids = _.pluck(edit.media,'id');
				//Media.find(ids).exec(function(err,medias){
				//	_.each(edit.media,function(m){
                //var tmp = _.find(medias,{id:m.id});
                //console.log(tmp);
                //m = _.merge(tmp,m);
                //console.log(m);
				//	});
					return res.json(edit);					
				//});				
			}
			else
			{
				return res.json(403,{msg:'No edit found'});
			}
		});
	},
	
    deleteedit:function(req,res)
	{
		Edits.destroy(req.param('id')).exec(function(err, edit) {
            return res.json({msg:'ok'});
        });
	},
    
	/**
	 * @api {post} /api/post/saveedit Save Edit
	 * @apiName saveedit
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {Object} edit The edit that was created.
	 */
	saveedit:function(req,res)
	{
		Edits.findOrCreate({ id: req.param('id') },{user_id : req.session.passport.user.id}, function(err, edit) {
			var tmpedit = edit;
			tmpedit.media = req.param('media');
			tmpedit.title = req.param('title');
			tmpedit.description = req.param('description');
			var newmedia = [];
			_.each(tmpedit.media,function(m){
				var newm = {
						id:m.id,
						path:m.path,
						inpoint:m.inpoint,
						outpoint:m.outpoint,
						thumb:m.thumb,
						event_id:m.event_id,
						lowres:m.lowres
					};
				newmedia.push(newm);
			});
			tmpedit.media = newmedia;
			tmpedit.save(function(err,done){
				return res.json(done);
			});			
		});
	},

	view:function(req,res)
	{
		//var lookupid = req.session.event;
		//console.log(lookupid);

		//if event is explicitally set in GET
		//if (req.params.id)
		//{
		var lookupid = req.params.id;
		//}

		//req.session.event = lookupid;

		//event config screen -- module selection for the event
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){
			if (event == undefined)
			{
				//console.log("no event found view page "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/dashboard');
			}
			//console.log(event);
			event.calcphases();
			res.view({event:event,viewonly:true});
		});
	},

	/**
	 * @api {get} /api/post/getvideo/:id Direct video link for edit
	 * @apiDescription Get preview video for media
	 * @apiName editvideo
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Id of edit
	 *
	 */
	getvideo:function(req,res)
	{
		var id = req.param('id');
		Edits.findOne(id,function(err, m){	
			var options = {
				keypairId: sails.config.CLOUDFRONT_KEY, 
				privateKeyPath: sails.config.CLOUDFRONT_KEYFILE,
				expireTime: moment().add(1, 'day')
			}
			var signedUrl = cloudfront.getSignedUrl(sails.config.S3_TRANSCODE_URL + m.shortlink + ".mp4", options);
			//console.log(signedUrl);
			return res.redirect(signedUrl);
		});
	},

	/**
	 * @api {post} /api/post/newedit Create Edit
	 * @apiName newedit
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {Array} media List of media objects (or id's?)
	 *
	 * @apiSuccess {Object} edit The edit that was created.
	 */
	newedit:function(req,res)
	{
		//process edit:

		//check that this footage can be used:
		//trigger process to generate video:
		var media = req.param('media');
		var title = req.param('title');
		var description = req.param('description');

		//make media smaller:
		var newmedia = [];
		_.each(media,function(m){
			var newm = {
					id:m.id,
					inpoint:m.inpoint,
					outpoint:m.outpoint,
					path:m.path,
					thumb:m.thumb,
					event_id:m.event_id,
					lowres:m.lowres
				};
			newmedia.push(newm);
		});
		
		//console.log(newmedia);

		if (newmedia && newmedia.length > 0)
		{
			Edits.genlink(function(newlink)
			{
                //console.log(newlink);
				//return new edit and shortcode
				Edits.findOrCreate({id: req.param('id')},{user_id:req.session.passport.user.id,shortlink:newlink,media:newmedia,code:newlink,title:title,description:description}).exec(function(err,edit)
				{
                    //console.log(err);
					//fire off to editor:
					//send back to user:
					edit.code = newlink;
                    edit.progress = 0;
					edit.shortlink = newlink;
					edit.save(function(err,resp){
                        //console.log(err);
                        //console.log("processing edit");
						Editor.edit(edit);
						edit.shortlink = sails.config.master_url + '/v/' + edit.code;
						res.json({edit:edit});
					});
				});
			});
		}
		else
		{
			res.json({msg:'No clips provided'},500);
		}
	},
	
	restartedit:function(req,res)
	{
		Edits.findOne(req.params.id).exec(function(err,edit){
			if (edit)
			{	
				console.log("restarting edit");
				//console.log(edit);
				//console.log(edit.media);
				//console.log(edit.media.length > 1);
                
                //TODO CHANGE THIS BACK
				if (edit.media && edit.media.length > 1)
				{
					edit.failed = false;
					edit.path = null;
					edit.progress = null;
					edit.save(function(err,edit)
					{
						//fire off to editor:
						//send back to user:
						console.log("edit submitted");
						Editor.edit(edit);
						edit.shortlink = sails.config.master_url + '/v/' + edit.code;
						res.json({edit:edit});
					});
				}
				else
				{
					res.json({msg:'No clips provided'},500);
				}
			}
			else
			{
				res.json({msg:'Invalid Edit Provided'},403);
			}
		});
	},
	
	/**
	 * @api {get} /api/post/editprogress Get Edit Progress
	 * @apiName editprogress
	 * @apiGroup Post_Production
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {string} Edit id
	 *
	 * @apiSuccess {Object} progress
	 */
	editprogress:function(req,res)
	{
		Edits.findOne(req.params.id).exec(function(err,edit){
			
			if (edit)
			{
				//console.log({failed:edit.failed, progress:edit.progress, path:edit.path});
				res.json({failed:edit.failed, progress:edit.progress, path:edit.path});
			}
			else
			{
				res.json({msg:'Invalid Edit Provided'},403);
			}
		});	
	},

	/**
	 *	Register for edit Updates 
	 */
	editupdates:function(req,res)
	{
		//for each one, set a time and check-- and then update...
		var ids = req.param('edits');
		Edits.subscribe(req,ids);
		//set a time for them:
		_.each(ids,function(e){
			checkStatus(e);
		});
		return res.json({msg:'subscribed'});
	},

    
	/**
	 *	Register for edit Updates 
	 */
	canceleditupdates:function(req,res)
	{
		//for each one, set a time and check-- and then update...
		var ids = req.param('edits');
		Edits.unsubscribe(req,ids);
		return res.json({msg:'unsubscribed'});
	},

	shortlink:function(req,res)
	{
		//console.log(req.param('shortlink'));
		if (!req.param('shortlink'))
		{
			req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
            console.log("r1");
			return res.redirect('/dashboard');
		}

		Edits.findOne({shortlink:req.param('shortlink')}).exec(function(err,edit){
			if (edit)
			{
				Event.findOne(edit.media[0].event_id).exec(function(err,ev){
                    if (!ev)
                    {
                        req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
                        console.log("r2");
				        return res.redirect('/dashboard');
                    }
                    User.findOne(edit.user_id).exec(function(err,user){
                        if (ev.publicshare || req.session.passport.user || _.contains(ev.ownedby,req.session.user.passport.user.id) || (req.session.passport && req.session.passport.user && _.contains(sails.config.admin_email,req.session.passport.user.profile.emails[0].value)))
                        {
                            edit.user = user;
                            res.view({edit:edit,_layoutFile:null});
                        }
                        else {
                            //cant share:
                            res.view({cantshare:true,_layoutFile:null});
                        }
                    });
				});
				//return res.redirect(301, sails.config.S3_TRANSCODE_URL + edit.path);
			}
			else
			{
				req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
                console.log("r3");
				return res.redirect('/dashboard');
			}
		});
	}
};
