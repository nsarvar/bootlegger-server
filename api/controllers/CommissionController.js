/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var path = require('path');
var lwip = require('lwip');

module.exports = {

	index:function(req,res)
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
				console.log("no event found view page "+lookupid);
				//req.session.flash = {err:"Event not found"};
				return res.redirect('/dashboard');
			}
			//console.log(event);
			event.calcphases();
			res.view({event:event,pagetitle:'Adjust'});
		});
	},

	addshot:function(req,res)
	{
		// var knox = require('knox');
		// //upload map file for an event role:
		// var knox_params = {
		//     key: sails.config.AWS_ACCESS_KEY_ID,
		//     secret: sails.config.AWS_SECRET_ACCESS_KEY,
		//     bucket: sails.config.S3_BUCKET
		//   }

		if (req.method == "POST" && req.file('image') != undefined)
		{
			req.file('image').upload(function(err, tt)
			{
				//console.log(err);
				if (tt.length == 0)
				{
					req.session.flash = 'No image provided';
					return res.redirect('/event/admin');
				}
				var uuid = require('node-uuid');
	 			var fakeid = uuid.v1();
				var filename = fakeid + tt[0].filename;
				var tmp = tt[0].fd;

				var dest_file = path.resolve('./assets/data/images/'+ path.basename(tmp)) ;
		    var dest_file_thumb = path.resolve('./assets/data/icons/'+ path.basename(tmp) + '_small.png');

				lwip.open(tmp, function(err, image) {
				    if (err) return res.redirect('/event/admin');
				    image.cover(853,480,function(err, image){
				    	//filename to write to:
				        image.writeFile(dest_file, function(err){

				        	lwip.open(tmp, function(err, image) {
							    if (err) return res.redirect('/event/admin');
							    image.cover(200,113,function(err, image){
							    	//filename to write to:
							        image.writeFile(dest_file_thumb, function(err){
							        	//move file to the assets dir on every server??
							      		console.log(err);

							            if (err) return res.redirect('/event/admin');
							            var newshot = {};
							            newshot.name = req.param('name');
							            newshot.description = req.param('description')
							            newshot.image = path.basename(dest_file);
							            newshot.icon = path.basename(dest_file_thumb);
							            newshot.wanted = 7;
							            newshot.max_length = 20;
							            Shot.create(newshot).exec(function(err, done){
											req.session.flash = "New Shot Added";
											res.redirect('/event/admin');
										});
									}); //write file
							    });//cover
							});//lwip open
				    	}); //write file
				    });//cover
				});//lwip open
			});//upload
		}
		else
		{
			res.redirect('/event/admin');
		}
	},

	example:function(req,res)
	{
		EventTemplate.findOne(req.params.id).exec(function(err,data){
			if (data){
				var shuff = _.shuffle(data.shot_types);
				res.json(_.take(shuff,14));
			}
				else {
						res.json([]);
				}
		});
	},

	savetoreuse:function(req,res)
	{
		var input = req.param('eventtype');
		input.user_id = req.session.passport.user.id;
		delete input.id;
		delete input.createdAt;
		delete input.updatedAt;
		EventTemplate.create(input).exec(function(){
			res.json({msg:'ok'});
		});
	},

	savetocommunity:function(req,res)
	{
		var input = req.param('eventtype');
		delete input.id;
		input.user_id = req.session.passport.user.id;
		input.community = true;
		delete input.createdAt;
		delete input.updatedAt;
		//input.user_id = req.session.passport.user.id;
		EventTemplate.create(input).exec(function(){
			res.json({msg:'ok'});
		});
	},

	savetooriginal:function(req,res)
	{
		var input = req.param('eventtype');
		delete input.id;
		delete input.createdAt;
		delete input.updatedAt;
		input.original = true;
		//input.user_id = req.session.passport.user.id;
		EventTemplate.create(input).exec(function(){
			res.json({msg:'ok'});
		});
	},

	/**
	 * @api {post} /api/commission/update/:id Update Template
	 * @apiName updatetemplate
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Shoot ID
	 * @apiParam {Object} eventtype Shoot template
	 *
	 * @apiSuccess {String} msg Should return 'ok'
	 */
	update:function(req,res)
	{
		//console.log(req.param(.)eventtype);
		Event.findOne(req.params.id).exec(function(err,e)
		{
			if (e==null || !req.param('eventtype'))
				return res.json({msg:'no shoot or eventtype specified'},500);

			//also merge the changes with the main template in use (the properties at the top level)
			var new_eventtype = req.param('eventtype');
			var new_shoot_modules = new_eventtype.shoot_modules;
			var new_post_modules = new_eventtype.post_modules;
			var new_phases = new_eventtype.phases;
			var new_coverage = new_eventtype.coverage_classes;


			//fix for coverage class array -- which NEEDS to be an associative array:
			var i = 0;
				var tmp = {};
				_.each(new_coverage,function(e,f)
				{
					tmp[i.toString()] = e;
					i++;
				});
			new_coverage = tmp;

			new_eventtype.coverage_classes = new_coverage;

			Event.update({id:req.params.id},{eventtype:new_eventtype,shoot_modules:new_shoot_modules,post_modules:new_post_modules,phases:new_phases, coverage_classes:new_coverage}).exec(function(err,done)
			{
				sails.eventmanager.addevent(req.params.id);
				sails.eventmanager.updateevent(req.params.id);
				res.json({msg:'ok'});
			});
		});
	},

	info:function(req,res)
	{
		var lookupid = req.session.event;
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
			Media.find({event_id:lookupid}).exec(function(err,media)
			{
				var grouped = _.groupBy(media,function(m){
					return m.meta.static_meta.shot;
				});

				_.each(event.eventtype.shot_types,function(t){
					t.footage = grouped[t.id];
				});
				res.json(event);
			});
		});
	},


	/**
	 * @api {get} /api/commission/gettemplate/:id Get Template Info
	 * @apiDescription Returns the commissioning template for the given shoot.
	 * @apiName gettemplate
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Shoot ID
	 *
	 * @apiSuccess {String} msg Should return template
	 */
	templateinfo:function(req,res)
	{
		//var lookupid = req.session.event || req.session.passport.user.currentevent;
		//console.log(lookupid);

		//if event is explicitally set in GET
		if (req.params.id)
		{
			lookupid = req.params.id;
		}
		else
		{
			return res.json({msg:'no shoot specified'},500);
		}

		//req.session.event = lookupid;
		//console.log(lookupid);
		Event.findOne(lookupid).exec(function(err,event){
			//console.log(err);
			if (err || !event)
			{
				res.json({msg:'Shoot not found'},500);
			}
			else {
				Media.find({event_id:lookupid}).exec(function(err,media)
				{
					var grouped = _.groupBy(media,function(m){
						return m.meta.static_meta.shot;
					});

					_.each(event.eventtype.shot_types,function(t){
						t.footage = _.size(grouped[t.id]);
					});
					res.json(event);
				});
			}
		});
	},

	new:function(req,res)
	{

		if (!req.session.passport.user.currentevent)
		{
			res.locals.firstlogin = true;
			delete req.session.firstlogin;
		}
		else
		{
			res.locals.firstlogin = false;
		}

		var tys = EventTemplate.find({or:[{user_id:req.session.passport.user.id}, {user_id:null}, {community:true}]}).sort({'user_id':-1,'name':1}).exec(function(err,data){
			res.view({types:data});
		});
	},
	
	
	/**
	 * @api {get} /api/commission/seedtemplates Get List of Seed Templates
	 * @apiName seedtemplates
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {String} msg Returns list of templates (own, public and community) to use as starting points for template design.
	 */
	seedtemplates:function(req,res){
		var tys = EventTemplate.find({or:[{user_id:req.session.passport.user.id}, {user_id:null}, {community:true}]}).sort({'user_id':-1,'name':1}).exec(function(err,data){
			
			var results = _.map(data,function(e){
				return {id:e.id,name:e.name,description:e.description};
			});
			
			res.json(data);
		});
	},
	
	/**
	 * @api {get} /api/commission/getseedtemplate/:id Get Specific Seed Template
	 * @apiName getseedtemplate
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {String} msg Returns list of templates (own, public and community) to use as starting points for template design.
	 */
	getseedtemplate:function(req,res){
		var tys = EventTemplate.findOne(req.params.id).exec(function(err,data){
			if (data)
				res.json(data);
			else
				res.json({msg:'Template not found',status:403},403);
		});
	},

	/**
	 * @api {get} /api/commission/shots Get Shot Library
	 * @apiName getshots
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 *
	 * @apiSuccess {String} msg Should return library of shots
	 */
	allshots:function(req,res)
	{
		Shot.find({}).exec(function(err,shots){
			
			//remove duplicates:
			var uni = _.unique(shots,function(u){
				return u.name + u.icon;
			})
			res.json(uni);
		});
	},


	
	allmodules:function(req,res)
	{
		var result = {};
		result.shoot_modules = _.map(sails.eventmanager.event_modules,function(m){
			return {name: m.name, codename:m.codename,description:m.description};
		});
		result.post_modules = _.map(sails.eventmanager.post_modules,function(m){
			return {name: m.name, codename:m.codename,description:m.description};
		});
		return res.json(result);
	},


	/**
	 * @api {post} /api/commission/updateshots/:id Update Shot Requests
	 * @apiDescription Update shoot shot requirements and notify all currently connected contributors of the changes.
	 * @apiName updatetemplate_live
	 * @apiGroup Commission
	 * @apiVersion 0.0.2
	 *
	 * @apiParam {String} id Shoot ID
	 * @apiParam {Object} shots New Shot List
	 *
	 * @apiSuccess {String} msg 'Shoot Updated'
	 */
	updateshots:function(req,res)
	{
		//update shots and notify people who are connected:
		if (req.param('id'))
		{
			Event.findOne(req.param('id')).exec(function(err,ev)
			{
				if (ev!=null)
				{
					var newshots = req.param('shots');
					//console.log(newshots);

					_.each(newshots,function(d){
						delete d.isnew;
						delete d.footage;
					});

					ev.eventtype.shot_types = newshots;
					ev.save(function(err,done)
					{
						sails.eventmanager.updateevent(ev.id);
						res.json({msg:'Shoot Updated'});
					});
				}
				else
				{
					return res.json({msg:'no shoot specified'},500);
				}
			});
		}
		else
		{
			res.json({msg:'no event specified'},500);
		}
	}
};
