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