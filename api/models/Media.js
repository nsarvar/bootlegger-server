/**
 * Media
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var path = require('path');
module.exports = {

  attributes: {
    nicify:function(cb)
    {
    	var thismedia = this;
    	//console.log(this);
    	Event.findOne(thismedia.event_id).exec(function(err,ev)
    	{	
    		User.findOne(thismedia.created_by).exec(function(err,user)
    		{
				//console.log(thismedia.meta);

    			thismedia.meta.static_meta.role_ex = ev.eventtype.roles[thismedia.meta.static_meta.role];
		         thismedia.user = user;
		          //console.log(m.meta.static_meta.shot);
		          //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
		         thismedia.meta.static_meta.shot_ex = ev.eventtype.shot_types[thismedia.meta.static_meta.shot];
		          if (!thismedia.meta.static_meta.shot_ex)
		            thismedia.meta.static_meta.shot_ex = {name:'Unknown'};

		          //console.log(ev.coverage_classes);

		          thismedia.meta.static_meta.coverage_class_ex = ev.coverage_classes[thismedia.meta.static_meta.coverage_class];
		          if (thismedia.meta.static_meta.coverage_class_ex==undefined)
		          {
		            thismedia.meta.static_meta.coverage_class_ex = {name:"Unknown"};
		          }

		          if (thismedia.meta.static_meta.meta_phase && ev.phases)
		          {
			          thismedia.meta.static_meta.meta_phase = ev.phases[thismedia.meta.static_meta.meta_phase];
			          if (thismedia.meta.static_meta.meta_phase==undefined)
			          {
			            delete thismedia.meta.static_meta.meta_phase;
			          }
		  		  }

		  		var timestamp = thismedia.meta.static_meta.captured_at.split(' ');
		  		var uu = "unknown";
		  		if (thismedia.user)
		  			uu = thismedia.user.profile.displayName;

      			thismedia.meta.static_meta.nicepath = timestamp[1].replace(':','-').replace(':','-') + '_' + thismedia.meta.static_meta.shot_ex.name + '_' + thismedia.meta.static_meta.coverage_class_ex.name + '_' + uu + path.extname(thismedia.path);

		  		delete thismedia.meta.static_meta.coverage_class;
		  		delete thismedia.meta.static_meta.role;
		  		delete thismedia.meta.static_meta.shot;


		  		if (thismedia.path)
		  		{
		  			thismedia.originalpath = thismedia.path;
		  			thismedia.path = sails.config.S3_TRANSCODE_URL + thismedia.path.replace(sails.config.S3_TRANSCODE_URL,'');
		  		}
		  		if (thismedia.thumb)
		  		{
		  			thismedia.originalthumb = thismedia.thumb;
		  			thismedia.thumb = sails.config.S3_CLOUD_URL + thismedia.thumb.replace(sails.config.S3_CLOUD_URL,'');
		  		}
		  		cb();
    		});
    	});
    }
  },

  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Media',newlyInsertedRecord.id);
  	cb();
  },



};
