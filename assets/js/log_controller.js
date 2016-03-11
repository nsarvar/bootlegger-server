'use strict';

// var logApp = angular.module('logApp', [
//       "ngSanitize",
//       'ngLoadingSpinner',
//       'ngAnimate',
//       'ui.grid',
//       'ui.grid.pagination',
//       'ui.grid.moveColumns',
//       'ui.grid.resizeColumns',
//       'angularUtils.directives.dirPagination',
//       'ui.bootstrap',
//       'angularSails.io',
//     ]);

// logApp.factory('socket',['$sailsSocket', function($sailsSocket){
//       return $sailsSocket();
//   }]);
  
bootleggerApp.filter('testFilter', function() {
    return function( items, params ) {
        var filtered = [];
        if (params.val == undefined || params.val.length == 0)
          return items;
        // If time is with the range
        var terms = params.val.split(',');
        
        angular.forEach(items, function(item) {
          var str = JSON.stringify(item).toLowerCase();
          var push = true;
          _.each(terms,function(t){
            if (_.contains(str,t.trim()))
              push = false;  
           })
           if (push)
            filtered.push(item);
        });
        return filtered;
    };
});


bootleggerApp.controller('Log',['$scope','$http','uiGridConstants','socket','$interval', function ($scope, $http, uiGridConstants,socket,$interval) {

// $scope.gridOptions = {
//     paginationPageSizes: [50, 100, 200],
//     paginationPageSize: 50,
//     enableFiltering:true,
//     enableColumnResizing: true,
//     columnDefs: [
//       { name: 'timestamp',cellFilter : "date:'medium'"},
//       { name: 'message',displayName:'message',filter:{condition: uiGridConstants.filter.CONTAINS}},
//       { name: 'msg',displayName:'Message',filter:{condition: uiGridConstants.filter.CONTAINS}},
//       { name:'hostname',displayName:'Host'},
//       { name:'userid',filter:{condition: uiGridConstants.filter.CONTAINS}},
//       { name:'meta',filter:{condition: uiGridConstants.filter.CONTAINS}}
//     ]
//   };

  $scope.filterObject = {};
  $scope.filterObjectNeg = {};
  $scope.orderObject = '-timestamp';
  var stopTime = -1;
  var start = 0;
  var limit = 400;
  $scope.backlog = 10000;
  $scope.alldata = [];

  $scope.remfilter = function(key)
  {
    delete $scope.filterObject[key];
  }

  if (typeof(mastereventid) != 'undefined')
    $scope.theid = mastereventid;

    var doing = false;

    //  if (typeof mastereventid != 'undefined')
      // {
      //   $http.get('/log/getlog/'+mastereventid).success(function(data) {
      //     $scope.alldata = data;
      //   });
      // }
      // else
      // {
      //   $http.get('/log/getall/').success(function(data) {
      //     $scope.alldata = data;
      //   });
      // }

    // socket.connect().then(function(sock){
    //  console.log('connected',sock)
    // },function(err){
    //    console.log('connection error',err)
    // },function(not){
    //    console.log('connection update',not)
    // });

    (function () {

      socket.get('/log/subscribe').then(function(resp){
          //subscribed
      });

      socket.on('log',function(resp){
          //console.log(resp.data);
          $scope.alldata.push(resp.data);
      });

     stopTime = $interval(function(){
       $scope.loading = true;
       // Using .then()
       if (!doing && typeof mastereventid == 'undefined')
       {
         doing = true;
         socket.get('/log/getall/' + '?limit='+limit+'&skip='+(start*limit))
           .then(function(resp){
              $scope.alldata = $scope.alldata.concat(resp.data);
              doing = false;
              start++;
              if (resp.data.length < limit || $scope.alldata.length >   $scope.backlog)
              {
                $scope.loading = false;
                $interval.cancel(stopTime);
              }
           });
       }
       else if(!doing) {
         doing = true;
         socket.get('/log/getlog/'+masteruserid + '?limit='+limit+'&skip='+(start*limit))
           .then(function(resp){
              $scope.alldata = $scope.alldata.concat(resp.data);
              doing = false;
              start++;
              if (resp.data.length < limit || $scope.alldata.length >   $scope.backlog)
              {
                $scope.loading = false;
                $interval.cancel(stopTime);
              }
           });
       }
     }, 10);
    })();




}]);

//
// var shotApp = angular.module('shotApp', [
//       "ngSanitize",
//       'ngLoadingSpinner'
//     ]);
//
// shotApp.controller('Event',['$scope','$http','$sce', function ($scope, $http, $sce) {
//
//   $http.get('/commission/info/'+mastereventid).success(function(data) {
//     $scope.event = data;
//   });
//
//   $scope.hide=function(shot)
//   {
//     shot.hidden = !shot.hidden;
//   }
//
//   $scope.clone=function(shot)
//   {
//     var newone = angular.copy(shot);
//     newone.isnew = true;
//     delete newone.footage;
//     var maxnum = -1;
//     for (var i in $scope.event.eventtype.shot_types)
//     {
//       if ($scope.event.eventtype.shot_types[i].id > maxnum)
//         maxnum = $scope.event.eventtype.shot_types[i].id;
//     }
//     newone.id = maxnum++;
//     $scope.event.eventtype.shot_types.unshift(newone);
//   }
//
//   $scope.save=function()
//   {
//     //save current data:
//     $http.post('/commission/updateshots', {id:$scope.event.id,shots:$scope.event.eventtype.shot_types}).
//     success(function(data, status, headers, config) {
//       for (var i in $scope.event.eventtype.shot_types)
//       {
//        delete $scope.event.eventtype.shot_types[i].isnew;
//       }
//       $scope.success = true;
//       delete $scope.error;
//       setTimeout(function(){
//         delete $scope.success;
//         $scope.$apply();
//       },2000);
//     }).
//     error(function(data, status, headers, config) {
//       delete $scope.success;
//       $scope.error = true;
//       setTimeout(function(){
//         delete $scope.error;
//         $scope.$apply();
//       },2000);
//     });
//   }
//   $scope.remove=function(m)
//   {
//     $scope.event.eventtype.shot_types.splice( $scope.event.eventtype.shot_types.indexOf(m), 1);
//   }
// }]);
