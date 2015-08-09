'use strict';


var adminApp = angular.module('adminApp', [
      "ngSanitize",
      'ngLoadingSpinner',
      'ngAnimate',
      'angularSails.io',
      'ui.slider',
      'ui.bootstrap',
      'checklist-model',
      'ui.inflector',
      'ui.format',
      'ui.sortable',
      'frapontillo.bootstrap-switch'
    ]);

adminApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);



adminApp.controller('admin',['$scope','socket','$timeout','$sce','usSpinnerService','$interval','$filter','$rootScope', function ($scope,socket,$timeout,$sce,usSpinnerService,$interval,$filter,$rootScope) {

  $scope.search = {$:''};

  $scope.tabs = {
    tab0:true,
    tab1:false,
    tab2:false
  };

  $scope.loading_users = true;
  $scope.loading_shoots = true;

  $scope.predicate = 'profile.displayName';
  $scope.reverse = true;
  $scope.order = function(predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };

  $scope.predicatee = 'name';
  $scope.reversee = false;
  $scope.ordere = function(predicate) {
    $scope.reversee = ($scope.predicatee === predicate) ? !$scope.reversee : false;
    $scope.predicatee = predicate;
  };

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

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
    socket.get('/event/admin_events/')
      .then(function(resp){
         $scope.events = resp.data.events;
         $scope.loading_shoots = false;
      });

      socket.get('/event/admin_users/')
        .then(function(resp){
           $scope.users = resp.data.users;
           $scope.loading_users = false;
        });
  })();




}]);
