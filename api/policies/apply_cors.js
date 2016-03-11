/* Copyright (C) 2014 Newcastle University
 *
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
 module.exports = function (req, res, ok) {
	res.header("Access-Control-Allow-Credentials",true);
	res.header("Access-Control-Allow-Origin",req.headers.origin);
	return ok();
};