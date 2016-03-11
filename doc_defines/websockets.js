/**
* @api {SocketIO Message} live Start or Stop Recording
* @apiName io_startrecording
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent when current user needs to start or stop recording.
*
* @apiSuccess {Bool} live True to start recording, false to stop recording.
* @apiSuccess {Integer} shot_length Maximum / expected length of this recording.
*/

/**
* @api {SocketIO Message} getshot Shot Request
* @apiName io_getshot
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent to request the user obtain a specific shot.
*
* @apiSuccess {Integer} getshot Index of the request shot in the template.
* @apiSuccess {String} meta Specfic subject meta-data associated with this request (to be used as replacement text in a shot description)
* @apiSuccess {Integer} coverage_class Index of a coverage_class in the template which this shot applies to. 
*/

/**
* @api {SocketIO Message} forcedie Force Disconnect
* @apiName io_forcedie
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server when the client needs to reconnect completely.
*
*/

/**
* @api {SocketIO Message} message Server Message
* @apiName io_message
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server as a broadcast or individual message to be displayed in the client.
*
* @apiSuccess {String} msg Content of the message to be displayed.
* @apiSuccess {Bool} dialog True if this message should be more promenent, rather than just presented on-screen.
* @apiSuccess {Bool} shots True if this dialog should present a demonstration list of shots to the user.
*
*/

/**
* @api {SocketIO Message} loginelsewhere Duplicate Login Attempt
* @apiName io_dupelogin
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server when you have been disconnected due to a login by this user elsewhere.
*
*
*/

/**
* @api {SocketIO Message} length User Shot Timing Information
* @apiName io_lengthupdate
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server to update the user of their expected record timings.
*
* @apiSuccess {Integer} length Length in seconds of shot allocation process.
* @apiSuccess {Integer} warning Length in seconds of countdown indicator.
* @apiSuccess {Integer} live Length in seconds of each recording.
* @apiSuccess {Integer} cameragap Length in seconds between stopping recording and starting the shot allocation process.
*
*/

/**
* @api {SocketIO Message} eventstarted Shoot Started/Paused Indicator
* @apiName io_shootstarted
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server to indicate the shoot has started allocating shots.
*
* @apiSuccess {Bool} eventstarted True if shoot started, False if shoot paused.
*
*/

/**
* @api {SocketIO Message} phasechanged Phase Change
* @apiName io_phasechange
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server to indicate the shoot creater has changed the current phase.
*
* @apiSuccess {Integer} phasechange Index of the current phase in the template.
*
*/

/**
* @api {SocketIO Message} eventupdate Shoot Template Update
* @apiName io_eventupdate
* @apiGroup Socket.io Messages
* @apiVersion 0.0.2
* @apiSampleRequest off
*
* @apiDescription Sent by the server to indicate the template has been updated.
*
* @apiSuccess {Object} eventupdate New template information to replace the current version.
*
*/