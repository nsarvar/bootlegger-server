>BETA API - This is a preview release of the API, changes may occur!

# Overview
The Bootlegger platform encompasses the entire video production workflow. You may only require access to a particular part of this, in summary they are:

- Administering Shoots
	- Creating Shoot Templates
	- Starting New Shoots
	- Adjusting associated meta-data
- Contributing to a shoot
	- Browsing, joining and receiving real-time events from shoots
	- Uploading media and meta-data
- Post Production
	- Browsing, downloading and analysing media
	- Editing

## Key Points
> The Bootlegger API is currently designed so that you as a developer can make use of the functionality and infrastructure within the platform. To simplify integration, we do not expose all of the functions of the full Bootlegger platform.

> Bootlegger is built on top of Sails.js, which means that almost all API endpoints can actually be called from either HTTP or Socket.io. Suggestions are provided on which protocol to normally use. Please read the Sails documentation for further information.

## Remember
All calls to the API must include a `GET` parameter with your API key i.e. `?apikey=1234-1234-1234-1234`.

## Getting Started

This quick tutorial will show you how to get up and running with Bootlegger. You will perform 3 steps:
 - Login and retrieve a session key.
 - List shoots you have access to.
 - Upload the meta-data, thumbnail and video for a clip to this shoot.

#### 1. Login
Visit the <a href="#api-Authentication-login">login endpoint</a> in a browser, which will redirect you to the appropriate OAuth login page.

Allow your browser to redirect! What returns should be a JSON object:

	  {
		session: "sails.sid=s:jVS765CeN3OJ9NhuNfegnVF4.E1pwiBsK30QSXq78wYH8jh1xnbjlRijf+Bf2wSQyr4Q",
		msg: "Logged In OK"
	}

e.g.

    <script>
    window.location = '/api/login?apikey=1234-1234-1234-1234'
    </script>

Use the value of `session` as a cookie in subsequent requests.

#### 2. List Shoots Available
Bootlegger keeps track of which shoots you can contribute to. Use the <a href="#api-Profile-mine">list shoots endpoint</a> to access yours. e.g.

    <script>
    $.get('/api/profile/mine?apikey=1234-1234-1234-1234').done(function(data)
		{
			//list of shoots
			console.log(data);
		})
    </script>

The `id` field is used in future requests to link media to a shoot.

#### 3. Upload Media
Once you have a `session` and `event id`, you can upload a clip. First, you need to create a new clip on the server, with all its associated meta-data, using the <a href="#api-Media-createmedia">create media endpoint</a> e.g.

	<script>
	var media = {
		event_id:%event%,
		created_by: %myuserid%,
		captured_at: '3/13/2015 9:14:35 AM',
		media_type: 'VIDEO',
		clip_length:'0:34:0.0'

		(any other key-value pairs of data or objects...)

		(optional...)
		filesize
		local_filename
		meta_phase
		role
		shot
		shot_meta
		coverage_class
	};
	$.post('/api/media/create?apikey=1234-1234-1234-1234',media).done(function(data)
	{
		//resulting media id
		console.log(data.id);
	})
	</script>

This will return a JSON object with an `id`, use this in the next steps:

Get a url to upload the thumbnail to using the <a href="#api-Media-signuploadthumb">get thumbnail upload endpoint</a> e.g.



	<script>
	$.post('/api/media/signuploadthumb/%id%?apikey=1234-1234-1234-1234',{filename:'thumbnail.png'}).done(function(data)
	{
		//signed url
		console.log(data.signed_request);
	})
	</script>

Upload the thumbnail e.g.
> This should be a PNG file, and must match the filename given in the previous step. Currently, you will need to name your file randomly (uuid) to avoid conflicts. In future releases the system will provide this name for you.

`curl -v -X PUT -T "thumbnail.png" %signedurl%`

Notify bootlegger that the thumbnail has uploaded using the <a href="#api-Media-s3notifythumb">notify thumb endpoint</a> e.g.

	<script>
	$.post('/api/media/uploadthumbcomplete/%id%?apikey=1234-1234-1234-1234',{filename:'thumbnail.png'}).done(function(data)
	{
		//complete
	})
	</script>

Get a url to upload the video to using the <a href="#api-Media-signupload">get upload endpoint</a> e.g.

	<script>
	$.post('/api/media/signupload/%id%?apikey=1234-1234-1234-1234',{filename:'video.mp4'}).done(function(data)
	{
		//signed url
		console.log(data.signed_request);
	})
	</script>

Upload the video e.g.
> This should be a MP4 (h.264,aac) file, and must match the filename given in the previous step. Currently, you will need to name your file randomly (uuid) to avoid conflicts. In future releases the system will provide this name for you.

`curl -v -X PUT -T "video.mp4" %signedurl%`

Notify bootlegger that the video has uploaded using the  <a href="#api-Media-s3notify">notify upload endpoint</a> e.g.

	<script>
	$.post('/api/media/uploadcomplete/%id%?apikey=1234-1234-1234-1234',{filename:'video.mp4'}).done(function(data)
	{
		//complete
	})
	</script>
