/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 var fs = require('fs');
exports.listEvents = function() {

    //list directory with event types:
    var content = new Array();
    var files = fs.readdirSync('assets/data/');
    //console.log(files);
    _.each(files, function (e,i,l){
    	//console.log(e);
    	if (!fs.lstatSync('assets/data/'+e).isDirectory())
    	{
    		var c = JSON.parse(fs.readFileSync('assets/data/'+e));
    		content.push(c);
    	}
    });

    return content;
};