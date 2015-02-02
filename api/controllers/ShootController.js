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
        return res.redirect('/event/new');
      }
      //console.log(event);
      event.calcphases();
      res.view({event:event});
    });
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
          return res.redirect('/event/new');
        }
        //console.log(event);
        res.view({event:event,_layoutFile: '../nomenu.ejs'});
      });

  }
};
