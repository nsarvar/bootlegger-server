'use strict';

bootleggerApp.controller('admin',['$scope','socket','$timeout','$sce','usSpinnerService','$interval','$filter','$rootScope', function ($scope,socket,$timeout,$sce,usSpinnerService,$interval,$filter,$rootScope) {

  $scope.search = {$:''};

  $scope.tabs = {
    tab0:false,
    tab1:false,
    tab2:false,
    tab3:false
  };

  $scope.loading_users = false;
  $scope.loading_shoots = false;
  $scope.loading_edits = false;

  if (window.location.hash && parseInt(window.location.hash.substring(1)) < 3)
  {
    $scope.tabs['tab'+window.location.hash.substring(1)] = true;
  }

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

  $scope.restart = function(edit)
  {
    socket.get('/watch/restartedit/'+edit).then(function(resp){
      console.log('edit restarted');
    });
  };

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
  
  $scope.showedits = function(){
      history.pushState(null, null, '#0');
      $scope.loading_edits = true;
      socket.get('/event/admin_edits/')
        .then(function(resp){
           $scope.edits = resp.data.edits;
           $scope.loading_edits = false;
        });
  };
  
  $scope.showshoots = function(){
      history.pushState(null, null, '#1');
      $scope.loading_shoots = true;
      socket.get('/event/admin_events/')
        .then(function(resp){
           $scope.events = resp.data.events;
           $scope.loading_shoots = false;
        });
  };
  
  $scope.showusers = function(){
      history.pushState(null, null, '#2');
      $scope.loading_users = true;
      socket.get('/event/admin_users/')
        .then(function(resp){
           $scope.users = resp.data.users;
           $scope.loading_users = false;
        });
  };

  //(function () {
    //usSpinnerService.spin('spinner-1');

    // Using .success() and .error()
    // socket.get('/event/admin_events/')
    //   .then(function(resp){
    //      $scope.events = resp.data.events;
    //      $scope.loading_shoots = false;
    //   });

    //   socket.get('/event/admin_users/')
    //     .then(function(resp){
    //        $scope.users = resp.data.users;
    //        $scope.loading_users = false;
    //     });
        

  //})();
}]);
