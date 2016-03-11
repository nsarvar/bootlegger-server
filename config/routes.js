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
'/platform':'StaticController.platform',
'/blog':'StaticController.blog',
'/v/:shortlink?':'WatchController.shortlink',
'/s/:shortlink?':'EventController.shortlink',
'/howtobootleg/:platform?':'StaticController.howtobootleg',
'/watch':'WatchController.index',
'/watch/view/:id?/:edit?':'WatchController.view',
'/watch/editupdates':'WatchController.editupdates',
'/watch/canceleditupdates':'WatchController.canceleditupdates',
'/watch/savedit/:id?':'WatchController.saveedit',
'/watch/newedit/:id?':'WatchController.newedit',
'/watch/deleteedit/:id?':'WatchController.deleteedit',
'/watch/edits/:id?':'WatchController.edits',
'/watch/alledits/:id?':'WatchController.alledits',
'/watch/getvideo/:id?':'WatchController.getvideo',
'/auth/mobilelogin/:id?':'AuthController.mobilelogin',
'/status':'AuthController.status',
'/auth': 'AuthController.login',
'/event/myevents':'EventController.myevents',
'/event/view/:id?': 'EventController.view',
'/event/edit/:id?': 'EventController.edit',
'/event/removelimit/:id?': 'EventController.removelimit',
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

// '/shoot/testios':'ShootController.testios',
'/shoot/preedit':'ShootController.preedit',
'/shoot/liveedit':'ShootController.liveedit',
'/shoot/:id?':'ShootController.index',


'/media/upload/:id?':{uploadLimit: '500mb'},
'/media/uploadthumb/:id?':{uploadLimit: '4mb'},
'/event/registercode/:code?':'EventController.registercode',
'/media/transcodefile':'MediaController.transcodefile',
'/media/preview/:id?':'MediaController.preview',
'/media/full/:id?':'MediaController.full',
'/media/homog/:id?':'MediaController.homog',
//'/auth/local_login/:code?':'AuthController.local_login',

// '/demo1':'AuthController.demo1',
// '/demo2':'AuthController.demo2',
'/terms':'StaticController.terms',
'/privacy':'StaticController.privacy',
'/getapp':'AuthController.getapp',
'/join/:id?':'AuthController.join',
'/joincomplete':'AuthController.joincomplete',
'/media/nicejson/:id?':'MediaController.nicejson',
'/media/mediacount/:id?':'MediaController.mediacount',
'/media/mymedia/:id?':'MediaController.mymedia',
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
'/api/auth/login':'AuthController.apilogin',
//logout
'/api/auth/logout':'AuthController.apilogout',
//anon login
'/api/auth/anon':'AuthController.fakejson',

//list shots
'/api/commission/shots':{controller:'CommissionController',action:'allshots',policy:'apiauth',cors:true},
//get template
'/api/commission/gettemplate/:id?':{controller:'CommissionController',action:'templateinfo',policy:'apiauth',cors:true},
//update template
'/api/commission/update/:id?':{controller:'CommissionController',action:'update',policy:'apiauth',cors:true},
//update shots live
'/api/commission/updateshots/:id?':{controller:'CommissionController',action:'updateshots',policy:'apiauth',cors:true},
//list seed templates
'/api/commission/seedtemplates':{controller:'CommissionController',action:'seedtemplates',policy:'apiauth',cors:true},
//get seed template
'/api/commission/getseedtemplate/:id?':{controller:'CommissionController',action:'getseedtemplate',policy:'apiauth',cors:true},
//my events
'/api/profile/mine':{controller:'EventController',action:'myevents',policy:'apiauth',cors:true},
//my profile details
'/api/profile/me':{controller:'EventController',action:'me',policy:'apiauth',cors:true},

//create new media
'/api/media/create':{controller:'MediaController',action:'addmedia',policy:'apiauth',cors:true},
'/api/media/update/:id?':{controller:'MediaController',action:'update',policy:'apiauth',cors:true},
//upload media thumb
'/api/media/signuploadthumb/:id?':{controller:'MediaController',action:'uploadsignthumb',policy:'apiauth',cors:true},
'/api/media/uploadthumbcomplete/:id?':{controller:'MediaController',action:'s3notifythumb',policy:'apiauth',cors:true},
//upload media file
'/api/media/signupload/:id?':{controller:'MediaController',action:'uploadsign',policy:'apiauth',cors:true},
'/api/media/uploadcomplete/:id?':{controller:'MediaController',action:'s3notify',policy:'apiauth',cors:true},
//get all media for event
'/api/media/shoot/:id?':[{policy:'apiauth'},{policy:'viewonly'},{policy:'apply_cors'},{controller:'MediaController',action:'nicejson'}],

//get all media for event
'/api/media/mymedia/:id?':[{policy:'apiauth'},{policy:'viewonly'},{policy:'apply_cors'},{controller:'MediaController',action:'mymedia'}],
//get thumbnail
'/api/media/thumbnail/:id?':[{policy:'checkmedia'},{policy:'apply_cors'},{controller:'MediaController',action:'thumbnail'}],
'/api/media/preview/:id?':[{policy:'checkmedia'},{policy:'apply_cors'},{controller:'MediaController',action:'preview'}],
'/api/media/full/:id?':[{policy:'checkmedia_full'},{policy:'apply_cors'},{controller:'MediaController',action:'full'}],
'/api/media/homog/:id?':[{policy:'checkmedia_full'},{policy:'apply_cors'},{controller:'MediaController',action:'homog'}],

//get all media for event
'/api/post/newedit':{controller:'WatchController',action:'newedit',policy:'apiauth',cors:true},
'/api/post/editprogess':{controller:'WatchController',action:'editprogress',policy:'apiauth',cors:true},
'/api/post/myedits':{controller:'WatchController',action:'myedits',policy:'apiauth',cors:true},

'/api/shoot/changephase/:id?':[{controller:'EventController',action:'changephase'},{policy:'apiauth'},{policy:'isowner'},{policy:'apply_cors'}],
'/api/shoot/create':[{controller:'EventController',action:'addevent'},{policy:'apiauth'},{policy:'eventlimit'},{policy:'apply_cors'}],
'/api/shoot/pause':[{controller:'EventController',action:'pause'},{policy:'apiauth'},{policy:'isowner'},{policy:'apply_cors'}],
'/api/shoot/started':[{controller:'EventController',action:'started'},{policy:'apiauth'},{policy:'isowner'},{policy:'apply_cors'}],
'/api/shoot/updates/:id?':[{controller:'EventController',action:'updates'},{policy:'apiauth'},{policy:'isowner'},{policy:'apply_cors'}],
//connect to event

'/api/shoot/acceptrole':{controller:'EventController',action:'acceptrole',policy:'apiauth',cors:true},
'/api/shoot/acceptshot':{controller:'EventController',action:'acceptshot',policy:'apiauth',cors:true},
'/api/shoot/connect/:id?':{controller:'EventController',action:'subscribe',policy:'apiauth',cors:true},
'/api/shoot/join/:id?':{controller:'EventController',action:'sub',policy:'apiauth',cors:true},
'/api/shoot/discon/:id?':{controller:'EventController',action:'signout',policy:'apiauth',cors:true},
'/api/shoot/leaverole/:id?':{controller:'EventController',action:'unselectrole',policy:'apiauth',cors:true},
'/api/shoot/ready/:id?':{controller:'EventController',action:'ready',policy:'apiauth',cors:true},
'/api/shoot/registerpush/:id?':{controller:'EventController',action:'registerpush',policy:'apiauth',cors:true},
'/api/shoot/rejectrole':{controller:'EventController',action:'rejectrole',policy:'apiauth',cors:true},
'/api/shoot/rejectshot/:id?':{controller:'EventController',action:'rejectshot',policy:'apiauth',cors:true},
'/api/shoot/selectrole':{controller:'EventController',action:'chooserole',policy:'apiauth',cors:true},
'/api/shoot/startrecording':{controller:'EventController',action:'startrecording',policy:'apiauth',cors:true},
'/api/shoot/stoprecording':{controller:'EventController',action:'stoprecording',policy:'apiauth',cors:true},

'/api/auth/usersearch':{controller:'AuthController',action:'usersearch',policy:'apiauth',cors:true},




};
