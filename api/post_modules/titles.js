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

function genedl(event,callback)
{
	//get the processed edl for an event
	User.find({}).exec(function(err,users)
    {
		//get media
		//order by captured at (in case no offset)
		Media.find({event_id:event},function(err, medias){

			//find unique users:
			var uniqusers = _.uniq(_.pluck(medias,'created_by'));
			var allusers = _.map(uniqusers,function(u){
				return _.find(users,{id:u});
			});

			var allusers = _.filter(allusers,function(u)
			{
				if (u.permissions)
				{
					return !u.permissions[event];
				}
				else
					{return true;}
			});

			allusers = _.sortBy(allusers,function(u){
				return u.profile.name.familyName || u.profile.displayName;
			});

			var data = _.map(allusers,function(u){
				return u.profile.displayName;
			});

		    callback(data.join("\r\n"));
		});//media
	});//users
}

module.exports = {

	codename:'titles',
	name:'Titles Generator',
	description:'Generates a list of names which can be used for attributation and titling.',


	init:function()
	{
		//do nothing for now...
	},

	getedl:function(event,req,res)
	{
		genedl(event,function(data){
			// console.log(data);
			res.setHeader('Content-disposition', 'attachment; filename=Titles.txt');
			res.send(data);
		});
	},

	settings:function(event,res)
	{
		//upload box for titles...
	  	res.view('post/titles.ejs',{ event: event,name:'Credit Generator',description:'Download auto-generated title files with the correct contributors.', _layoutFile:false });
	}
};
