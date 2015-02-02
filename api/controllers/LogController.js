/**
 * LogController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

module.exports = {

	index:function(req,res)
	{
		return res.redirect('/event/view');
	},

	subscribe:function(req,res)
	{
		Log.watch(req.socket);
		return res.json({msg:'Subscribed to Log Events'},200);
	}

};
