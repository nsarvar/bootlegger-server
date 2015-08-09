/**
 * LogController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

	index:function(req,res)
	{
		//list my shoots, and also any edits that I have made:
		return res.view();
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

					// var keep = _.filter(events,function(event){
					// 	//if your the admin
					// 	if (_.contains(event.ownedby,req.session.passport.user.id))
					// 		return true;
					// 	//if participants allowed to share
					//   if (event.publicview)
					// 		return true;
					//
					// 	return false;
					// });
					//find shoots

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
											m.thumb = escape(m.thumb);
										}
								});
								regrouped.push(ev);
							}
						});
						//check the permissions on these shoots
						return res.json({edits:edits,shoots:regrouped});

					});
				});
			});
		});
	},

	mediaforview:function(req,res)
	{
			Media.getnicejson(req,res,req.param('id'),function(media){
					//filter according to policy:
					// console.log(media);

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

						//console.log(allmedia.length);
						return res.json({publicview:event.publicview,canshare:event.publicshare,media:allmedia});
				});
			});
	},

	view:function(req,res)
	{
		var lookupid = req.session.event || req.session.passport.user.currentevent;
		//console.log(lookupid);

		//if event is explicitally set in GET
		if (req.params.id)
		{
			lookupid = req.params.id;
		}

		req.session.event = lookupid;

		//event config screen -- module selection for the event
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){
			if (event == undefined)
			{
				//console.log("no event found view page "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/commission/new');
			}
			//console.log(event);
			event.calcphases();
			res.view({event:event});
		});
	},

	/**
	 * @api {post} /api/post/newedit Create Edit
	 * @apiName newedit
	 * @apiGroup Post Production
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

		if (media && media.length > 0)
		{
			Edits.genlink(function(newlink)
			{
				//return new edit and shortcode
				Edits.create({user_id:req.session.passport.user.id,shortlink:newlink,media:media,code:newlink,title:title,description:description}).exec(function(err,edit)
				{
					//fire off to editor:
					//send back to user:
					Editor.edit(edit);
					edit.shortlink = sails.config.master_url + '/v/' + edit.code;
					res.json({edit:edit});
				});
			});
		}
		else
		{
			res.json({msg:'No clips provided'},500);
		}
	},

	shortlink:function(req,res)
	{
		//console.log(req.param('shortlink'));
		if (!req.param('shortlink'))
		{
			req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
			return res.redirect('/');
		}

		Edits.findOne({shortlink:req.param('shortlink')}).exec(function(err,edit){
			if (edit)
			{
				Event.findOne(edit.media[0].event_id).exec(function(err,ev){

					if (ev.publicshare || req.session.passport.user)
					{
						res.view({edit:edit,_layoutFile:null});
					}
					else {
							//cant share:
							res.view({cantshare:true,_layoutFile:null});
					}
				});
				//return res.redirect(301, sails.config.S3_TRANSCODE_URL + edit.path);
			}
			else
			{
				req.session.flash = {msg:'Sorry, that\'s not a link we recognise.'};
				return res.redirect('/');
			}
		});
	}
};
