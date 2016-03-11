/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var fs = require('fs');
var yamlFront = require('yaml-front-matter');
var markdown = require('marked');
var path = require('path');
var moment = require("moment");

exports.all = function()
  {
	var files = fs.readdirSync(path.normalize(__dirname+'/../../views/blog/'));
		var output = [];
		//get yaml from the files
		_.each(files,function(f){
			var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/blog/') + f);
			var results = yamlFront.loadFront(contents);
			
			if (results.title)
			{
				var content = results.__content;
				var date = moment(results.created);
				delete results.__content;
				delete results.created;
				output.push({meta:results,markdown:markdown(content),created:date});
			}
		});
		//order them:
		output = _.sortBy(output,'created').reverse();
		return output;
  }
  
  exports.latest = function(){
	  var files = fs.readdirSync(path.normalize(__dirname+'/../../views/blog/'));
		var output = [];
		//get yaml from the files
		_.each(files,function(f){
			var contents = fs.readFileSync(path.normalize(__dirname+'/../../views/blog/') + f);
			var results = yamlFront.loadFront(contents);
			
			if (results.title)
			{
				var content = results.__content;
				var date = moment(results.created);
				delete results.__content;
				delete results.created;
				output.push({meta:results,markdown:markdown(content),created:date});
			}
		});
		//order them:
		output = _.first(_.sortBy(output,'created').reverse());
		return output;
  }