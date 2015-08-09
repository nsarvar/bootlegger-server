'use strict';

var dashboardApp = angular.module('dashboardApp', [
      "ngSanitize",
      'ngLoadingSpinner',
      'ngAnimate',
      'angularSails.io',
      'ui.slider',
      'ui.bootstrap',
      'ui.inflector',
      'ui.format',
      'ui.sortable',
       'ui.knob'
    ]);

dashboardApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);

dashboardApp.controller('dashboard',['$scope','socket','$timeout','$sce','usSpinnerService','$interval','$filter','$rootScope','$http', function ($scope,socket,$timeout,$sce,usSpinnerService,$interval,$filter,$rootScope,$http) {

  $scope.loading = true;

   socket.connect().then(function(sock){
    console.log('connected',sock)
  },function(err){
      console.log('connection error',err)
  },function(not){
      console.log('connection update',not)
  });

  (function () {
    socket.get('/event/myevents/')
      .then(function(resp){
          var events = [];
          _.each(resp.data.myevents,function(e)
            {
              if (!e.group)
              {
                events.push(e);
              }
              else{
                _.each(e.events,function(f){
                  events.push(f);
                });
              }
            });
         $scope.events = events;
         $scope.loading = false;
      });
  })();
}]);
