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
			if (u.apiaccess == 'live')
			{
				return res.json({key:u.apikey});
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
			if (u.apiaccess == 'live')
			{
				u.apikey = uuid.v4();
			}

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
			user.apiaccess = 'locked';
			user.save(function(err,done){
				return res.redirect('/event/admin');
			});
		});
	},

	unrevokeapi:function(req,res)
	{
		User.findOne(req.params.id).exec(function(err,user)
		{
			user.apiaccess = 'live';
			user.save(function(err,done){
				return res.redirect('/event/admin');
			});
		});
	},

	activate:function(req,res)
	{
		User.findOne(req.session.passport.user.id).exec(function(err,u)
		{
			if (!u.apiaccess)
			{
				req.session.passport.user.apiaccess = 'live';
				u.apikey = uuid.v4();
				u.apiaccess = 'live';
			}

			u.save(function(done)
			{
				return res.json({msg:'ok'});
			});
		});
	}
};
