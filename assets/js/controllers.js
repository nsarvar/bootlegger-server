'use strict';
var watchApp = angular.module('watchApp', [
			"ngSanitize",
			"com.2fdevs.videogular",
		]);

watchApp.controller('Media',['$scope','$http','$sce', function ($scope, $http, $sce) {

	$scope.sources = [];

	$scope.playlist = [];

  $http.get('/media/event/'+mastereventid).success(function(data) {
    $scope.media = data;
  });

  $scope.playThis = function(vid) {
      $scope.sources = [{src: $sce.trustAsResourceUrl('https://d3sk3ws0lv07ah.cloudfront.net/upload/' + vid.path), type: "video/mp4"}];
      $scope.playlist.push(vid);
      $scope.$apply;
      console.log($scope.playlist);
    };
}]);