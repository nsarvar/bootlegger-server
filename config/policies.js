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
    '*': ['flash','authenticated'],

    'event':
    {
    	'view':['authenticated','hasevents','isowner','flash'],
    	'update':['authenticated','isowner','flash'],
    	'addcode':['authenticated','isowner','flash'],
    	'makedefault':['authenticated','isowner','flash'],
    	'updatecoverage':['authenticated','isowner','flash'],
    	'edit':['authenticated','isowner','flash'],
        'server':true,
        'admin':['superadmin','flash'],
        'kill':['superadmin','flash']
    },

    'shoot':
    {
        'index':['flash','authenticated','hasevents','isowner']
    },

    'post':
    {
        'document':true,
         'index':['flash','authenticated','hasevents','isowner']
    },

    'media':
    {
        'upload':true,
        'uploadthumb':true
    },

	// whitelist the auth controller
	'auth':
	{
		'*': ['flash',true],
		'local_login':true,
		'localcode':'authenticated',
        'dropbox':'authenticated'
	}
};
