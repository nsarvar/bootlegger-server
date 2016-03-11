/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var fs = require('fs');
var path = require('path');
var markdown = require('marked');

module.exports = {
	platform:function(req,res)
	{
		//platform landing page...
		return res.view({blog:Blog.latest(),_layoutFile: '../platform.ejs'});	
	},
	
	blog:function(req,res)
	{

		//render them:
		return res.view({blog:Blog.all(),_layoutFile: '../platform.ejs'});
	},
	
	terms:function(req,res)
	{
		//var markdown = require('marked');
		var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/static/terms.md'),"utf8");
		//console.log(contents);
		var themarkdown = markdown(contents);
		return res.view('static/markdown',{markdown:themarkdown});
	},

	privacy:function(req,res)
	{
		//var markdown = require('marked');
		var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/static/privacy.md'),"utf8");
		//console.log(contents);
		var themarkdown = markdown(contents);
		return res.view('static/markdown',{markdown:themarkdown});
	},
	
	howtobootleg:function(req,res)
	{
		switch (req.param('platform'))
		{
			case 'app':
				return res.view('help/app',{showhelp:true});
			case 'web':
				return res.view('help/web',{showhelp:true});
			case 'commission':
				return res.view('help/commission',{showhelp:true});
			default:
				return res.view('help/index',{showhelp:true});
		}

	}
}