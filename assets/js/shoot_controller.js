'use strict';

var minutesOfDay = function(m){
  return m.minutes() + m.hours() * 60;
}

function getProperty(obj, prop) {
    var parts = prop.split('.'),
        last = parts.pop(),
        l = parts.length,
        i = 1,
        current = parts[0];

    while((obj = obj[current]) && i < l) {
        current = parts[i];
        i++;
    }

    if(obj) {
        return obj[last];
    }
}

var liveApp = angular.module('liveApp', [
      "ngSanitize",
      'ngLoadingSpinner',
      'ngAnimate',
      'angularSails.io',
      'uiGmapgoogle-maps',
      'ui.slider',
      'ui.bootstrap',
      'checklist-model',
      "com.2fdevs.videogular",
      'angularUtils.directives.dirPagination',
      'ui.knob'
    ]);

liveApp.config(['paginationTemplateProvider', function(paginationTemplateProvider) {
    paginationTemplateProvider.setPath('/dirPagination.tpl.html');
}]);

liveApp.config(['uiGmapGoogleMapApiProvider',function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.17',
        libraries: 'geometry,visualization',
    });
}]);

liveApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);

liveApp.filter('rangeFilter', function() {
    return function( items, rangeInfo ) {
        var filtered = [];
        if (rangeInfo == undefined)
          return items;
        var min = parseInt(rangeInfo[0]);
        var max = parseInt(rangeInfo[1]);
        // If time is with the range
        angular.forEach(items, function(item) {
          try
          {
              var lena = item.meta.static_meta.clip_length.split(':');
              var time = (parseInt(lena[0])*3600) + (parseInt(lena[1])*60) + (parseFloat(lena[2]));
              //console.log(lena);
                if( time >= min && time <= max ) {
                    filtered.push(item);
                }
          }
          catch (e)
          {
            filtered.push(item);
          }
        });
        return filtered;
    };
});

liveApp.filter('timeFilter', function() {
    return function( items, times ) {
        var filtered = [];
        if (times.from == undefined || times.to == undefined)
          return items;
        var min = minutesOfDay(moment(times.from));
        var max = minutesOfDay(moment(times.to));
        // If time is with the range
        angular.forEach(items, function(item) {
          //var lena = item.meta.static_meta.clip_length.split(':');
          //var time = (parseInt(lena[0])*3600) + (parseInt(lena[1])*60) + (parseFloat(lena[2]));
          var time = moment(item.meta.static_meta.captured_at+':00','DD-MM-YYYY hh:mm:ss.SS a Z');
          
            if(minutesOfDay(time) >= min && minutesOfDay(time) <= max ) {
                filtered.push(item);
            }
        });
        return filtered;
    };
});

liveApp.filter('checkFilter', function() {
    return function( items, params ) {
        var filtered = [];
        if (params.value == undefined || params.value.length == 0)
          return items;
        // If time is with the range
        angular.forEach(items, function(item) {
          if (_.contains(params.value,getProperty(item, params.name)))
            filtered.push(item);
        });
        return filtered;
    };
});

liveApp.filter('areaFilter', function() {
    return function( items, params ) {
        var filtered = [];
        if (params.circle == undefined || params.filterbylocation == false)
          return items;
        // If time is with the range
        angular.forEach(items, function(item) {
          var latLng = new google.maps.LatLng(item.meta.static_meta.gps_lat,item.meta.static_meta.gps_lng);
          if (params.circle.getBounds().contains(latLng) && google.maps.geometry.spherical.computeDistanceBetween(params.circle.getCenter(), latLng) <= params.circle.radius)
            filtered.push(item);
        });
        return filtered;
    };
});

liveApp.filter('hasVideoFilter', function() {
    return function( items, params ) {
        var filtered = [];
        // If time is with the range
        angular.forEach(items, function(item) {
          if ((params && item.path) || params==false)
            filtered.push(item);
        });
        return filtered;
    };
});

liveApp.filter('hasEditTag', function() {
    return function( items, params ) {
        var filtered = [];
        // If time is with the range
        angular.forEach(items, function(item) {
          if ((params && item.meta.static_meta.edit_tag) || params==false)
            filtered.push(item);
        });
        return filtered;
    };
});

liveApp.controller('Live',['$scope','socket','uiGmapGoogleMapApi','$timeout','$sce','usSpinnerService','$interval','uiGmapIsReady','$window', function ($scope,socket,uiGmapGoogleMapApi,$timeout,$sce,usSpinnerService,$interval,uiGmapIsReady,$window) {
  //var controller = this;
  $scope.API = null;
  $scope.candelete = false;
  $scope.edit_tag =false;

  $scope.filteredmedia = [];

  $scope.onPlayerReady = function(API) {
    $scope.API = API;
  };

  $scope.deletemode = function()
  {
    $scope.candelete = !$scope.candelete;
  };

  $scope.editing = false;

  $scope.start = function(editing)
  {
    $scope.editing = editing;
  }

  $scope.pixsecs = 15;

  $scope.mapshown = true;
  $scope.crewshow = true;
  $scope.filtershow = false;
  $scope.controlshow = false;
  $scope.timefilterfrom = null;
  $scope.timefilterfrom = null;
  $scope.filterbylocation = false;

  $scope.sources = [];

  $scope.log = function(didthis,params)
  {
    socket.post('/log/click/', {eventid:mastereventid, event:didthis, page:'shoot',extras:params});
  };

  $scope.showMap = function() {
    $scope.mapshown = !$scope.mapshown;
  };
  $scope.showCrew = function() {
    $scope.crewshow = !$scope.crewshow;
  };
  $scope.showFilter = function() {
    $scope.filtershow = !$scope.filtershow;
  };
   $scope.showControls = function() {
    $scope.controlshow = !$scope.controlshow;
  };
   $scope.showlocation = function() {
    $scope.filterbylocation = !$scope.filterbylocation;
  };

  $scope.playThis = function(vid) {
      $scope.sources = [{src: $sce.trustAsResourceUrl(vid.path), type: "video/mp4"}];
      //$scope.isplaying = vid;
      $('#playAll').on('hide.bs.modal', function (e) {
        //var vid = $('#playAll').contents().detach();
        //$('#playAll').append(vid);
        $timeout($scope.API.stop.bind($scope.API), 100);
        $scope.log('pause',{media:vid.id});
      });
      $('#playAll').modal('show');
      //controller.API.play();

      // if ($scope.playlist.indexOf(vid)== -1)
      // {
      //   $scope.playlist.push(vid);
      // }
      $scope.$apply;
      $timeout($scope.API.play.bind($scope.API), 100);

      $scope.log('play',{media:vid.id});
      //console.log($scope.playlist);
    };

  $scope.format = function(key,val)
  {
    if (key=="gps_lng")
    {
      return '<span class="meta gps"> GPS location</span>';
    }
    if (key=="server_shot")
    {
      return '';
    }
    if (key=="filesize")
    {
      return '<span class="meta filesize">'+parseInt(val)/1024+'MB</span>';
    }
    if (key=="role_ex")
    {
      return '<span class="meta role">'+val.name+'</span>';
    }
     if (key=="shot_ex")
    {
      return '<span class="meta shot">'+val.name+'</span>';
    }
    if (key=="coverage_class_ex")
    {
      return '<span class="meta coverage">'+ val.name +'</span>';
    }
    if (key=="shot_meta" && val!=null)
    {
      return '<span class="meta shot_meta">'+val+'</span>';
    }

    if (key=="meta_phase" && val!='null')
    {
      return '<span class="meta phase">'+val.name+'</span>';
    }
    
    if (key=="phase_ex" && val!='null')
    {
      return '<span class="meta phase">'+val.name+'</span>';
    }

    if (key=="zoom")
    {
      return '<span class="meta zoom">'+val+'</span>';
    }

    if (key=="nicepath")
    {
      return '<span class="meta nicepath">'+val+'.mp4</span>';
    }

    if (key.lastIndexOf('gps', 0) === 0 || key=="media_type" || key=='role' || key=='shot' || key=='static_meta' || key=='timed_meta' || key=='coverage_class')
    {
      return "";
    }
    else
    {
      return '<span class="meta '+key+'"><strong>'+key + '</strong> ' + val + '</span>';
    }
  }

  $scope.runonce = false;

  $scope.mapfilter = {};
  $scope.lengthfilter =  [0,50];
  $scope.rolefilter= [];
  $scope.shotfilter=[];
  $scope.phasefilter=[];
  $scope.coveragefilter=[];
  $scope.hasvideo = false;

  $scope.users = [];
  // $scope.circle = {
  //     center: {
  //         latitude: 44,
  //         longitude: -108
  //     },
  //     radius: 500
  // };



  $scope.setMapFilter = function(id)
  {
    $scope.mapfilter.id = id;
    delete $scope.mapfilter.created_by;
    $scope.tabs.tab0 = true;
    $scope.tabs.tab1 = false;
  }

  $scope.tabs = {
    tab0:true,
    tab1:false
  };

  $scope.clearFilters = function()
  {
    delete $scope.mapfilter.id;
    delete $scope.mapfilter.created_by;
    $scope.rolefilter= [];
    $scope.shotfilter=[];
    $scope.phasefilter=[];
    $scope.coveragefilter=[];
    $scope.lengthfilter = [0,50];
    delete $scope.timefilterfrom;
    delete $scope.timefilterto;
    $scope.hasvideo = false;
  };

  $scope.setUser = function(id)
  {
    if (id==$scope.mapfilter.created_by)
    {
      delete $scope.mapfilter.created_by;
    }
    else
    {
      $scope.mapfilter.created_by=id;
    }
    delete $scope.mapfilter.id;
  }

  $scope.mediaCount = function(id)
  {
    var count = _.filter($scope.media,function(m)
    {
      return m.created_by == id;
    }).length;
    return count;
  }


  $scope.map = { zoom: 8,center: { latitude: 45, longitude: -73 },bounds:{},
  events: {
        tilesloaded: function (map) {
            $scope.$apply(function () {
                $scope.mapInstance = map;
                if (!$scope.runonce)
                {
                  $scope.runonce = true;
                  $scope.fit();
                }
            });
        }
    } };

socket.connect().then(function(sock){
    console.log('connected',sock)
},function(err){
    console.log('connection error',err)
},function(not){
    console.log('connection update',not)
});

$scope.updateFilters = function()
{
  $scope.roles = _.unique(_.map($scope.media,function(m){
    return m.meta.role_ex.name;
  }));

  $scope.coverage = _.unique(_.map($scope.media,function(m){
    return m.meta.coverage_class_ex.name;
  }));

  $scope.phases = _.unique(_.map($scope.media,function(m){
    if (typeof m.meta.meta_phase != 'undefined')
      return m.meta.meta_phase.name;
    else
      return 'Unknown';
  }));

  $scope.takenshots = _.unique(_.map($scope.media,function(m){
    return m.meta.shot_ex.name;
  }));

   $scope.takenmeta = _.unique(_.map($scope.media,function(m){
    return m.meta.meta;
  }));

};

var stopTime = -1;

$scope.tag=function(media,event)
{
  if (media.meta.static_meta.edit_tag==undefined)
  {
    media.meta.static_meta.edit_tag = new Date();
    io.socket.post('/media/add_tag', {id:media.id,field:'edit_tag',val:media.meta.static_meta.edit_tag},function(result){

    });
  }
  else {
    delete media.meta.static_meta.edit_tag;
    io.socket.post('/media/rm_tag', {id:media.id,field:'edit_tag'},function(result){

    });
  }

  if(event){
    event.stopPropagation();
    event.preventDefault();
  }
}

$scope.removeclip = function(media,event){

  var r = confirm("Do you really want to remove this media?");
    if (r == true) {
      delete media.path;
      delete media.thumb;
      io.socket.post('/media/remove', {id:media.id},function(result){
        //removed!

      });
    }
    //delete media.meta.static_meta.edit_tag;


  if(event){
    event.stopPropagation();
    event.preventDefault();
  }
}

$scope.fixMap = function()
{
   $timeout(function () {
    $scope.fit();
  },500);
}

$scope.fit = function()
{
  if ($scope.mapready)
  {
    // $scope.mapshown = false;
    var bounds = new google.maps.LatLngBounds();
    for (var i in $scope.media)
    {
      if ($scope.media[i].meta.static_meta.gps_lat)
        bounds.extend(new google.maps.LatLng($scope.media[i].meta.static_meta.gps_lat,$scope.media[i].meta.static_meta.gps_lng));
    }
    //$scope.map.bounds = bounds;
    //$scope.map.control.fitBounds(bounds);
    //$scope.circles[0].center = {longitude:bounds.getCenter().lng(),latitude:bounds.getCenter().lat()};
    // $scope.$apply;

    $scope.circles = [
      {
          id: 1,
          center: {
             longitude:bounds.getCenter().lng(),
             latitude:bounds.getCenter().lat()
          },
          radius: 250,
          stroke: {
              color: '#08B21F',
              weight: 2,
              opacity: 1
          },
          fill: {
              color: '#08B21F',
              opacity: 0.3
          },
          geodesic: true, // optional: defaults to false
          draggable: true, // optional: defaults to false
          clickable: false, // optional: defaults to true
          editable: true, // optional: defaults to false
          visible: true, // optional: defaults to true
          control: {},
          events:{
            center_changed:function(arg1)
            {
              $scope.circlefilter = arg1;
              $scope.log('circlefilter',{center:arg1.center,radius:arg1.radius});
            },
            radius_changed:function(arg1)
            {
              $scope.circlefilter = arg1;
              $scope.log('circlefilter',{center:arg1.center,radius:arg1.radius});
            }
          }
      }
  ];

    if ($scope.mapInstance)
    {
      google.maps.event.trigger($scope.mapobject, 'resize');
      //$scope.mapInstance.trigger(map, "resize");
      $scope.mapInstance.fitBounds(bounds);
      $scope.mapInstance.refresh = function(){return true; };
    }
  }
}
   
   //  04/08/2015 12:45:14.58 PM +01
   
   
  /* LIVE EDITING */
    
  $scope.shots = [];

  $scope.currentlive = {};
  
  $scope.editlist = [];
  
  angular.element($window).on('keydown', function(e) {
      
      var key = e.keyCode-49;
      var uu = _.sortBy(_.values($scope.users),'id');
      if (uu.length > parseInt(key))
        $scope.makeLive(uu[parseInt(key)]);
  });
  
  $scope.calculateEdit = function(edit)
  {
    if (edit.media)
    {
      var createdat = moment(edit.media.meta.static_meta.captured_at+':00',"DD/MM/YYYY HH:mm:ss.SS A Z");
      //console.log(createdat.format());
      //console.log(edit.cutto.format());
      
      var inpoint = edit.cutto.valueOf() - createdat.valueOf();
      
      var outpoint = edit.cutfrom.valueOf() - createdat.valueOf(); 
      edit.outpoint = outpoint/1000;
      //console.log("calc: "+outpoint);
      //console.log("rough: "+edit.out_int);
      if (!isNaN(edit.in_int))
        edit.inpoint = inpoint/1000;
      else
        edit.inpoint = 0;
        
      //save the edit:
       var filtered = _.filter($scope.editlist,function(e)
       {
         return e.media && e.media.id == edit.media.id;
       });
         
       var edits = _.map(filtered,function(e)
         {
            return {
              inpoint:e.inpoint,
              outpoint:e.outpoint,
              madeby:masteruserid
            };
         });
         
       socket.post('/media/update_edits/', {id:edit.media.id,edits: edits}).then(function(){
         console.log("saved media "+edit.media.id);
       });
    } 
  }
  
  $scope.makeLive = function(user)
  {
    if (user.status=='live' && (!$scope.currentlive.user || ($scope.currentlive.user && user.id != $scope.currentlive.user.id)))
    {
    //do editing things here...
      if ($scope.currentlive.user)
      {
        //adjust outpoint of the last one...
        var e = _.last($scope.editlist);
        e.out_int = ($scope.calcTime($scope.currentlive.user) - user.warning - user.live);
        e.cutfrom = moment();
        e.length = e.cutfrom.valueOf() - e.cutto.valueOf();
        
        $scope.currentlive.user = user;
        
        var edit = {
          cutto:moment(),
          user_id:$scope.currentlive.user.id,
          image:$scope.shotMap($scope.currentlive.user),
          in_int:($scope.calcTime(user) - user.warning - user.live)
        };
        $scope.editlist.push(edit);
      }
      else
      {
        var edit = {
          cutto:moment(),
          user_id:user.id,
          image:$scope.shotMap(user),
          in_int:($scope.calcTime(user) - user.warning - user.live)
        };
        $scope.editlist.push(edit);
        $scope.currentlive.user = user;
      }
    }
  }
  
  $scope.coverageMap = function(c)
  {
    if ($scope.event && c)
      return $scope.event.coverage_classes[c].name;
    else return '';
  }
  
  $scope.calcTime = function(user)
  {
    if (!user)
      return 0;
    
    var magicnumber = user.warning + user.live + user.length;
    var myoffset = ($scope.timer - user.offset) % magicnumber;
    if (myoffset < 0) // fix circular timeline
		{
			myoffset+=magicnumber;
		}
    return myoffset;
  }
  
  $scope.latestshot = function(user)
  {
    var u = _.find($scope.media,function(m){
      return m.created_by == user.id;
    });
    return u;
  }
  
  $scope.shotMap = function(user)
  {
   if (user.shot)
      {
      var returns = _.find($scope.shots, function(s){
        return s.id == user.shot;
      }).image;
        if (user.shot==false && user.shot!=0)
          return '/static/images/blank.png';
        return '/static/data/icons/'+returns;
      }
      else{
        return '/static/images/blank.png';
      }    
  };
  
    $scope.shotMapLarge = function(user)
    {
      
      if (!user)
        return '/static/images/blank.png';
      //console.log(user);
      if (user.shot)
      {
        var returns = _.find($scope.shots, function(s){
          return s.id == user.shot;
        }).image;
        if (user.shot==false && user.shot!=0)
           return '/static/images/blank.png';
        return '/static/data/images/'+returns;
      }
      else{
         return '/static/images/blank.png';
      }
    };


  $scope.loading = true;
  $scope.mapready = false;

  $scope.mapobject = null;

  uiGmapIsReady.promise(1).then(function(instances) {
      instances.forEach(function(inst) {
        console.log('map ready');
        $scope.mapobject = inst.map;
        $scope.mapready = true;
      });
  });


  (function () {
    //usSpinnerService.spin('spinner-1');

    // Using .success() and .error()
    socket.get('/event/updates/'+mastereventid)
      .success(function (data, status, headers, jwr) {
        //$scope.bars = data;
      })
      .error(function (data, status, headers, jwr) {

      });

      socket.get('/commission/templateinfo/'+mastereventid)
            .then(function(resp){
               $scope.event = resp.data;
            });

      $scope.media = [];

      var start = 0;
      var limit = 50;
      var loading = false;

      if (typeof(editing) == 'undefined')
      {

      stopTime = $interval(function(){
        $scope.loading = true;
        // Using .then()
        if (!loading)
        {
          loading = true;
          socket.get('/media/nicejson/'+mastereventid + '?limit='+limit+'&skip='+(start*limit))
            .then(function(resp){
               $scope.media = $scope.media.concat(resp.data);
               $timeout(function(){
                 $scope.fit();
                },0,false);
               $scope.updateFilters();
               //usSpinnerService.stop('spinner-1');
               $scope.loading = false;
               start++;
               if (resp.data.length < limit)
                 $interval.cancel(stopTime);

               loading = false;
            });
        }
      }, 200);
      } 

      socket.on('event',function(response)
      {
          if (response.data.shots != undefined)
          {
            $scope.shots = response.data.shots;
          }

          if (response.data.media != undefined)
          {
              //new media item from this event
              //render media:
              //add media to the front of the list...
              if (response.data.update)
              {
                //find the one that matches...
                for (var i=0;i<$scope.media.length;i++)
                {
                  if ($scope.media[i].id == response.data.media.id)
                  {
                    $scope.media[i] = response.data.media;
                  }
                }
                
                if ($scope.editing)
                {
                  var e = _.filter($scope.editlist,function(e){
                    return e.media && e.media.id == response.data.media.id;
                  });
                  _.each(e,function(f){
                    f.media.thumb = response.data.media.thumb;
                  })
                    
                }

                //update whole table...
                //$('#media').html(mediatemplate(media));
              }
              else
              {
                //single shot:
                $scope.media.unshift(response.data.media);           
                if ($scope.editing)
                {
                  //find theall things in the edit list with this user but no media set:
                  var edit = _.filter($scope.editlist,function(m){
                    return m.user_id==response.data.media.created_by && m.media==null;
                  });
                  _.each(edit,function(e){
                    e.media = response.data.media;
                    $scope.calculateEdit(e);
                  });                  
                }
              }

              $scope.updateFilters();
          }
          
          //add this to the log...
          if (response.data.timer != undefined)
          {
            $scope.timer = response.data.timer;
            timer = response.data.timer;
          }

          if (response.data.users != undefined)
          {         
            $scope.ucount = response.data.ucount;
            $scope.users = response.data.users;
            
            //console.log($scope.currentlive.status);
            if ($scope.editing)
            {
                if ($scope.currentlive.user)
                {
                  var tmplive = _.find($scope.users,{id:$scope.currentlive.user.id});
                  
                  if (tmplive.status!='live')
                  {
                    var personlive = _.find($scope.users,{status:'live'});
                    if (personlive)
                    {
                      $scope.makeLive(personlive);
                    }
                  }
                }
                else{
                  var personlive = _.find($scope.users,{status:'live'});
                    if (personlive)
                    {
                      $scope.makeLive(personlive);
                    }
                }
            }
          }

          if (response.data.phase != undefined)
          {
            $scope.mode = response.data.phase;
            $scope.phase = response.data.ruleset;
          }
      });
  }());
}]);
