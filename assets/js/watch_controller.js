'use strict';

var watchApp = angular.module('watchApp', [
			"ngSanitize",
			"com.2fdevs.videogular",
      'ngLoadingSpinner',
      'angularSails.io',
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

// watchApp.controller('ModalInstanceCtrl', ['$scope','$modalInstance',function ($scope, $modalInstance, sharelink) {
//   $scope.sharelink = sharelink;

//   $scope.cancel = function () {
//     $modalInstance.dismiss('cancel');
//   };
// }]);

watchApp.filter('isMine', function() {
    return function( items, params ) {
      //console.log(params);
        var filtered = [];
        // If time is with the range
        angular.forEach(items, function(item) {
          if ((params && item.created_by==params.value || !params))
            filtered.push(item);
        });
        return filtered;
    };
});

watchApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);

watchApp.controller('list',['$scope','$http','$sce','$localStorage','$timeout','$interval','socket', function ($scope, $http, $sce, $storage,$timeout,$interval,socket) {

	$scope.sources = [];
	$scope.playlist = [];
$scope.loading = true;

  socket.connect().then(function(sock){
   console.log('connected',sock)
 },function(err){
     console.log('connection error',err)
 },function(not){
     console.log('connection update',not)
 });

 (function () {
   //usSpinnerService.spin('spinner-1');

   // Using .success() and .error()
   socket.get('/watch/mymedia/')
     .then(function(resp){
        $scope.edits = resp.data.edits;
        $scope.shoots = resp.data.shoots;
        $scope.loading = false;
     });

 })();

}]);



watchApp.controller('Media',['$scope','$http','$sce','$localStorage','$timeout','$interval','socket', function ($scope, $http, $sce, $storage,$timeout,$interval,socket) {

	$scope.sources = [];
	$scope.playlist = [];

  // $scope.random = function(){
  //   return 0.5 - Math.random();
  // };
	$scope.localstore = $storage;

  if ($scope.localstore == undefined || typeof($scope.localstore.firstrun_f) == 'undefined')
  {
    $('#myModal').modal('show');
    $scope.localstore.firstrun_f = true;
  }

  $scope.findLargest = function()
  {
     var largest = _.max($('.animate-repeat'),function(f){
       return f.clientHeight;
     });
     if (largest.clientHeight)
      return largest.clientHeight;
     else
      return 100;
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

	$scope.edit = {title:'',description:''};

  $scope.makeedit = function()
  {
    if ($scope.playlist.length > 1 && $scope.edit.title!='')
    {
      $http.post('/watch/newedit/'+mastereventid+'?apikey='+apikey,{media:$scope.playlist,title:$scope.edit.title,description:$scope.edit.description}).success(function(data)
      {

        $scope.sharelink = data.edit.shortlink;
        $scope.$apply;
        $('#share').modal('show');
        //$timeout(function(){
				$scope.edit = {title:'',description:''};

        addthis.update('share', 'url', data.edit.shortlink);
				addthis.update('share','title',data.edit.title);
        addthis.url = data.edit.shortlink;
        addthis.toolbox('.addthis_sharing_toolbox');
          //addthis.layers.refresh();
        //},0,false);
        //$scope.open('sm');
      });
    }
  };

  var stopTime = -1;
  var start = 0;
  var limit = 20;
  var loading = false;
  $scope.media = [];

  var doing = false;



	socket.connect().then(function(sock){
	 console.log('connected',sock)
 },function(err){
		 console.log('connection error',err)
 },function(not){
		 console.log('connection update',not)
 });

 (function () {
	 //usSpinnerService.spin('spinner-1');

	 socket.get('/media/totals/'+mastereventid).then(function(resp) {
		 $scope.totals = resp.data;
	 });

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
	               $scope.media[i].order = x;
	               //console.log($scope.media[i].stars);
	             }
	          }
	       });
	   }
	 }, 10);
 })();

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
