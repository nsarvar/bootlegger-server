'use strict';

function getProperty(obj, prop) {
    var parts = prop.split('.'),
        last = parts.pop(),
        l = parts.length,
        i = 1,
        current = parts[0];

    while((obj = obj[current]) && i < l) {
        current = parts[i];
        i++;
    }

    if(obj) {
        return obj[last];
    }
}

// var commissionApp = angular.module('commissionApp', [
//       "ngSanitize",
//       'ngLoadingSpinner',
//       'ngAnimate',
//       'angularSails.io',
//       'ui.slider',
//       'ui.bootstrap',
//       'checklist-model',
//       'ui.inflector',
//       'ui.format',
//       'ui.sortable',
//       'frapontillo.bootstrap-switch'
//     ]);

// commissionApp.factory('socket',['$sailsSocket', function($sailsSocket){
//       return $sailsSocket();
//   }]);

bootleggerApp.filter('shotvalue', function() {
  return function(input) {
    var matches = input.match(/%%(.*?)%%?/g);
    angular.forEach(matches, function(value, key) {
      input = input.replace(value,'<span class="badge badge-success">'+value.replace(/%%/g,'')+'</span>')
    });
    return input;
  };
});

bootleggerApp.filter('filterObject', function() {
    return function(items, search) {
        var filtered = {};

        angular.forEach(items, function(item, key) {
            if (item.name.toLowerCase().indexOf(search) != -1) {
                filtered[key] = item;
            }
        });

        return filtered;
    };
});

// commissionApp.filter('checkFilter', function() {
//     return function( items, params ) {
//         var filtered = [];
//         if (params.value == undefined || params.value.length == 0)
//           return items;
//         // If time is with the range
//         angular.forEach(items, function(item) {
//           if (_.contains(params.value,getProperty(item, params.name)))
//             filtered.push(item);
//         });
//         return filtered;
//     };
// });


bootleggerApp.controller('commission',['$scope','socket','$timeout','$sce','usSpinnerService','$interval','$filter','$rootScope', function ($scope,socket,$timeout,$sce,usSpinnerService,$interval,$filter,$rootScope) {

  $scope.showmsg = false;

  window.onbeforeunload = function(e) {
    if ($scope.showmsg)
      return "Are you sure you want to leave this page? Changes are not auto-saved!";
    else
      return;
  };

  $scope.$watch("event", function(newValue, oldValue) {
    if (newValue!=null && oldValue!=null)
      $scope.showmsg = true;
  },true);



  // $scope.$watch($('#editor').cleanHtml(), function(newValue, oldValue) {
  //   if (newValue!=null && oldValue!=null)
  //     showmsg = true;
  // });

  $scope.loading = true;
  $scope.event = null;
  $scope.rolefilter="";
  $scope.coveragefilter="";
  $scope.phasefilter = "";

  $scope.selection = {currentphase: null, currentrole:null};
  $scope.tabs = {
    tab1:true,
    tab2:false
  };

  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

  if (window.location.hash && parseInt(window.location.hash.substring(1)) < 3)
  {
    $scope.tabs['tab'+window.location.hash.substring(1)] = true;
  }

  $scope.resetshootmodules = function(codename)
  {
    if (codename=='autodirector')
      $scope.event.offline = false;
    
    angular.forEach($scope.event.shoot_modules,function(v,k)
    {
      if (codename!=k)
        $scope.event.shoot_modules[k] = '0';
    });
    
    var alloff = 0;
    angular.forEach($scope.event.shoot_modules,function(v,k)
    {
        alloff += ($scope.event.shoot_modules[k] != '0')?1:0;
    });
    if (alloff==0)
      $scope.event.shoot_modules[_.first(_.without(_.keys($scope.event.shoot_modules),codename))] = "1";
      
  }

  $scope.addrole = function()
  {
    var index = (parseInt(_.max(_.pluck($scope.event.roles,'id'))) + 1) || 0;
    $scope.event.roles.unshift({id:index,name:'New Role',description:'',shot_ids:[],editing:true});
  }

  $scope.stopEditing = function(obj)
  {
    delete obj.editing;
  }


  $scope.addphase = function()
  {
    if (!$scope.event.phases)
      $scope.event.phases = [];

    var index = parseInt(_.max(_.pluck($scope.event.phases,'id'))) + 1;
     $scope.event.phases.unshift({id:index,name:'New Phase',description:'',roles:[],editing:true});
  }

  $scope.addcoverage = function()
  {
    var index = parseInt(_.max(_.keys($scope.event.coverage_classes))) + 1;
    $scope.event.coverage_classes[index] = {name:'New Subject',items:[],editing:true};
  }

  $scope.updatetab = function(tab)
  {
    history.pushState(null, null, '#'+tab);
  }

  $scope.addtocoverage = function(m,event)
  {
    if ($scope.selection.currentcoverage!=null)
    {
      m.coverage_class = parseInt($scope.selection.currentcoverage);
    }
    if(event){
      event.stopPropagation();
      event.preventDefault();
    }
  }

  $scope.takefromcoverage = function(m,event)
  {
    if ($scope.selection.currentcoverage!=null)
    {
      delete m.coverage_class;
    }
    if(event){
      event.stopPropagation();
      event.preventDefault();
    }
  }

  $scope.addtophase = function(role,event)
  {
    if ($scope.selection.currentphase)
    {
      if ($scope.selection.currentphase.roles==null)
        $scope.selection.currentphase.roles = new Array();
      $scope.selection.currentphase.roles.push(role);
    }
    if(event){
      event.stopPropagation();
      event.preventDefault();
    }
  }

  $scope.takefromphase = function(role,event)
  {
    if ($scope.selection.currentphase)
    {
      if ($scope.selection.currentphase.roles==null)
        $scope.selection.currentphase.roles = new Array();
      $scope.selection.currentphase.roles = _.pull($scope.selection.currentphase.roles, role);
    }
    if(event){
      event.stopPropagation();
      event.preventDefault();
    }
  }

  $scope.addtorole = function(shot)
  {
    if ($scope.selection.currentrole)
    {
      $scope.selection.currentrole.shot_ids.push(shot);
    }
  }

  $scope.takefromrole = function(shot)
  {
    if ($scope.selection.currentrole)
    {
      $scope.selection.currentrole.shot_ids = _.pull($scope.selection.currentrole.shot_ids, shot);
    }
  }

  $scope.totalShots = function(role)
  {
    var count = 0;
    _.each(role.shot_ids,function(i){
      //for each shot -- count number asked for:
      var shot = _.find($scope.event.shot_types,{id:i});
      count += shot.wanted;
    });
    return count;
  }

  $scope.totalMins = function()
  {
    //max_length * wanted for each shot in a role
    if (!$scope.event)
      return 0;
    var total = 0;
    _.each($scope.event.roles,function(r)
    {
      _.each(r.shot_ids, function(s)
      {
        var ss = _.find($scope.event.shot_types,{id:s});
        if (ss)
          total += parseInt(ss.wanted ? ss.wanted : 0) * parseInt(ss.max_length);
      });
    });
    return total / 60;
  }

  $scope.totalPer5=function()
  {
    return $scope.minsPerPerson()*0.3*5;
  }

  $scope.totalShotsPer5=function()
  {
    return $scope.totalShots()*0.3*5;
  }

  $scope.totalShots = function()
  {
    if (!$scope.event)
      return 0;
    var total = 0;
    _.each($scope.event.roles,function(r)
    {
      _.each(r.shot_ids, function(s)
      {
        var ss = _.find($scope.event.shot_types,{id:s});
        if (ss)
          total += parseInt(ss.wanted ? ss.wanted : 0);
      });
    });
    return total;
  }

  $scope.avgClipLength = function()
  {
    if (!$scope.event)
      return 0;
    var total = 0;
    _.each($scope.event.shot_types,function(s)
    {
      total += parseInt(s.max_length);
    });
    return total / $scope.event.shot_types.length;
  }

  $scope.minsPerPerson = function()
  {
    if ($scope.event==null)
      return 0;
    return $scope.totalMins() / $scope.event.roles.length;
  }

  $scope.shotsforcoverage = function(c)
  {
    if ($scope.event==null)
      return 0;
    var count = 0;
    _.each($scope.event.shot_types,function(s)
    {
      if (s.coverage_class == c)
        count++;
    });
    return count;
  }

  $scope.picCount = function(role)
  {
    if (!$scope.event)
      return 0;

     var count = 0;
    if (role==null)
    {

      _.each($scope.event.shot_types,function(s)
      {
        if (s.shot_type=='PHOTO')
          count++;
      });
      return (count / $scope.event.shot_types.length) *100;
    }
    else
    {
      _.each($scope.event.shot_types,function(s)
      {
        if (s.shot_type=='PHOTO' && _.contains(_.find($scope.event.roles,{id:role}).shot_ids,s.id))
          count++;
      });
      //console.log(count +" shots in role from main list, shots in role from role "+$scope.event.roles[role].shot_ids.length);
      //console.log((count / $scope.event.roles[role].shot_ids.length) *100 + " photo");
      return (count / _.find($scope.event.roles,{id:role}).shot_ids.length) *100;
    }
  }

  $scope.vidCount = function(role)
  {
    if (!$scope.event)
      return 100;

    var count = 0;
    if (role==null)
    {

      _.each($scope.event.shot_types,function(s)
      {
        if (s.shot_type=='VIDEO' || !s.shot_type)
          count++;
      });
      return (count / $scope.event.shot_types.length) *100;
    }
    else
    {
      _.each($scope.event.shot_types,function(s)
      {

        if ((s.shot_type=='VIDEO' || s.shot_type==undefined) && _.contains(_.find($scope.event.roles,{id:role}).shot_ids,s.id))
        {
          //console.log(s.shot_type);
          count++;
        }
      });
      //console.log((count / $scope.event.roles[role].shot_ids.length) *100 + " video");
      //console.log(count +" shots in role from main list, shots in role from role "+$scope.event.roles[role].shot_ids.length);
      return (count / _.find($scope.event.roles,{id:role}).shot_ids.length) *100;
    }
  }

  $scope.audCount = function(role)
  {
    if (!$scope.event)
      return 0;
    var count = 0;
    if (role==null)
    {

      _.each($scope.event.shot_types,function(s)
      {
        if (s.shot_type=='AUDIO')
          count++;
      });
      return (count / $scope.event.shot_types.length) *100;
    }
    else
    {
      _.each($scope.event.shot_types,function(s)
      {
        if (s.shot_type=='AUDIO' && _.contains(_.find($scope.event.roles,{id:role}).shot_ids,s.id))
          count++;
      });
      //console.log((count / $scope.event.roles[role].shot_ids.length) *100 + " audio");
      //console.log(count +" shots in role from main list, shots in role from role "+$scope.event.roles[role].shot_ids.length);
      return (count / _.find($scope.event.roles,{id:role}).shot_ids.length) *100;
    }

  }

  $scope.removeRole = function(role)
  {
    _.remove($scope.event.roles,function(r){
      return r.id == role;
    });
  }

  $scope.removePhase = function(phase)
  {
    $scope.event.phases.splice(phase,1);
  }

  $scope.removeCoverage = function(c)
  {
    _.each($scope.event.shot_types,function(s)
    {
      if (s.coverage_class == c)
        delete s.coverage_class;
    });
    delete $scope.event.coverage_classes[c];
  }


  $scope.inCoverage = function(m)
  {
    if ($scope.selection.currentcoverage!=null)
      return m.coverage_class == parseInt($scope.selection.currentcoverage);
    else
      return false;
  }

  $scope.inRole = function(m)
  {
    if ($scope.selection.currentrole)
      return _.contains($scope.selection.currentrole.shot_ids,m.id);
    else
      return false;
  }

  $scope.inPhase = function(r)
  {
    if ($scope.selection.currentphase)
      return _.contains($scope.selection.currentphase.roles,r.id);
    else
      return false;
  }

  $scope.addshot = function(m)
  {
    var newone = angular.copy(m);
    newone.footage = 0;
    var maxnum = {id:-1};
    if ($scope.event.shot_types.length>0)
      maxnum = _.max($scope.event.shot_types, 'id');
    newone.id = maxnum.id+1;
    $scope.event.shot_types.push(newone);
    $('#allshotsdialog').modal('hide');
    $scope.reconcile();
  }

  $scope.remove=function(m)
  {
    //only allow removal if there are no shots been used:
    if (m.footage == 0)
    {
      $scope.event.shot_types.splice($scope.event.shot_types.indexOf(m), 1);
      $scope.reconcile();
    }
  }

  $scope.clone=function(shot)
  {
    var newone = angular.copy(shot);

    var maxnum = -1;
    // for (var i in $scope.event.shot_types)
    // {
    //   if ($scope.event.shot_types[i].id > maxnum)
    //     maxnum = $scope.event.shot_types[i].id;
    // }
    maxnum = _.max($scope.event.shot_types, 'id');
    newone.id = maxnum.id+1;
    newone.footage = 0;
    $scope.event.shot_types.push(newone);
  }

  $scope.showallshots = function()
  {
    $('#allshotsdialog').modal('show');
  }

  $scope.updatecodename = function()
  {
    $scope.event.codename=$filter('inflector')($scope.event.name,'underscore');
  }

  $scope.reconcile = function()
  {
    //reconcile shots and ids

    var mapping = {};

    _.each($scope.event.shot_types,function(s,index){
      //s.tmpid = 'x'+s.id;
      mapping[''+s.id] = index;
      s.id = index;
    });

    _.each($scope.event.roles,function(role){
        //replace shot_ids with tmps
        var tmparr = [];
        _.each(role.shot_ids,function(r){
          if (typeof mapping[r] != 'undefined')
            tmparr.push(mapping[r]);
        });
        role.shot_ids = tmparr;
    });
       //console.log($scope.event.shot_types);
       //$scope.$apply();
       
       //fix role img:
       
       if ($scope.event.hasroleimg==false)
         delete $scope.event.roleimg;
  }


  $scope.save = function()
  {
    $scope.reconcile();
    _.each($scope.event.roles,function(r)
    {
      delete r.editing;
    });
    
    console.log($scope.event.phases);
    
    _.each($scope.event.phases,function(r)
    {
      console.log(r);
      delete r.editing;
    });
    
    _.each($scope.event.coverage_classes,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.shot_types,function(r)
    {
      delete r.editing;
    });

    $scope.event.shotrelease = $('#editor').cleanHtml();

    if ($scope.event.roleimg === false)
      delete $scope.event.roleimg;

    socket.post('/commission/update/'+mastereventid,{eventtype:$scope.event})
      .then(function(resp){
        $scope.success = true;
        $scope.showmsg = false;
        $scope.lastsavedat = new Date();
         setTimeout(function(){
          delete $scope.success;
        },2000);
      });
  }

  $scope.savetoreuse = function()
  {
    $scope.reconcile();
    _.each($scope.event.roles,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.phases,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.coverage_classes,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.shot_types,function(r)
    {
      delete r.editing;
    });

      $scope.event.shotrelease = $('#editor').cleanHtml();

      if ($scope.event.roleimg === false)
        delete $scope.event.roleimg;

    socket.post('/commission/savetoreuse/'+mastereventid,{eventtype:$scope.event})
      .then(function(resp){
        $scope.success = true;
        $scope.showmsg = false;
        $scope.lastsavedat = new Date();
         setTimeout(function(){
          delete $scope.success;
        },2000);
      });
  }

  $scope.savetocommunity = function()
  {
    $scope.reconcile();
    _.each($scope.event.roles,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.phases,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.coverage_classes,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.shot_types,function(r)
    {
      delete r.editing;
    });

    $scope.event.shotrelease = $('#editor').cleanHtml();

    if ($scope.event.roleimg === false)
      delete $scope.event.roleimg;

    socket.post('/commission/savetocommunity/'+mastereventid,{eventtype:$scope.event})
      .then(function(resp){
        $scope.success = true;
        $scope.showmsg = false;
        $scope.lastsavedat = new Date();
         setTimeout(function(){
          delete $scope.success;
        },2000);
      });
  }

  $scope.savetooriginal = function()
  {
    $scope.reconcile();
    _.each($scope.event.roles,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.phases,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.coverage_classes,function(r)
    {
      delete r.editing;
    });
    _.each($scope.event.shot_types,function(r)
    {
      delete r.editing;
    });

    $scope.event.shotrelease = $('#editor').cleanHtml();

    if ($scope.event.roleimg === false)
      delete $scope.event.roleimg;

    socket.post('/commission/savetooriginal/'+mastereventid,{eventtype:$scope.event})
      .then(function(resp){
        $scope.success = true;
        $scope.showmsg = false;
        $scope.lastsavedat = new Date();
         setTimeout(function(){
          delete $scope.success;
        },2000);
      });
  }

  //  socket.connect().then(function(sock){
  //   console.log('connected',sock)
  // },function(err){
  //     console.log('connection error',err)
  // },function(not){
  //     console.log('connection update',not)
  // });

var showmsgcount = 0;

  (function () {

    
    //usSpinnerService.spin('spinner-1');
    $timeout(function(){
        $('#editor').wysiwyg();
        $('#editor').bind("DOMSubtreeModified",function(){
          if (showmsgcount > 0)
            showmsg = true;
            
          showmsgcount++;
        });
    },0);

    // Using .success() and .error()
    socket.get('/commission/templateinfo/'+mastereventid)
      .then(function(resp){
         $scope.event = resp.data.eventtype;
         //now also update the temporary template information with the changes made on the live event:
         $scope.eventinfo = resp.data.eventinfo;

         $scope.event.coverage_classes = resp.data.coverage_classes;
         $scope.event.phases = resp.data.phases;
         _.each($scope.event.phases,function(p)
         {
          if (p.roles && typeof p.roles == 'string')
          {
            p.roles = p.roles.split(',').map(Number);
          }
         });

         _.each($scope.event.roles,function(r)
         {
           r.shot_ids = _.without(r.shot_ids,null);
         });
         $scope.loading = false;
      });

    socket.get('/commission/allmodules')
    .then(function(resp){
         $scope.modules = resp.data;
         $scope.$apply;
      });

    socket.get('/commission/allshots/')
      .then(function(resp){
         $scope.allshots = resp.data;
      });
  })();

}]);
