/**
 * ShootController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

  /**
   * /shoot/controller
   */
  index: function (req,res) {

    var lookupid = req.session.event || req.session.passport.user.currentevent;
      //console.log(lookupid);

      //if event is explicitally set in GET
      if (req.params.id)
      {
        lookupid = req.params.id;
      }

      req.session.event = lookupid;
    //event config screen -- module selection for the event
    //console.log(lookupid);

    Event.findOne(lookupid).exec(function(err,event){
      if (event == undefined)
      {
        //req.session.flash = {err:"Event not found"};
        return res.redirect('/dashboard');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event});
    });
  },
  
  liveedit:function(req,res){
    var lookupid = req.session.event || req.session.passport.user.currentevent;
      //console.log(lookupid);

      //if event is explicitally set in GET
      if (req.params.id)
      {
        lookupid = req.params.id;
      }

      req.session.event = lookupid;
    //event config screen -- module selection for the event
    //console.log(lookupid);

    Event.findOne(lookupid).exec(function(err,event){
      if (event == undefined)
      {
        //req.session.flash = {err:"Event not found"};
        return res.redirect('/dashboard');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event});
    });
  },
  
  preedit:function(req,res){
    var lookupid = req.session.event || req.session.passport.user.currentevent;
      //console.log(lookupid);

      //if event is explicitally set in GET
      if (req.params.id)
      {
        lookupid = req.params.id;
      }

      req.session.event = lookupid;
    //event config screen -- module selection for the event
    //console.log(lookupid);

    Event.findOne(lookupid).exec(function(err,event){
      if (event == undefined)
      {
        //req.session.flash = {err:"Event not found"};
        return res.redirect('/dashboard');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event});
    });
  },

sendmessage:function(req,res){
  if (req.param('message'))
  {
    //find participants:
    //anyone who's live
    //var sendto = [];
    sails.eventmanager.getusers(req.param('id'),function(users){

    Media.find({event_id:req.param('id')}).exec(function(err,media){
      _.each(media,function(m)
    {
      if (!_.contains(users,m.created_by))
        users.push(m.created_by);
    });
    //console.log(users);

    //anyone who's participated:

        User.find({id:users}).exec(function(err,users)
        {
          _.each(users,function(u){
            if (u.pushcode) //for testing.... && u.profile.emails[0].value == sails.config.admin_email
            {
              Gcm.sendMessage(u.platform,u.pushcode,"Bootlegger Message",req.param('message'),null);
            }
          });
          req.session.flash = {msg:"Message Sent!"};
          res.redirect('/shoot');
        });
      });
    });
  }
  else
  {
    req.session.flash = {msg:"No Message Given!"};
    res.redirect('/shoot');
  }
},


shootdemo: function (req,res) {

  var lookupid = req.session.event || req.session.passport.user.currentevent;
        //console.log(lookupid);

        //if event is explicitally set in GET
        if (req.params.id)
        {
          lookupid = req.params.id;
        }

        req.session.event = lookupid;
      //event config screen -- module selection for the event
      //console.log(lookupid);

      Event.findOne(lookupid).exec(function(err,event){
        if (event == undefined)
        {
          //req.session.flash = {err:"Event not found"};
          return res.redirect('/dashboard');
        }
        //console.log(event);
        res.view({event:event,_layoutFile: '../nomenu.ejs'});
      });

  }
};
