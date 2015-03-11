'use strict';

// Object.byString = function(o, s) {
//     s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
//     s = s.replace(/^\./, '');           // strip a leading dot
//     var a = s.split('.');
//     for (var i = 0, n = a.length; i < n; ++i) {
//         var n = a[i];
//         if (n in o) {
//             o = o[n];
//         } else {
//             return;
//         }
//     }
//     return o;
// }

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
      "com.2fdevs.videogular"
    ]);



liveApp.config(['uiGmapGoogleMapApiProvider',function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        //    key: 'your api key',
        v: '3.17',
        libraries: 'weather,geometry,visualization',
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
          var lena = item.meta.static_meta.clip_length.split(':');
          var time = (parseInt(lena[0])*3600) + (parseInt(lena[1])*60) + (parseFloat(lena[2])); 
            if( time >= min && time <= max ) {
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
          var time = moment(item.meta.static_meta.captured_at);

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

liveApp.controller('Live',['$scope','socket','uiGmapGoogleMapApi','$timeout','$sce','usSpinnerService', function ($scope,socket,uiGmapGoogleMapApi,$timeout,$sce,usSpinnerService) {

  //var controller = this;
  $scope.API = null;

  $scope.onPlayerReady = function(API) {
    $scope.API = API;
  };

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

    if (key=="zoom")
    {
      return '<span class="meta zoom">'+val+'</span>';
    }

    if (key=="nicepath")
    {
      return '<span class="meta nicepath">'+val+'.mp4</span>';
    }

    if (key.lastIndexOf('gps', 0) === 0 || key=="media_type")
    {
      return "";  
    }
    else
    {
      return '<span class="meta '+key+'">'+ val + '</span>';
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
  }

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
    return m.meta.static_meta.role_ex.name;
  }));

  $scope.coverage = _.unique(_.map($scope.media,function(m){
    return m.meta.static_meta.coverage_class_ex.name;
  }));

  $scope.phases = _.unique(_.map($scope.media,function(m){
    return m.meta.static_meta.meta_phase.name;
  }));

  $scope.takenshots = _.unique(_.map($scope.media,function(m){
    return m.meta.static_meta.shot_ex.name;
  }));

   $scope.takenmeta = _.unique(_.map($scope.media,function(m){
    return m.meta.static_meta.meta;
  }));

};

$scope.fit = function()
{
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
    $scope.mapInstance.fitBounds(bounds);
    $scope.mapInstance.refresh = function(){return true; };
  }
}

  $scope.shots = [];

  $scope.shotMap = function(user)
  {
    //console.log(user);
    var returns = _.find($scope.shots, function(s){
      return s.id == user.shot;
    }).image;
    if (user.shot==false && user.shot!=0)
      returns = 'blank.png';
    return '/static/data/icons/'+returns;
  };

  $scope.loading = true;

  (function () {
    //usSpinnerService.spin('spinner-1');

    // Using .success() and .error()
    socket.get('/event/updates/'+mastereventid)
      .success(function (data, status, headers, jwr) {
        //$scope.bars = data;
      })
      .error(function (data, status, headers, jwr) {
        
      });

    // Using .then()
    socket.get('/media/event/'+mastereventid)
      .then(function(resp){
         $scope.media = resp.data;
         $timeout(function(){
           $scope.fit();
          },0,false);
         $scope.updateFilters();
         //usSpinnerService.stop('spinner-1');
         $scope.loading = false;
      }, function(resp){
        
      });

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


                //update whole table...
                //$('#media').html(mediatemplate(media));
              }
              else
              {
                $scope.media.unshift(response.data.media);
                //$('#media').html(mediatemplate(media));
              }

              $scope.updateFilters();
          }

          //add this to the log...
          if (response.data.timer != undefined)
          {
            $scope.timer = response.data.timer;
            timer = response.data.timer;

            $('#mover').animate({marginLeft:-((pixsecs*response.data.timer) - 300)},1000,"linear");
          }

          if (response.data.users != undefined)
          {
            
            //$('.mover').css('height',(3*60));
            $scope.ucount = response.data.ucount;
            $scope.users = response.data.users;

            //console.log(response.data);
            //$scope.$apply();
            // if (mapmode)
            // {
            //   $('#selectiontimeline').html(selectiontemplate(response.data.users));
            // }
            // else
            // {
            //   $('#timeline').html(timelinetemplate(response.data.users));

            //   $('.shooting').each(function()
            //   {
            //     $(this).css('width',pixsecs*($(this).attr('length')));
            //   });

            //   $('.allocation_offset').each(function()
            //   {
            //     $(this).css('width',pixsecs*1);
            //   });

            //   $('.warning').each(function()
            //   {
            //     $(this).css('width',($(this).attr('length'))* pixsecs);
            //   });

            //   $('.live').each(function()
            //   {
            //     $(this).css('width',$(this).attr('length')* pixsecs);
            //   });

            //    $('.indicator').each(function()
            //   {
            //       var width = 0;
            //        $(this).children().each(function() {
            //           width += $(this).outerWidth( true );
            //       });
            //      $(this).css('width',width+'px');
            //   });

            //   $('.mainrows').each(function()
            //   {
            //     //console.log("offset: "+$(this).attr('offset'));
            //     var first = $(this).find('.indicator:first');
            //     first.css('margin-left',(pixsecs * (Number(first.attr('offset')))));
            //   });

            //   if (response.data.ucount)
            //   {
            //       $('.mainrows').css('width',2*(pixsecs*response.data.users[Object.keys(response.data.users)[0]].length*(response.data.ucount+1)));
            //       $('#mover').css('width',2*(pixsecs*response.data.users[Object.keys(response.data.users)[0]].length*(response.data.ucount+1)));
            //   }


            //    $('#mover').css('margin-left',-((pixsecs*timer) - 300));
            //  }
          }

          if (response.data.phase != undefined)
          {
            $scope.mode = response.data.phase;
            $scope.phase = response.data.ruleset;
          }
      });
  }());
}]);




var logApp = angular.module('logApp', [
      "ngSanitize",
      'ngLoadingSpinner',
      'ngAnimate',
      'ui.grid',
      'ui.grid.pagination',
      'ui.grid.moveColumns',
      'ui.grid.resizeColumns'
    ]);


logApp.controller('Log',['$scope','$http','uiGridConstants', function ($scope, $http, uiGridConstants) {

$scope.gridOptions = {
    paginationPageSizes: [50, 100, 200],
    paginationPageSize: 50,
    enableFiltering:true,
    enableColumnResizing: true,
    columnDefs: [
      { name: 'timestamp',cellFilter : "date:'medium'"},
      { name: 'message',displayName:'Module',filter:{condition: uiGridConstants.filter.CONTAINS}},
      { name: 'msg',displayName:'Message',filter:{condition: uiGridConstants.filter.CONTAINS}},
      { name:'hostname',displayName:'Host'},
      { name:'userid',filter:{condition: uiGridConstants.filter.CONTAINS}},
      { name:'meta',filter:{condition: uiGridConstants.filter.CONTAINS}}
    ]
  };

  if (typeof mastereventid != 'undefined')
  {
    $http.get('/log/getlog/'+mastereventid).success(function(data) {
      $scope.gridOptions.data = data;
    });
  }
  else
  {
    $http.get('/log/getall/').success(function(data) {
      $scope.gridOptions.data = data;
    });
  }
}]);


var watchApp = angular.module('watchApp', [
			"ngSanitize",
			"com.2fdevs.videogular",
      'ngLoadingSpinner',
      'ui.bootstrap',
      'ngAnimate',
      'ui.sortable',
      'ngStorage'
		]);

var shuffleArray = function(array) {
  var m = array.length, t, i;

  // While there remain elements to shuffle
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

watchApp.controller('Media',['$scope','$http','$sce','$localStorage','$timeout', function ($scope, $http, $sce, $storage,$timeout) {

	$scope.sources = [];
	$scope.playlist = [];

  // $scope.random = function(){
  //   return 0.5 - Math.random();
  // };

  if ($storage == undefined)
  {
    $('#myModal').modal('show');
    $storage = {firstrun : true};
  }

  $scope.size = function(o) {
    return (o==undefined) ? 0 : Object.keys(o).length;
  }

  $scope.sizeM = function(o) {
    return (o.stars==undefined) ? 0 : -Object.keys(o.stars).length;
  }

  $scope.username = masteruserid;

  $scope.search = {created_by : masteruserid};

  $scope.order_filter = 'meta.static_meta.captured_at';

  $scope.isplaying = {};
  var API = null;

  var controller = this;
  controller.API = null;

  $scope.inPlaylist = function(m)
  {
    return $scope.playlist.indexOf(m) != -1;
  }

  controller.onPlayerReady = function(API) {
    controller.API = API;
  };

  $scope.playall = function()
  {
    var vid = $('#videopanel').contents().detach();
    $('#videomodal').append(vid);
    $('#playAll').on('hide.bs.modal', function (e) {
      var vid = $('#videomodal').contents().detach();
       $('#videopanel').append(vid);
    });
    $('#playAll').modal('show');
    controller.API.play();
  }

  $scope.onCompleteVideo = function()
  {
    var index = $scope.playlist.indexOf($scope.isplaying);
    index++;
    if (index > $scope.playlist.length-1)
      index=0;

    if($scope.playlist.length > 0)
      $scope.playThis($scope.playlist[index]);
  }

  $http.get('/media/nicejson/'+mastereventid).success(function(data) {

    $scope.media = data;
    shuffleArray($scope.media);
    var x = 0;
    for(var i in $scope.media)
    {
      $scope.media[i].order = x;      
      //console.log($scope.media[i].stars);
    }
  });

  $http.get('/media/totals/'+mastereventid).success(function(data) {
    $scope.totals = data;
  });

  $scope.remove = function(vid)
  {
    if ($scope.playlist.indexOf(vid)!= -1)
    {
      $scope.playlist.splice($scope.playlist.indexOf(vid), 1);
      onCompleteVideo();
      $scope.$apply;
    }
  }

  $scope.playThis = function(vid) {
      $scope.sources = [{src: $sce.trustAsResourceUrl(vid.lowres), type: "video/mp4"}];
      $scope.isplaying = vid;

      if ($scope.playlist.indexOf(vid)== -1)
      {
        $scope.playlist.push(vid);
      }
      $scope.$apply;
      $timeout(controller.API.play.bind(controller.API), 100);
      //console.log($scope.playlist);
    };

  $scope.star=function(shot,event)
  {
    if (shot.stars==undefined)
    {
      shot.stars = {};
    }

    if (shot.stars[$scope.username]==undefined)
    {
      
      shot.stars[$scope.username] = true;
    }
    else
    {
        delete shot.stars[$scope.username];
    }
    if(event){
      event.stopPropagation();
      event.preventDefault();
    }

    io.socket.post('/media/star', {id:shot.id,star:shot.stars[$scope.username]!=undefined},function(result){

    });
  }

  $scope.format = function(shot)
  {
    return "By " + shot.user.profile.displayName + " on " + shot.meta.static_meta.captured_at;
  }
}]);


var shotApp = angular.module('shotApp', [
      "ngSanitize",
      'ngLoadingSpinner'
    ]);

shotApp.controller('Event',['$scope','$http','$sce', function ($scope, $http, $sce) {

  $http.get('/commission/info/'+mastereventid).success(function(data) {
    $scope.event = data;
  });

  $scope.hide=function(shot)
  {
    shot.hidden = !shot.hidden;
  }

  $scope.clone=function(shot)
  {
    var newone = angular.copy(shot);
    newone.isnew = true;
    delete newone.footage;
    var maxnum = -1;
    for (var i in $scope.event.eventtype.shot_types)
    {
      if ($scope.event.eventtype.shot_types[i].id > maxnum)
        maxnum = $scope.event.eventtype.shot_types[i].id;
    }
    newone.id = maxnum++;
    $scope.event.eventtype.shot_types.unshift(newone);
  }

  $scope.save=function()
  {
    //save current data:
    $http.post('/commission/updateshots', {id:$scope.event.id,shots:$scope.event.eventtype.shot_types}).
    success(function(data, status, headers, config) {
      for (var i in $scope.event.eventtype.shot_types)
      {
       delete $scope.event.eventtype.shot_types[i].isnew;
      }
      $scope.success = true;
      delete $scope.error;
      setTimeout(function(){
        delete $scope.success;
        $scope.$apply();
      },2000);
    }).
    error(function(data, status, headers, config) {
      delete $scope.success;
      $scope.error = true;
      setTimeout(function(){
        delete $scope.error;
        $scope.$apply();
      },2000);
    });
  }
  $scope.remove=function(m)
  {
    $scope.event.eventtype.shot_types.splice( $scope.event.eventtype.shot_types.indexOf(m), 1);
  }
}]);