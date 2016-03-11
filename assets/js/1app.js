'use strict';

var bootleggerApp = angular.module('bootleggerApp', [
      "ngSanitize",
      'ngLoadingSpinner',
      'angularSails.io',
      'ui.slider',
      'ui.bootstrap',
      'ui.inflector',
      'ui.format',
      'ui.sortable',
      'ui.knob',
      'ngAnimate',
      'checklist-model',
      'frapontillo.bootstrap-switch',
      'com.2fdevs.videogular',
      'com.2fdevs.videogular.plugins.controls',
      'ngLoadingSpinner',
      'ngStorage',
      'ui.grid',
      'ui.grid.pagination',
      'ui.grid.moveColumns',
      'ui.grid.resizeColumns',
      'angularUtils.directives.dirPagination',
      'uiGmapgoogle-maps',
      'ui.slider',
      'ngDragDrop',
      'rzModule'
		]);
    
bootleggerApp.config(['paginationTemplateProvider',function(paginationTemplateProvider) {
    paginationTemplateProvider.setPath('/dirPagination.tpl.html');
}]);
    
bootleggerApp.factory('socket',['$sailsSocket', function($sailsSocket){
      return $sailsSocket();
  }]);
  
bootleggerApp.controller('myprofile',['$scope','socket', function ($scope, socket) {
  $scope.loading = true;

  
  
  socket.connect().then(function(sock){
    console.log('connected',sock)
  },function(err){
      console.log('connection error',err)
  },function(not){
      console.log('connection update',not)
  });

  (function () {

   socket.get('/event/myeventsowned')
     .then(function(resp){
       $scope.myevents = _.filter(resp.data,function(e){
        if (!e.status)
        {
          var tmp = [];
          tmp = _.filter(e.events,function(f)
            {
              return f.status == 'OWNER'; 
            });  
           e.events = tmp;
           return e.events.length > 0;
        }
        else
        {
          return e.status == 'OWNER';  
        }
      });
        $scope.loading = false;
     });
 })();

}]);

bootleggerApp.controller('adminlists',['$scope','socket', function ($scope, socket) {
   $scope.shoots = [];
    $scope.shootsearch = null;
  
    $scope.searchEvent = function($item, $model, $label)
    {
      //console.log($item);
      window.location = "/shoot/"+$item.id;
      //do something
    };
  
    $scope.getShoot = function(val) {
      return socket.post('/event/search', {term: val}).then(function(response){
        return response.data;
      });
    };  
    
     (function () {
      socket.get('/watch/queuelength')
        .then(function(resp){
        $scope.edits = resp.data;
      });
    })();
}]);
    
var eventlisttemplate;
$(function()
{
    //var items = '';
    // $('#mainbody .page-header:not(.exclude) h1').each(function(){
    //   $(this).before('<a name="'+$(this).clone().children().remove().end().text().toString().replace(/[\s,]+/g,'_').toLowerCase()+'"></a>');
    //   items += '<li class="hidden-xs"><a href="#'+$(this).clone().children().remove().end().text().toString().replace(/[\s,]+/g,'_').toLowerCase()+'">' + $(this).clone().children().remove().end().text() + '</a></li>';
    // });
    // if (items.length>0)
    //   $('.mainmenu.active').after('<div class="list-group-item hidden-xs"><ul class="sublist">' + items + '</ul></div>');

  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
  
  //build handlebars templates
  // var source = $("#eventlist-template").html();
  // if (source)
  //   eventlisttemplate = Handlebars.compile(source);


  $('.datepicker').datepicker().on('changeDate', function(ev){
    $(this).datepicker('hide');
  });

  // $("#offlineaccess").popover({
  //   html:true,
  //   content:'<div style="text-align:center">You will need this code to use bootlegger without internet<br><h1 id="localcode" style="text-align:center">'+localcode+'</h1><button class="btn" onclick="getnewcode();">Get New Code</button></div>'
  // });

  $("#chromecast").popover({
    html:true,
    content:$('#cast_content')
  });

  $('.fileinput').on('change.bs.fileinput',function(e,o){
    var form = $(this).closest('form');
    form.submit();
  });

  $('[data-toggle="tooltip"]').tooltip();
  $('[data-toggle="popover"]').popover();

  //list my events for all pages
  // io.socket.get('/event/myevents',function(resp){
  //   //console.log(resp);
  //   if (eventlisttemplate!=undefined && !resp.msg)
  //   {
  //     var events = _.filter(resp,function(e){
  //       if (!e.status)
  //       {
  //         var tmp = [];
  //         tmp = _.filter(e.events,function(f)
  //           {
  //             return f.status == 'OWNER'; 
  //           });  
  //          e.events = tmp;
  //          return e.events.length > 0;
  //       }
  //       else
  //       {
  //         return e.status == 'OWNER';  
  //       }
  //     })
      
      
  //     $('.eventlist').html(eventlisttemplate(events));
  //     $('.dropdown input, .dropdown label').click(function(e) {
  //       e.stopPropagation();
  //     });
  //   }
  // });

  //register for log events:
  io.socket.get('/log/subscribe', function(response){
    //do somthing with log event:
  });


  //fire any other init functions:
  
  if (typeof(bootlegger_init)!='undefined')
  {
    bootlegger_init();
  }
});

function showok(msg,obj)
{
  $(obj).tooltip({
    title:msg,
    trigger:'manual',
  });

  $(obj).tooltip('show');
  setTimeout(function()
  {
    $(obj).tooltip('hide');
    $(obj).tooltip('destroy');
  },2000);
}

var editingtitle = false;
var oldtitle;
function edittitle()
{
  if (!editingtitle)
  {
    editingtitle = true;
    //var w = $('#title span').width() + 150;
    //console.log(w);
    oldtitle = $('.thetitle').replaceWith('<input class="thetitle form-control" style="width:50%;font-weight:100;height:40px;line-height: 1.1;margin-top:19px;margin-bottom:10px;font-family:Open Sans,Helvetica Neue,Segoe UI,Segoe WP,sans-serif;font-size:30px;padding:0px;margin-left:-2px;" type="text" value="'+$('.thetitle > span').text().trim()+'" />');
    $('.thetitle').on('keydown',function(key)
    {
      if (key.which == 13)
      {
        var regex = /(<([^>]+)>)/ig;        
        var newval = $('.thetitle').val().replace(regex,"");
        //console.log(newval);
        if (newval.length > 4)
        {
          editingtitle = false;
          $('.thetitle').replaceWith(oldtitle);
          $('.thetitle span').text(newval);
          io.socket.post('/event/changetitle/'+mastereventid,{title:newval}, function (response) {
            showok('Title Updated',$('.thetitle'));
          });
        }
      }
    });
  }
}


function registercode()
{
  if ($('#mycode').val()!='')
  {
    io.socket.post('/event/registercode/',{code: $('#mycode').val()}, function (response) {
      showok(response.msg,$('#myeventsbtn'));
      io.socket.get('/event/myevents',function(resp){
        $('#eventlist').html(eventlisttemplate(resp));
        $('.dropdown input, .dropdown label').click(function(e) {
          e.stopPropagation();
        });
      });
    });
  }
}

function getnewcode()
{
  socket.post('/auth/localcode/',{}, function (response) {
      //alert(response.msg + response.code);
      $('#localcode').text(response.code);
    });
}
