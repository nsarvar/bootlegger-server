/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var path = require('path');
var uuid = require('node-uuid');

module.exports = {

	index:function(req,res)
	{
		return res.json({msg:'Welcome to the API. Visit '+sails.config.master_url+'/api/docs for documentation.'});
	},

	getkey:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			if (u.apikey)
			{
				return res.json(u.apikey);
			}
			else
			{
				return res.json({msg:'no valid key'});
			}

		});
	},
	
	signup:function(req,res)
	{
		return res.view();
	},
	
	newkey:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			var apiobj = u.apikey;
			
			if (apiobj.apiaccess == 'live')
			{
				apiobj.apikey = uuid.v4();
			}

			apiobj.apitype = 'redirect';
			
			u.apikey = apiobj;

			u.save(function(done)
			{
				return res.json({msg:'ok'});
			});
		});
	},
	
	updateapi:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			u.apikey.apitype = req.param('apitype');
			u.apikey.callbackfunction = req.param('callbackfunction');
			u.apikey.redirecturl = req.param('redirecturl');

			u.save(function(done)
			{
				return res.json({msg:'ok'});
			});
		});
	},

	revokeapi:function(req,res)
	{
		User.findOne(req.params.id).exec(function(err,user)
		{
			user.apikey.apiaccess = 'locked';
			user.save(function(err,done){
				return res.redirect('/event/admin');
			});
		});
	},

	unrevokeapi:function(req,res)
	{
		User.findOne(req.params.id).exec(function(err,user)
		{
			user.apikey.apiaccess = 'live';
			user.save(function(err,done){
				return res.redirect('/event/admin');
			});
		});
	},

	activate:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			//var apiobj = u.apikey || {apiaccess : 'live'};
			//console.log(u);
			if (typeof(u.apikey)=='undefined')
			{
				u.apikey = {};
				req.session.passport.user.apikey = {apiaccess: 'live'};
				u.apikey.apikey = uuid.v4();
				u.apikey.apiaccess = 'live';
				u.apikey.apitype = 'redirect';
			}

			u.save(function(done)
			{
				return res.json({msg:'ok'});
			});
		});
	}
};
