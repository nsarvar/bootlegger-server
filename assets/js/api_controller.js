'use strict';

// var apiApp = angular.module('apiApp', [
//       "ngSanitize",
//       'ui.bootstrap',
//       'angularSails.io',
//     ]);

// apiApp.factory('socket',['$sailsSocket', function($sailsSocket){
//       return $sailsSocket();
//   }]);


bootleggerApp.controller('apisignup',['$scope','$http','socket','$interval', function ($scope, $http,socket,$interval) {
 
    $scope.loading = true;
    
    
  $scope.refresh = function()
  {
    $scope.loading = true;
    socket.get('/api/newkey').then(function(resp)
    {
        $scope.loading = false;
        $scope.lastsaved = 'last updated '+ moment().calendar();
    });
  };
  
  $scope.signup = function()
  {
    $scope.loading = false;
    socket.get('/api/activate').then(function(resp)
    {
      
    $scope.loading = false;
    $scope.lastsaved = 'last updated '+moment().calendar();
    });
  };
  
  $scope.update = function()
  {
    $scope.loading = false;
    socket.post('/api/updateapi',{apitype:$scope.apikey.apitype, callbackfunction:$scope.apikey.callbackfunction, redirecturl:$scope.apikey.redirecturl}).then(function(resp)
    {
      $scope.loading = false;
      $scope.lastsaved = 'last updated '+moment().calendar();
    });
  };
    
    // socket.connect().then(function(sock){
    //  console.log('connected',sock)
    // },function(err){
    //    console.log('connection error',err)
    // },function(not){
    //    console.log('connection update',not)
    // });

    (function () {

      socket.get('/event/me').then(function(resp){
        //console.log(data);
        //if (!resp.data.apiaccess)
        //{
          //$('#doit').show();
          //return;
        //}
        //if (data.apiaccess == 'live')
        //{
          //$('#live').show();
          //$('#key').text(data.apikey);
          if (resp.data.apikey)
          {
            $scope.apikey = resp.data.apikey;
            //$scope.apiaccess = resp.data.apiacces;
            //$scope.apitype = resp.data.apitype;
            //$scope.redirecturl = resp.data.redirecturl;
            //$scope.callbackfunction = resp.data.callbackfunction;
          }
          
          $scope.loading = false;
        //}
        //if (data.apiaccess == 'locked')
        //{
          // $('#locked').show();
        //}
      });

      // socket.get('/log/subscribe').then(function(resp){
      //     //subscribed
      // });

    })();
}]);