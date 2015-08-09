/**
 * Routes
 *
 * Sails uses a number of different strategies to route requests.
 * Here they are top-to-bottom, in order of precedence.
 *
 * For more information on routes, check out:
 * http://sailsjs.org/#documentation
 */



/**
 * (1) Core middleware
 *
 * Middleware included with `app.use` is run first, before the router
 */


/**
 * (2) Static routes
 *
 * This object routes static URLs to handler functions--
 * In most cases, these functions are actions inside of your controllers.
 * For convenience, you can also connect routes directly to views or external URLs.
 *
 */

module.exports.routes = {
'/': 'AuthController.login',
'/v/:shortlink?':'WatchController.shortlink',
'/howtobootleg/:platform?':'AuthController.howtobootleg',
'/auth/mobilelogin/:id?':'AuthController.mobilelogin',
'/status':'AuthController.status',
'/auth': 'AuthController.login',
'/event/myevents':'EventController.myevents',
'/event/view/:id?': 'EventController.view',
'/event/edit/:id?': 'EventController.edit',
'/event/image/:id?':{uploadLimit:'4mb'},
//'/auth/clone_output/:id?':'AuthController.clone_output',
'/post/module_function/audio_sync/:id?':{uploadLimit: '500mb'},
'/post/remind':'PostController.remind',
'/post/broadcast':'PostController.broadcast',
'/post/module_function':'PostController.module_function',
'/post/module/:id?':'PostController.module',
'/post/getnumbers':'PostController.getnumbers',
'/post/document':'PostController.document',
'/post/canceldownload':'PostController.canceldownload',
'/post/downloadprogress':'PostController.downloadprogress',
'/post/myoutputtemplates':'PostController.myoutputtemplates',
'/post/downloadall':'PostController.downloadall',
'/post/updateoutputs':'PostController.updateoutputs',

'/commission/addshot':'CommissionController.addshot',
'/commission/example':'CommissionController.example',
'/commission/savetoreuse':'CommissionController.savetoreuse',
'/commission/savetocommunity':'CommissionController.savetocommunity',
'/commission/update':'CommissionController.update',
'/commission/info':'CommissionController.info',
'/commission/templateinfo':'CommissionController.templateinfo',
'/commission/savetooriginal':'CommissionController.savetooriginal',
'/commission/allshots':'CommissionController.allshots',
'/commission/allmodules':'CommissionController.allmodules',
'/commission/updateshots':'CommissionController.updateshots',

'/shoot/preedit':'ShootController.preedit',
'/shoot/liveedit':'ShootController.liveedit',
'/shoot/:id?':'ShootController.index',

'/media/upload/:id?':{uploadLimit: '500mb'},
'/media/uploadthumb/:id?':{uploadLimit: '4mb'},
'/event/registercode/:code?':'EventController.registercode',
'/media/transcodefile':'MediaController.transcodefile',
//'/auth/local_login/:code?':'AuthController.local_login',

// '/demo1':'AuthController.demo1',
// '/demo2':'AuthController.demo2',
'/terms':'AuthController.terms',
'/privacy':'AuthController.privacy',
'/getapp':'AuthController.getapp',
'/join/:id?':'AuthController.join',
'/joincomplete':'AuthController.joincomplete',
'/media/nicejson/:id?':'MediaController.nicejson',
'/dashboard':'EventController.dashboard',
'/commission/new':'CommissionController.new',
'/commission/:id?':'CommissionController.index',
'/post/:id?':'PostController.index',


/*
API ENDPOINTS
*/

//info
'/api':'ApiController.index',
//server status
'/api/status':'AuthController.status',

'/api/getkey':'ApiController.getkey',

//login
'/api/login':'AuthController.apilogin',
//logout
'/api/logout':'AuthController.apilogout',

//list shots
'/api/commission/shots':{controller:'CommissionController',action:'allshots',policy:'apiauth'},
//get template
'/api/commission/gettemplate/:id?':{controller:'CommissionController',action:'templateinfo',policy:'apiauth'},
//update template
'/api/commission/update/:id?':{controller:'CommissionController',action:'update',policy:'apiauth'},
//update shots live
'/api/commission/updateshots/:id?':{controller:'CommissionController',action:'updateshots',policy:'apiauth'},
//my events
'/api/profile/mine':{controller:'EventController',action:'myevents',policy:'apiauth'},
//my profile details
'/api/profile/me':{controller:'EventController',action:'me',policy:'apiauth'},

//create new media
'/api/media/create':{controller:'MediaController',action:'addmedia',policy:'apiauth'},
'/api/media/update/:id?':{controller:'MediaController',action:'update',policy:'apiauth'},
//upload media thumb
'/api/media/signuploadthumb/:id?':{controller:'MediaController',action:'uploadsignthumb',policy:'apiauth'},
'/api/media/uploadthumbcomplete/:id?':{controller:'MediaController',action:'s3notifythumb',policy:'apiauth'},
//upload media file
'/api/media/signupload/:id?':{controller:'MediaController',action:'uploadsign',policy:'apiauth'},
'/api/media/uploadcomplete/:id?':{controller:'MediaController',action:'s3notify',policy:'apiauth'},
//get all media for event
'/api/media/shoot/:id?':[{controller:'MediaController',action:'nicejson'},{policy:'apiauth'},{policy:'viewonly'}],

//get all media for event
'/api/post/newedit':{controller:'WatchController',action:'newedit',policy:'apiauth'},

'/api/shoot/changephase/:id?':[{controller:'EventController',action:'changephase'},{policy:'apiauth'},{policy:'isowner'}],
'/api/shoot/create':[{controller:'EventController',action:'addevent'},{policy:'apiauth'},{policy:'eventlimit'}],
'/api/shoot/pause':[{controller:'EventController',action:'pause'},{policy:'apiauth'},{policy:'isowner'}],
'/api/shoot/started':[{controller:'EventController',action:'started'},{policy:'apiauth'},{policy:'isowner'}],
'/api/shoot/updates/:id?':[{controller:'EventController',action:'updates'},{policy:'apiauth'},{policy:'isowner'}],
//connect to event

'/api/shoot/acceptrole':{controller:'EventController',action:'acceptrole',policy:'apiauth'},
'/api/shoot/acceptshot':{controller:'EventController',action:'acceptshot',policy:'apiauth'},
'/api/shoot/connect/:id?':{controller:'EventController',action:'subscribe',policy:'apiauth'},
'/api/shoot/join/:id?':{controller:'EventController',action:'sub',policy:'apiauth'},
'/api/shoot/discon/:id?':{controller:'EventController',action:'signout',policy:'apiauth'},
'/api/shoot/leaverole/:id?':{controller:'EventController',action:'unselectrole',policy:'apiauth'},
'/api/shoot/ready/:id?':{controller:'EventController',action:'ready',policy:'apiauth'},
'/api/shoot/registerpush/:id?':{controller:'EventController',action:'registerpush',policy:'apiauth'},
'/api/shoot/rejectrole':{controller:'EventController',action:'rejectrole',policy:'apiauth'},
'/api/shoot/rejectshot/:id?':{controller:'EventController',action:'rejectshot',policy:'apiauth'},
'/api/shoot/selectrole':{controller:'EventController',action:'chooserole',policy:'apiauth'},
'/api/shoot/startrecording':{controller:'EventController',action:'startrecording',policy:'apiauth'},
'/api/shoot/stoprecording':{controller:'EventController',action:'stoprecording',policy:'apiauth'},




};
