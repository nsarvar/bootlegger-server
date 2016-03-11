/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 /**
 * Media
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */
var path = require('path');
var urlencode = require('urlencode');
module.exports = {

  getnicejson : function(req,res,eventid,cb)
  {
  	  User.find({}).exec(function(err,users)
      {
          Event.findOne(eventid,function(err,ev){
          //	console.log(err);
            //console.log(ev);

          	if (!ev || err)
      			{
      				return res.json({msg:'cannot find shoot'},500);
      			}

      		  var criteria = {'event_id':eventid};

      		  if (req.param('limit'))
      		  	criteria.limit = req.param('limit');

    	      if (req.param('skip'))
      		  	criteria.skip = req.param('skip');
                    
              if (req.param('criteria'))
                _.merge(criteria,req.param('criteria'));
                
                //console.log(criteria);


            Media.find(criteria).sort('createdAt').exec(function(err,data)
            {
              //for each media, go through and fill in ids:
              _ = require('lodash');
              _.each(data,function(m)
              {
                //role, shot coverage class
                if (m.meta.static_meta.meta_phase && ev.phases)
                {
                	m.meta.phase_ex = ev.phases[m.meta.static_meta.meta_phase];
                }

                if (!m.meta.phase_ex)
                {
                  m.meta.phase_ex={name:'Unknown'};
                }

                if (m.meta.static_meta.role)
                {
  	        	      m.meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
    	      		}
                
    	      		if (!m.meta.role_ex)
    	      		{
    	      			m.meta.role_ex={name:'Unknown'};
    	      		}

                var uuu = _.findWhere(users, {id: m.created_by});
                m.user = {profile:{displayName:'Anon'}};

                if (uuu)
                {
                	m.user = {profile:{displayName:uuu.profile.displayName}};
                	//privacy:
                	if (uuu.permissions)
                	{
                		if (uuu.permissions[ev.id])
                		{
                			m.user = {profile:{displayName:'Anon'}};
                		}
                	}
                }
                //console.log(m.meta.static_meta.shot);
                //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
                if (m.meta.static_meta.shot)
                {
              	  m.meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
            	  }
                if (!m.meta.shot_ex)
                  m.meta.shot_ex = {name:'Unknown'};

          	  if (m.meta.static_meta.coverage_class)
          	  {
          	    m.meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
        		  }
              
              if (!m.meta.coverage_class_ex)
              {
                m.meta.coverage_class_ex = {name:"Unknown"};
              }

                var timestamp = m.meta.static_meta.captured_at.split(' ');
                var ext = '.mp4';
                if (m.path)
                {
                	ext = path.extname(m.path);
                }
                else if (m.meta.static_meta.local_filename)
                {
                  ext = path.extname(m.meta.static_meta.local_filename);
                }

                var uu = "unknown";
  	  			if (m.user)
  		  			uu = m.user.profile.displayName;

                var isgood = (m.meta.static_meta.edit_tag)?'_GOOD':'';

                m.meta.static_meta.nicepath = urlencode((timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.role_ex.name + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_'  + uu + isgood + ext).replace(/ /g,'_'));

                //m.meta.static_meta.nicepath = filename;
                if (m.path)
                {
                	m.originalpath = sails.config.master_url+'/media/full/'+m.id;
                	m.lowres = sails.config.master_url+'/media/preview/'+m.id;
                }

                if (m.thumb)
                {
                	m.originalthumb = m.thumb;
                    //m.thumb = sails.config.S3_CLOUD_URL + escape(m.originalthumb);
                    m.thumb = sails.config.master_url+'/media/thumbnail/'+m.id;
            	}
                
                m.deleted = (m.deleted?true:false);
            	  //console.log(m);
              });//end each
              cb(data);
            });
          });
        });
  },

  attributes: {
    nicify:function(cb)
    {
    	var m = this;
    	//console.log(this);
    	Event.findOne(m.event_id).exec(function(err,ev)
    	{
    		if (ev)
    		{
	    		//console.log(ev);
	    		User.findOne(m.created_by).exec(function(err,user)
	    		{

	    			_ = require('lodash');
              
                //role, shot coverage class
                if (m.meta.static_meta.meta_phase && ev.phases)
                {
                	m.meta.phase_ex = ev.phases[m.meta.static_meta.meta_phase];
                }

                if (!m.meta.phase_ex)
                {
                  m.meta.phase_ex={name:'Unknown'};
                }

                if (m.meta.static_meta.role)
                {
  	        	      m.meta.role_ex = ev.eventtype.roles[m.meta.static_meta.role];
    	      		}
                
    	      		if (!m.meta.role_ex)
    	      		{
    	      			m.meta.role_ex={name:'Unknown'};
    	      		}

                //var uuu = _.findWhere(users, {id: m.created_by});
                m.user = {profile:{displayName:'Anon'}};

                if (user)
                {
                	m.user = {profile:{displayName:user.profile.displayName}};
                	//privacy:
                	if (user.permissions)
                	{
                		if (user.permissions[ev.id])
                		{
                			m.user = {profile:{displayName:'Anon'}};
                		}
                	}
                }
                //console.log(m.meta.static_meta.shot);
                //console.log(_.findWhere(ev.eventtype.shot_types,{id:m.meta.static_meta.shot}));
                if (m.meta.static_meta.shot)
                {
              	  m.meta.shot_ex = ev.eventtype.shot_types[m.meta.static_meta.shot];
            	  }
                if (!m.meta.shot_ex)
                  m.meta.shot_ex = {name:'Unknown'};

          	  if (m.meta.static_meta.coverage_class)
          	  {
          	    m.meta.coverage_class_ex = ev.coverage_classes[m.meta.static_meta.coverage_class];
        		  }
              if (!m.meta.coverage_class_ex)
              {
                m.meta.coverage_class_ex = {name:"Unknown"};
              }

                var timestamp = m.meta.static_meta.captured_at.split(' ');
                var ext = '.mp4';
                if (m.path)
                {
                	ext = path.extname(m.path);
                }
                else if (m.meta.static_meta.local_filename)
                {
                  ext = path.extname(m.meta.static_meta.local_filename);
                }

                var uu = "unknown";
  	  			if (m.user)
  		  			uu = m.user.profile.displayName;

            var isgood = (m.meta.static_meta.edit_tag)?'_GOOD':''; 
            m.deleted = (m.deleted?true:false);

 //FIX PARSE OF TIMESTAMP WITH MOMENT -- CRASHES IF INCORRECT TIMESTAMP!!

  			m.meta.static_meta.nicepath = urlencode((timestamp[1].replace(':','-').replace(':','-') + '_' + m.meta.role_ex.name + '_' + m.meta.shot_ex.name + '_' + m.meta.coverage_class_ex.name + '_' + uu + isgood + ext).replace(/ /g,'_'));

                //m.meta.static_meta.nicepath = filename;
                if (m.path)
                {
                	m.originalpath = sails.config.master_url + '/media/full/'+m.id
                	m.lowres = sails.config.master_url + '/media/preview/'+m.id
                }

                if (m.thumb)
                {
                	m.originalthumb = m.thumb;
                  //m.thumb = sails.config.S3_CLOUD_URL + escape(m.originalthumb);
                  m.thumb = sails.config.master_url + '/media/thumbnail/'+m.id;
            	  }
			  		cb();
          });
			}
			else
			{
				//no event found -- do nothing...
				cb();
			}
    	});

    }
  },

  afterCreate:function(newlyInsertedRecord, cb)
  {
  	Log.logModel('Media',{msg:'created',id:newlyInsertedRecord.id});
  	cb();
  },

  isContributor:function(userid,cb)
  {
    Media.find({created_by:userid}).exec(function(err, m){
       cb(m.length > 0);
    });
  }

};
