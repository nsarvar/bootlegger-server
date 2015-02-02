/**
 * Event
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

var JSZip = require("jszip");
var path = require('path');
var fs = require('fs');
var dir = __dirname + '../../../assets/data/';	
var moment = require('moment');

module.exports = {

 attributes: {
	name: {
	    type: 'string',
	    required:true,
	    maxLength: 40,
	    minLength: 5
	  },
	starts: {
	    required:true,
	  },
    ends: {
	    required:true,
	  },
	  eventtype: {
	    type: 'json'
	  },

	  calcphases:function()
	  {
	  	//console.log(this.starts);
	  	//console.log(moment(this.starts));

	  	if (this.commissiondone)
	  		this.iscommission = true;

	  	if (this.preparedone)
	  		this.isprepare = true;

	  	var starts = moment(this.starts,"DD-MM-YYYY");
	  	if (starts < moment())
	  	{
	  		this.iscommission = true;
	  		this.isprepare = true;
	  		this.isshoot = true;
	  	}
	
		//console.log(moment(this.ends,"DD-MM-YYYY"));
	  	var ends = moment(this.ends,"DD-MM-YYYY");
	  	if (ends < moment())
	  	{
	  		this.iscommission = true;
	  		this.isprepare = true;
	  		this.isshoot = true;
	  		this.ispost = true;
	  	}


	  },
	  
	  genzip:function(cb)
	  {
			dir = path.normalize(dir);
			var images = _.pluck(this.eventtype.shot_types,'image');
			var icons = _.pluck(this.eventtype.shot_types,'icon');

			var im_files = _.map(images,function(m)
			{
				return {source:dir+'images/'+m,target:m};
			});

			var ic_files = _.map(icons,function(m){
				return {source:dir+'icons/'+m,target:'icons/'+m}
			});

			var all = _.union(im_files, ic_files);

			// if (this.eventtype.roleimg)
			// {
			// 	//download file:
			// 	all.push({source:dir+'roles/'+this.eventtype.roleimg,target:this.eventtype.roleimg});
			// }

			var zip = new JSZip();
			_.each(all,function(f)
			{
				if (fs.existsSync(f.source))
				{
					try
					{
						zip.file(f.target, fs.readFileSync(f.source));
					}
					catch (e)
					{
						console.log(e);
					}
				}
				else
				{
					console.log('missing file: '+f.source);
				}
			});

			var content = zip.generate({type:"nodebuffer",compression:'DEFLATE'});
			require("fs").writeFile(dir+'/'+this.id+'.zip', content, function(err){
				cb();
			});
	  }

    
  },

  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Event',newlyInsertedRecord.id);
  	cb();
  },

  getnewcode:function(cb)
  {
  	//return a code unique across all events
  	var done = false;
  	var newcode = '';
  	//find list of codes...
  	Event.find().exec(function(err, events) {
		// Do stuff here
		var allcodes = new Array();

		//get all codes:
		_.each(events, function(ev)
		{
			_.each(ev.codes,function(c)
			{
				allcodes.push(c.code);
			});		  	
		});

		while (!done)
	  	{
			newcode = Math.floor((Math.random()*99999)).toString();
			//find list of codes
			if (!_.contains(allcodes,newcode))
				done=true;
		}
		//console.log('newcode: '+newcode);
		cb(newcode);
	});
  },


};
