'use strict';

// var dashboardApp = angular.module('dashboardApp', [
//       "ngSanitize",
//       'ngLoadingSpinner',
//       'ngAnimate',
//       'angularSails.io',
//       'ui.slider',
//       'ui.bootstrap',
//       'ui.inflector',
//       'ui.format',
//       'ui.sortable',
//        'ui.knob'
//     ]);

// bootleggerApp.factory('socket',['$sailsSocket', function($sailsSocket){
//       return $sailsSocket();
//   }]);

bootleggerApp.controller('dashboard',['$scope','socket','$timeout','$sce','usSpinnerService','$interval','$filter','$rootScope','$http', function ($scope,socket,$timeout,$sce,usSpinnerService,$interval,$filter,$rootScope,$http) {

  $scope.loading = true;

  //  socket.connect().then(function(sock){
  //   console.log('connected',sock)
  // },function(err){
  //     console.log('connection error',err)
  // },function(not){
  //     console.log('connection update',not)
  // });

 $scope.formatDate = function(date){
          var dateOut = moment(date,'dd-MM-yyyy');
          return dateOut.toDate();
    };

  addthis.init();

  (function () {
    socket.get('/event/myeventsowned/')
      .then(function(resp){
          var events = [];
          _.each(resp.data,function(e)
            {
              if (!e.group && e.status=='OWNER')
              {
                events.push(e);
              }
              else{
                _.each(e.events,function(f){
                  if (f.status=='OWNER')
                    events.push(f);
                });
              }
            });
         $scope.events = events;
         $timeout(function () { 
             addthis.toolbox('.addthis_toolbox');
              }, 0);
         
         $scope.loading = false;
      });
  })();
}]);
