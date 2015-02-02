//$(function(){

  //(function (io) {

  // as soon as this file is loaded, connect automatically, 
  //var socket = io.connect();
  // if (typeof console !== 'undefined') {
  //   log('Connecting to Sails.js...');
  // }

  io.socket.on('connect', function socketConnected() {
    //log('Connected.');
    //window.socket = io.socket;
    // Listen for Comet messages from Sails
    // socket.on('message', function messageReceived(message) {

     io.socket.on('message',function(msg)
     {
      //console.log(msg);
     });

 io.socket.on('event',function(msg)
     {
      console.log(msg);
     });

  io.socket.on('user',function(msg)
     {
      //console.log(msg);
     });

    //   //log('New comet message received :: ', message);


    // });
  //window.socket = io.socket;


    //list my events for all pages
    io.socket.get('/event/myevents',function(resp){
      //console.log(resp);
      if (eventlisttemplate!=undefined)
      {
        $('#eventlist').html(eventlisttemplate(resp));
        $('.dropdown input, .dropdown label').click(function(e) {
          e.stopPropagation();
        });
      }
    });

    //register for log events:
    io.socket.get('/log/subscribe', function(response){
      //do somthing with log event:
    });

  });


  // Expose connected `socket` instance globally so that it's easy
  // to experiment with from the browser console while prototyping.
  

  // Simple log function
  // function log () {
  //   if (typeof console !== 'undefined') {
  //     console.log.apply(console, arguments);
  //   }
  // }

//});

//(
  //window.io
//);});

var eventlisttemplate;
$(function()
{
  //build handlebars templates
  var source = $("#eventlist-template").html();
  eventlisttemplate = Handlebars.compile(source);
  
  $('.datepicker').datepicker().on('changeDate', function(ev){
    $(this).datepicker('hide');
  });

  $("#offlineaccess").popover({
    html:true,
    content:'<div style="text-align:center">You will need this code to use bootlegger without internet<br><h1 id="localcode" style="text-align:center">'+localcode+'</h1><button class="btn" onclick="getnewcode();">Get New Code</button></div>'
  });

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
    oldtitle = $('#title').replaceWith('<input id="title" class="form-control" style="font-weight:100;line-height: 1.1;margin-top:19px;margin-bottom:10px;font-family:Segoe UI Light,Helvetica Neue,Segoe UI,Segoe WP,sans-serif;font-size:30px;padding:0px;margin-left:-2px;" type="text" value="'+$('#title').text().trim()+'" />');
    $('#title').on('keydown',function(key)
    {
      if (key.which == 13)
      {
        var newval = $('#title').val();
        //console.log(newval);
        if (newval.length > 6)
        {
          editingtitle = false;
          $('#title').replaceWith(oldtitle);
          $('#title span').text(newval);
          socket.post('/event/changetitle/',{title:newval}, function (response) {
            showok('Updated',$('#title'));
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
    socket.post('/event/registercode/',{code: $('#mycode').val()}, function (response) {
      showok(response.msg,$('#myeventsbtn'));
      socket.get('/event/myevents',function(resp){
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