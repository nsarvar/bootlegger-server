'use strict';

bootleggerApp.controller('apisignup',['$scope','$http','socket','$interval', function ($scope, $http,socket,$interval) {
 
    $scope.loading = true;
    
    
  $scope.refresh = function()
  {
    $scope.loading = true;
    socket.get('/api/newkey').then(function(resp)
    {
        //$scope.loading = false;
        $scope.lastsaved = 'last updated '+ moment().calendar();
        $scope.getkey();
    });
  };
  
  $scope.signup = function()
  {
    $scope.loading = true;
    socket.get('/api/activate').then(function(resp)
    {
        //$scope.loading = false;
        $scope.lastsaved = 'last updated '+moment().calendar();
        $scope.getkey();
    });
  };
  
  $scope.update = function()
  {
    $scope.loading = true;
    socket.post('/api/updateapi',{apitype:$scope.apikey.apitype, callbackfunction:$scope.apikey.callbackfunction, redirecturl:$scope.apikey.redirecturl}).then(function(resp)
    {
      $scope.lastsaved = 'last updated '+moment().calendar();
      $scope.getkey();
    });
  };
  
  $scope.getkey = function()
  {
          socket.get('/event/me').then(function(resp){
          if (resp.data.apikey)
          {
            $scope.apikey = resp.data.apikey;
          }
          
          $scope.loading = false;
      });
  };

    (function () {
        $scope.getkey();
    })();
}]);