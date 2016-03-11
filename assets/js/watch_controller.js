'use strict';

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

bootleggerApp.filter('isMine', function() {
    return function( items, params ) {
        var filtered = [];
        // If time is with the range
        angular.forEach(items, function(item) {
          
          if ((typeof(params.created_by) != 'undefined' && item.created_by==params.created_by) || typeof(params.created_by) == 'undefined')
            filtered.push(item);            
        });
        return filtered;
    };
});

bootleggerApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);

bootleggerApp.controller('list',['$scope','$http','$sce','$localStorage','$timeout','$interval','socket', function ($scope, $http, $sce, $storage,$timeout,$interval,socket) {

	$scope.sources = [];
	$scope.playlist = [];
  $scope.loading = true;
 
  $scope.edit = {title:'',description:''};

 $scope.restartedit = function(id,event)
 {
   socket.post('/watch/restartedit/'+id).then(function(resp){
     //done
   });
   
   if(event){
      event.stopPropagation();
      event.preventDefault();
    }
 };

 $scope.formatDate = function(date){
          var dateOut = moment(date,'dd-MM-yyyy');
          return dateOut.toDate();
    };

 (function () {
   //usSpinnerService.spin('spinner-1');

   
   addthis.init();

   socket.on('edits',function(resp){
       //update the progress...
       for (var i=0;i<$scope.edits.length;i++)
       {
            if ($scope.edits[i].id == resp.data.edit.id)
            {
                $scope.edits[i] = resp.data.edit;
            }   
       }
   });

   // Using .success() and .error()
   socket.get('/watch/mymedia/')
     .then(function(resp){
        $scope.edits = resp.data.edits;
        
        socket.post('/watch/editupdates',{edits:_.pluck($scope.edits,'id')}).then(function(resp){
            
        });

        $timeout(function () { 
            addthis.toolbox('.addthis_toolbox');
        }, 0);
        
        $scope.shoots = resp.data.shoots;
        $scope.owned = resp.data.owned;
        $scope.loading = false;
     });

 })();

}]);

bootleggerApp.controller('edits',['$scope','$http','$sce','$localStorage','$timeout','$interval','socket', function ($scope, $http, $sce, $storage,$timeout,$interval,socket) {

	$scope.sources = [];
	$scope.playlist = [];
  $scope.loading = true;
 
  $scope.edit = {title:'',description:''};

 $scope.restartedit = function(id,event)
 {
   socket.post('/watch/restartedit/'+id).then(function(resp){
     //done
   });
   
   if(event){
      event.stopPropagation();
      event.preventDefault();
    }
 };

 $scope.formatDate = function(date){
          var dateOut = moment(date,'dd-MM-yyyy');
          return dateOut.toDate();
    };

 (function () {
   //usSpinnerService.spin('spinner-1');

   
   addthis.init();

   socket.on('edits',function(resp){
       //update the progress...
       for (var i=0;i<$scope.edits.length;i++)
       {
            if ($scope.edits[i].id == resp.data.edit.id)
            {
                $scope.edits[i] = resp.data.edit;
            }   
       }
   });

   // Using .success() and .error()
   socket.get('/watch/alledits/'+mastereventid)
     .then(function(resp){
        $scope.edits = resp.data;
        
        socket.post('/watch/editupdates',{edits:_.pluck($scope.edits,'id')}).then(function(resp){
            
        });

        $timeout(function () { 
            addthis.toolbox('.addthis_toolbox');
        }, 0);
        
        $scope.loading = false;
     });

 })();

}]);

function msToTime(s) {

  function addZ(n) {
    return (n<10? '0':'') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + ms;
}

function msToTimeS(s) {

  function addZ(n) {
    return (n<10? '0':'') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return addZ(mins) + ':' + addZ(secs);
}

bootleggerApp.controller('Media',['$scope','$http','$sce','$localStorage','$timeout','$interval','socket','$window', function ($scope, $http, $sce, $storage,$timeout,$interval,socket,$window) {

	$scope.sources = [];
    $scope.previewSources = [];
	$scope.playlist = [];
    $scope.currentedit = currenteditid;
    $scope.edit = {title:'',description:''};

  // $scope.random = function(){
  //   return 0.5 - Math.random();
  // };
	$scope.localstore = $storage;

  if ($scope.localstore == undefined || typeof($scope.localstore.firstrun_f) == 'undefined')
  {
    $('#myModal').modal('show');
    $scope.localstore.firstrun_f = true;
  }

  $scope.startdrag = function(el){
    //console.log(el.toElement.clientWidth);
    $('.vid_tmp').css('width',el.toElement.clientWidth + 'px');
  };

  $scope.findLargest = function()
  {
     var largest = _.max($('.animate-repeat'),function(f){
       return f.clientHeight;
     });
     if (largest.clientHeight)
      return largest.clientHeight;
     else
      return 100;
  };

  $scope.getClipLength = function(media)
  {
    if (media.meta.static_meta.clip_length)
    {
        var lena = media.meta.static_meta.clip_length.split(':');
        var time = (parseInt(lena[0])*3600) + (parseInt(lena[1])*60) + (parseFloat(lena[2]));
        return time * 10;
    }
    else
    {
      return 100;
    }
  };

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
  controller.APIPreview = null;
  

  $scope.inPlaylist = function(m)
  {
    return $scope.playlist.indexOf(m) != -1;
  }

  controller.onPlayerReady = function(API) {
    controller.API = API;
  };
  
  controller.onPlayerReadyPreview = function(API) {
    controller.APIPreview = API;
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
    if (index!=-1)
    {
        index++;
        if (index > $scope.playlist.length-1)
        index=0;

        if($scope.playlist.length > 0)
        $scope.previewThis($scope.playlist[index]);
    }
    else
    {
        $scope.previewThis($scope.isplaying);
    }
  }
  
  $scope.onCompleteVideoPreview = function()
  {
    //preview video finished -- do nothing...
  }


  $scope.mastersave = function()
  {
      $('#savedlg').modal('show');
  }

  $scope.save = function()
  {
    if ($scope.edit.title!='' && $scope.edit.description!='')
    {
      $http.post('/watch/saveedit/?apikey='+apikey,{id:$scope.currentedit,media:$scope.playlist,title:$scope.edit.title,description:$scope.edit.description}).success(function(data)
      {
        //done saving
        $scope.lastsavedat = new Date();
        $scope.currentedit = data.id;
        $window.location.href = '/watch';
        //$('#savedlg').modal('hide');
      });
    }
    else{
      $window.alert("Please enter a title and description");
    }
  };

  $scope.makeedit = function()
  {
    if ($scope.playlist.length > 1 && $scope.edit.title!='')
    {
      $http.post('/watch/newedit/'+mastereventid+'?apikey='+apikey,{id:$scope.currentedit,media:$scope.playlist,title:$scope.edit.title,description:$scope.edit.description}).success(function(data)
      {

        $scope.sharelink = data.edit.shortlink;
        $scope.$apply;
        $window.location.href = '/watch';
        //$('#share').modal('show');
        //$timeout(function(){
		$scope.edit = {title:'',description:''};

        //addthis.update('share', 'url', data.edit.shortlink);
        //addthis.update('share','title',data.edit.title);
        //addthis.url = data.edit.shortlink;
        //addthis.toolbox('.addthis_sharing_toolbox');
      });
    }
    else{
      $window.alert("Please enter a title and description");
    }
  };

  var stopTime = -1;
  var start = 0;
  var limit = 20;
//   var loading = false;
  $scope.media = [];

  var doing = false;

 (function () {

   
   if ($scope.currentedit)
   {
     socket.get('/watch/edit/'+$scope.currentedit)
     .then(function(resp){
        $scope.edit = resp.data;
        $scope.playlist = resp.data.media;
     });
   }

	 stopTime = $interval(function(){
	   $scope.loading = true;
	   // Using .then()
	   if (!doing)
	   {
	     doing = true;
	     socket.get('/watch/mediaforview/'+mastereventid + '?limit='+limit+'&skip='+(start*limit))
	       .then(function(resp){
	          $scope.media = $scope.media.concat(resp.data.media);
              $scope.publicview = resp.data.publicview;
              $scope.canshare = resp.data.canshare;
	          doing = false;
	          start++;
	          if (resp.data.media.length < limit)
	          {
	            $scope.loading = false;
	            $interval.cancel(stopTime);
	            shuffleArray($scope.media);
	             var x = 0;
	             for(var i in $scope.media)
	             {
	               $scope.media[i].order = i;
	               //console.log($scope.media[i].stars);
	             }
	          }
	       });
	   }
	 }, 5);
 })();

  $scope.remove = function(vid)
  {
    if ($scope.playlist.indexOf(vid)!= -1)
    {
      $scope.playlist.splice($scope.playlist.indexOf(vid), 1);
      $scope.onCompleteVideo();
      $scope.$apply;
    }
  };
  
  $scope.fmilis = function(mi)
  {
      if (!mi)
        return 0;
    var sp = mi.split(':');
    return ((sp[0] * 3600) + (sp[1] * 60) + sp[2]) * 1000;   
  };

  $scope.calcTime = function(m)
  {
      //go through the playlist up to this point, and get the 
      var index = $scope.playlist.indexOf(m);
      var i=0;
      var total = 0;
      while(i<=index)
      {
          total += $scope.fmilis($scope.playlist[i].outpoint) - $scope.fmilis($scope.playlist[i].inpoint);
          i++;
      }
      
    return msToTimeS(total); 
  };

  $scope.slider = {
    min: 100,
    max: 180,
    options: {
        onChange:function(id,model,max)
        {
            if ($scope.currenttrim.prev_min_value!= model)
            {
                $scope.currenttrim.prev_min_value = model;
                $scope.currentmedia.inpoint = msToTime(model);
                //skip to in point
                controller.APIPreview.seekTime($scope.currenttrim.prev_min_value/1000);
            }
            if ($scope.currenttrim.prev_max_value!=max)
            {
                $scope.currenttrim.prev_max_value = max;
                $scope.currentmedia.outpoint = msToTime(max);
                //skip to outpoint
                controller.APIPreview.seekTime($scope.currenttrim.prev_max_value/1000);                
            }
        },
        translate:function(value,id){
          return msToTimeS(value);
        },
        floor: 0,
        ceil: 450
        }
    };
    
  $scope.currenttrim = {
      prev_min_value:-1,
      prev_max_value:-1
  };

  $scope.updatetime = function(pos,dur)
  {
      //console.log("actual duration: "+ dur);
      $scope.slider.options.ceil = dur*1000;
      //skip back to start when over the outpoint:
      if ((pos*1000) > $scope.currenttrim.prev_max_value)
      {
          controller.APIPreview.seekTime($scope.currenttrim.prev_min_value/1000);
      }
  };
  
  $scope.updatetimeMain = function(pos,dur)
  {
      //if isplaying is in the playlist:
      if ($scope.playlist.indexOf($scope.isplaying)!= -1)
      {          
        //skip to next one:
        if ((pos*1000) > $scope.fmilis($scope.isplaying.outpoint))
        {
            //controller.API.seekTime($scope.fmills($scope.isplaying.outpoint)/1000);
            var index = $scope.playlist.indexOf($scope.isplaying);
            index++;
            if (index > $scope.playlist.length-1)
            index=0;

            if($scope.playlist.length > 0)
            {
                $scope.previewThis($scope.playlist[index]);
                controller.API.seekTime($scope.fmilis($scope.playlist[index].inpoint)/1000);
            }
        }
      }
  };
  
  $scope.calcWidth = function(m)
  {
      //TODO
      var total = 0;
      var i=0;
      while(i<$scope.playlist.length)
      {
          total += $scope.fmilis($scope.playlist[i].outpoint) - $scope.fmilis($scope.playlist[i].inpoint);
          i++;
      }
      
      return (($scope.fmilis(m.outpoint) - $scope.fmilis(m.inpoint))/total)*100 + "%";
  };

  $scope.currentmedia = null;

  $('#trimDlg').on('shown.bs.modal', function() {
    $timeout(function () {
        $scope.$broadcast('rzSliderForceRender');
      });
  });
  
  $('#trimDlg').on('hide.bs.modal', function() {
    controller.APIPreview.stop();
  });

  $scope.vidHeight = function()
  {
      return (($('#videopanel').width() /16)*9) + 'px';   
  };
  
  //$scope.windowsize = 0;
  
  angular.element($window).bind('resize', function(){
    //console.log('resize');
    $scope.$apply();
  });

  $scope.doTrim = function(m)
  {
      $('#trimDlg').modal('show');
      $scope.previewSources = [{src: $sce.trustAsResourceUrl(m.lowres), type: "video/mp4"}];
      $scope.slider.min = $scope.fmilis(m.inpoint);
      $scope.slider.max = (m.outpoint)?$scope.fmilis(m.outpoint): $scope.fmilis(m.meta.static_meta.clip_length);
      $scope.slider.options.ceil = (m.meta)?$scope.fmilis(m.meta.static_meta.clip_length) : $scope.fmilis(m.outpoint);
      controller.API.stop();
      $scope.currenttrim.prev_min_value  = $scope.slider.min;
      $scope.currenttrim.prev_max_value =  $scope.slider.max;
      $scope.currentmedia = m;
      
      //console.log("meta duration: " + $scope.fmilis(m.meta.static_meta.clip_length))
      
      $timeout(function(){
            controller.APIPreview.seekTime($scope.slider.min/1000);
            controller.APIPreview.play();
        }, 100);
  };

  $scope.addToPlaylist = function(vid) {
      //$scope.sources = [{src: $sce.trustAsResourceUrl(vid.lowres), type: "video/mp4"}];
      //$scope.isplaying = vid;
      var newvid = angular.copy(vid);
      if ($scope.playlist.indexOf(vid)== -1)
      {
          newvid.inpoint = '00:00:00.00';
          newvid.outpoint = newvid.meta.static_meta.clip_length;
        $scope.playlist.push(newvid);
      }
      $scope.$apply;
    };

    // $scope.readyToPlay = function()
    // {
    //     controller.API.seekTime($scope.fmilis($scope.isplaying.inpoint)/1000);
    //     controller.API.play();
    // };

    // $scope.changesource = function(source)
    // {
    //     console.log(source);
    // };

    $scope.previewThis = function(vid) {
        $scope.sources = [{src: $sce.trustAsResourceUrl(vid.lowres), type: "video/mp4"}];
        $scope.isplaying = vid;
        
        //controller.API.play();
        $timeout(function(){
            //
            controller.API.seekTime($scope.fmilis($scope.isplaying.inpoint)/1000);
            controller.API.play();
            //controller.API.play.bind(controller.API);
        }, 100);
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

    socket.post('/media/star', {id:shot.id,star:shot.stars[$scope.username]!=undefined},function(result){

    });
  }

  $scope.format = function(shot)
  {
      if (shot.user)
        return "By " + shot.user.profile.displayName + " on " + shot.meta.static_meta.captured_at;
      else
        return "";
  };
}]);
