/**
 * Policy mappings (ACL)
 *
 * Policies are simply Express middleware functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect just one of its actions.
 *
 * Any policy file (e.g. `authenticated.js`) can be dropped into the `/policies` folder,
 * at which point it can be accessed below by its filename, minus the extension, (e.g. `authenticated`)
 *
 * For more information on policies, check out:
 * http://sailsjs.org/#documentation
 */


module.exports.policies = {

  // Default policy for all controllers and actions
  // (`true` allows public access)
  //'*': true,

    //'*': ['flash','authenticated'],
    '*': ['flash','authenticated','apiauth'],

    'api':
    {
        //'*':'api_key',
        '*':['apiauth'],
        'signup':['authenticated','flash','apikeygen'],
        'activate':'authenticated',
        'newkey':'authenticated',
        'getkey':'authenticated',
        'revokeapi':['authenticated','superadmin'],
        'unrevokeapi':['authenticated','superadmin']
    },

    'event':
    {
      'featured':true,
      'search':['superadmin','apiauth'],
      'info':['authenticated','flash','apiauth'],
      'view':['authenticated','hasevents','isowner','flash','apikeygen'],
      'update':['authenticated','isowner','flash','apiauth'],
      'addcode':['authenticated','isowner','flash','apiauth'],
      'remcode':['authenticated','isowner','flash','apiauth'],
      'resendcode':['authenticated','isowner','flash','apiauth'],
      'makedefault':['authenticated','isowner','flash','apiauth'],
      'updatecoverage':['authenticated','isowner','flash','apiauth'],
      'edit':['authenticated','isowner','flash','apiauth'],
      'admins':['authenticated','isowner','apiauth'],
      'remove':['authenticated','isowner','apiauth'],
      'coverage':['authenticated','isowner','apiauth'],
      'phases':['authenticated','isowner','apiauth'],
      'codes':['authenticated','isowner','apiauth'],
      'addcoverage':['authenticated','isowner','apiauth'],
      'addadmin':['authenticated','isowner','apiauth'],
      'removecoverage':['authenticated','isowner','apiauth'],
      'updatedirection':['authenticated','isowner','apiauth'],
      'changetitle':['authenticated','isowner','apiauth'],
      'server':true,
      'list':['superadmin','apiauth'],
      'addevent':['flash','eventlimit','apiauth'],
      'admin':['superadmin','flash','apikeygen'],
      'kill':['superadmin','flash','apiauth'],
      'map':['authenticated','isowner','apiauth'],
      'image':['apiauth','authenticated','isowner'],
      'imagebackground':['apiauth','authenticated','isowner'],
      'triggeradd':true,
      'changephase':['authenticated','isowner','apiauth'],
      'addphase':['authenticated','isowner','apiauth'],
      'removephase':['authenticated','isowner','apiauth'],
      'pause':['authenticated','isowner','apiauth'],
      'admin_users':['superadmin','flash','apiauth'],
      'admin_events':['superadmin','flash','apiauth'],
      'removeuser':['superadmin','apiauth'],
      'removeadmin':['authenticated','isowner','apiauth'],
      'dashboard':['authenticated','flash','apikeygen'],
      'shortlink':['flash','apikeygen'],
      'removelimit':['superadmin','flash','apiauth']
    },

    'watch':
    {
        'view':['authenticated','viewonly','flash','apikeygen'],
        //'view':false,
        'shortlink':true,
        'index':['authenticated','isowner','apikeygen','flash'],
        'saveedit':['authenticated','apiauth'],
        'newedit':['authenticated','apiauth'],
        'deleteedit':['authenticated','apiauth'],
        'list':['authenticated','flash','apikeygen'],
        'mymedia':['authenticated','apiauth'],
        'editupdates':['authenticated','apiauth'],
        'canceleditupdates':['authenticated','apiauth'],
        'getvideo':['shortlink'],
        'edits':['authenticated','isowner','apikeygen','flash'],
        'alledits':['authenticated','isowner','apiauth'],        
    },

    'shoot':
    {
        'index':['flash','authenticated','hasevents','isowner','apikeygen'],
        'liveedit':['flash','authenticated','hasevents','isowner','apikeygen'],
        'preedit':['flash','authenticated','hasevents','isowner','apikeygen'],
        'sendmessage':['authenticated','isowner','apiauth'],
        'updatetimeline':['authenticated','isowner','apiauth'],
        'sendindividualmessage':['authenticated','isowner','apiauth']
    },

    'commission':
    {
        '*':['flash','authenticated','isowner','apiauth'],
        'example':['authenticated'],
        'new':['flash','authenticated','apikeygen','eventlimit'],
        'index':['flash','authenticated','hasevents','isowner','apikeygen'],
        'savetooriginal':['flash','authenticated','superadmin','apiauth'],
        'addshot':['authenticated','superadmin','apiauth']
    },

    'post':
    {
         '*':['flash','authenticated','isowner','apiauth'],
         'index':['flash','authenticated','hasevents','isowner','apikeygen'],
         'broadcast':['flash','authenticated','superadmin'],
         'document':['authenticated','isowner','apiauth'],
         'module':['authenticated','isowner','flash','apikeygen']
    },

    'media':
    {
        'nicejson':['authenticated','viewonly','apiauth'],
        'mediacount':['authenticated','viewonly','apiauth'],
        'mymedia':['authenticated','apiauth'],
        'directorystructure':['authenticated','isowner','apiauth'],
        'remove':['authenticated','ismediaowner','apiauth'],
        'rm_tag':['authenticated','isowner','apiauth'],
        'add_tag':['authenticated','isowner','apiauth'],
        'transcode':['superadmin'],
        'availableoutputs':['authenticated','isowner','apiauth'],
        'transcodefile':['authenticated','apiauth'],
        'thumbnail':['checkmedia'],
        'preview':['checkmedia'],
        'full':['checkmedia_full'],
        'homog':['checkmedia_full']
    },

    'log':
    {
        '*':['superadmin','flash'],
        'all':['superadmin','flash','apikeygen'],
        'view':['authenticated','flash','isowner','apikeygen']
    },

    'auth':
    {
      '*': ['flash',true],
      'login':['apikeygen','flash',true],
      'join':['flash','apikeygen',true],
      'joincomplete':['flash','apikeygen',true],
      'changename':['authenticated'],
      'localcode':'authenticated',
      'dropbox':'authenticated',
      'setprivacy':'authenticated',
      'apilogin':['apiauth','apikeygen','flash'],
      'howtobootleg':['apikeygen','flash',true],
      'sessionkey':['authenticated'],
      
    },
    
    'static':
    {
      '*': ['apikeygen','flash',true],
    }
};
