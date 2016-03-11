>BETA API - This is a preview release of the API, changes may occur!

# Getting Started
The Bootlegger platform encompasses the entire video production workflow.

This architecture is described in [The Bootlegger Platform](/platform). Examples of how to perform common workflows are given below.

## Key Points
> The Bootlegger API is currently designed so that you as a developer can make use of the functionality and infrastructure within the platform. To simplify integration, we do not expose all of the functions of the full Bootlegger platform.

> Bootlegger is built on top of Sails.js, which means that almost all API endpoints can actually be called from either HTTP or Socket.io. Suggestions are provided on which protocol to normally use. Please read the [Sails](http://sailsjs.org) documentation for further information.

## Remember
All calls to the API must include a `GET` parameter with your API key i.e. `?apikey=1234-1234-1234-1234`.

## Getting Started

1. Sign-up for an API key
1. Visit the api-examples [GitHub repo](/platform)
1. Read the [Bootlegger Platform documentation](/platform)
1. Read these docs
1. Ask questions to the community on GitHub

## Meta Data Structure

Bootlegger meta-data is heirachichal, and can be continually adjusted throughout the duration of a shoot:

	Shoot						//--> Top level information about 
	|
	+-- Phase					//--> Is set by the shoot organiser, and *can* be used to filter roles. Often used for temporal grouping (e.g. Day 1, Day 2)
		|
		+-- Role				//--> Is chosen by the contributor, and shots *can* be filtered into roles. Roles are often used for geographic locations, but can be used for any grouping of shots.
			|
			+-- Coverage Class	//--> Can be applied to a shot to specifiy the subject of that clip e.g. 'Interviewer', 'Interviewee'
			|
			+-- Shot			//--> Main description of what/how to capture a clip 

## Shoot Template JSON

Everything in Bootlegger centers on the shoot template. The template is a description of what the shoot organiser wants to capture, what contributors should shoot, what meta-data to apply to the captured footage and how this meta-data maps back to human-readable information.

The top level of the shoot object maintains logistical and practical propterties of the event.

**shoot**

```javascript
{
	"id": "234234asdasdasdasdasdasd",	// (string) Reference ID of the shoot
	"name": "Test shoot 1",				// (string)	Name of the shoot as it appears in listings
	"starts": "25-08-2015", 			// (date)	Date shoot starts (and appears on shoot lists)
	"starts_time": "1pm",				// (string) Time shoot starts (and appears on shoot lists)
	"ends": "25-08-2015",				// (date)	Date shoot ends (and appears on shoot lists)
	"ends_time": "11pm",				// (string)	Time shoot ends (and appears on shoot lists)
	"publicshare": 0,					// (bool)	Indicate that anyone can share content online from this shoot
	"public": 1,						// (bool)	Indicate that anyone can join this shoot without invitation		
	"publicview": 1,					// (bool)	Indicate that any contributor can view footage from this shoot
	"publicedit": 1,					// (bool)	Indicate that any contributor (or anyone with the link) can edit footage from this shoot
	"groupevent" : true,				// (bool)   Group this event visually under the owners name
	"icon": "8eb9e8d0.png",				// (string)	Filename of shoot icon stored in the bootlegger S3.
	"iconbackground": "8eb9e8d0.png", 	// (string)	Filename of shoot background image stored in the bootlegger S3.
	"created_by": "54aac87786d9",		// (string) UserID of user who originally created the shoot
	"release":"this is a release",		// (string) Markdown content for video release each contributor has to agree to
	"post_modules": {					// (object) Describes which post-production modules are enabled for this shoot
		"audio_sync": 0,
		"titles": 0
	},
	"shoot_modules": {					// (object) Describes which direction modules are enabled for this shoot
		"autodirector": "0",			//auto-director
		"marathondirector": "1"			//pallet mode
	},
	"eventtype": OBJECT					//see below
	"coverage_classes": OBJECT			//see below
	"codes": ARRAY,						//see below
	"phases": ARRAY						//see below
}
```

**shoot.eventtype**

This object represents the template which defines a commission. Each seed template is one of these types. When creating a new shoot, the provided shoot template becomes this object. Internal versions of `coverage_classes`, `phases`, `shoot_modules` and `post_modules` are clones of the ones in the parent.

```javascript
{
	"name" : "Live Music Performance",
	"description" : "the description",		// (string) Description of the template
	"version" : 1,							// (int)	Version of the template (increases with each save)
	"shotrelease" : "",						// (string) Markdown content for video release each contributor has to  show to the subject
	"offline" : false,						// (bool)	If the shoot can operate without a live internet connection (i.e. Auto-Director shoots)
	"codename" : "live_music_performance",	// (string) Filename compatable identifier for the template
	"hasroleimg" : true,					// (bool)	If the shoot presents a "map" image on which roles can be selected
	"roleimg" : "63096507.jpg"				// (opt.)	Filename in S3 for role map image
	"shot_types" : [ 						// Array of shot descriptions to be used in roles
		{
			"id" : 0,						// (int) 	Sequential ID to use as reference in a role
			"name" : "Flyer Close Up",		// (string) Short name of shot
			"description" : "Find a...",	// (string) Long description, can include %%fillme%% sections to replace by coverage_class
			"image" : "straight.png",		// (string) Filename of image overlay to use
			"icon" : "straight.png",		// (string) Filename of small icon to use
			"coverage_class" : 0			// (opt. )	Index of coverage_class that applies to this shot 
			
			//The following are required for Pallet Shoots
			"max_length" : 15,				// (string) Maximum length in seconds a clip should record for
			"wanted" : "2",					// (int)	Indication of how many clips should be captured per contributor
			"hidden" : true					// (bool)	Toggle if the shot is visible to the contributor
			"shot_type" : "PHOTO",			// (VIDEO|PHOTO|AUDIO) Media type to capture
			"release" : true,				// (bool)	Should the media release be shown to the subject before capture
						
			//The following are required for Auto-Director Shoots
			"frame_position" : "Left",		// (Left|Mid|Right) Subject direction (mapped to coverage_class direction)
		}
	],
	"roles" : [ 							// Array of roles contributors can pick from
		{
			"id" : 1,						// (int) 	Sequential index of the role
			"name" : "Everyone",			// (string)	Name of the role
			"description" : "Description",	// (string)	Description of the role
			"shot_ids" : [1,3,5],			// (array)	List of shots that contributors in this role can choose / are allocated
			"position" : [0.3,0.5],			// (opt.) 	Relative x,y coordinate of role in the role map image
		}
	],
	 
	//Below are a clone of properties on parent shoot object, used as as template for new shoots
	"phases":ARRAY, 
	"coverage_classes":OBJECT,
	"post_modules" : OBJECT,
	"shoot_modules" : OBJECT,
	"publicview" : true,
	"publicshare": 0,
	"public": 1,		
	"publicview": 1,
	"publicedit": 1
}
```

**shoot.coverage_classes**

This object represents how the shoot director allocates shots to contributors, and how variables in shot descriptions `%%replaceme%%` are replaced. 

```javascript
"coverage_classes" : {
	//format for us in pallet director mode
	"0" : {										// (index) Must be sequential
		"name" : "Keyboards",					// (string) Coverage class name
		"items" : []							// (empty) 	Not needed
	},
	
	//format to be used in auto-director mode
	"1" : {								// (string) Sequential index of coverage class
		"name" : "Whole Band",			// (string)	Coverage class name
		"percentage":40					// (int)	Percentage of shots in this coverage class to collect
		"items" : [ 
			{
				"name" : "drummer",		// Replacement text for the coverage class
				"direction" : "Mid"		// (Left|Mid|Right) Shot direction (filters shots allocated based on their direction value)
			}
		]
	}
},
```

**shoot.codes**

If a shoot is not public, then a join link is sent via email or SMS to participants. This object stores which participants have been notfied and their current join status. 

```javascript
"codes" : [ 
	{
		"number" : "++00000000000",
		"email" : "tom@jeff.com",
		"status" : "sent",
		"code" : "74443"
	}
],
```

**shoot.phases**

```javascript
"phases" : [ 
	{
		"name" : "Show",					// (string) 		Name of the phase
		"description" : "During the show",	// (string) 		Description 
		"roles" : [1,2,3]					// (opt. or []) Array of Role object indexes which are filtered to this phase
	}
],
```

## Media Item JSON

Each piece of footage captured in bootlegger is represented by a media object. This object stores all meta-data associated with the clip.

When submitting new media, or updating media that already exists, the following JSON structure is used:

```javascript
{
	"event_id": "234234asdasdasdasdasdasd",					// (string) ID of Shoot
	"meta": {													// meta-data associated with the clip
		//
		"static_meta": {
			"clip_length": "00:00:04.8888784",				// (timestamp)	Length in seconds of recording (specific format)
			"camera": "rear",								// (front|rear)	Camera used in the recording
			"zoom": "0",									// (string)	Zoom level at the start of the recording
			"captured_at": "25/08/2015 15:33:06.87 PM +01", // (date)	Date/Time stamp of when the media was captured (specific format)
			"meta_phase": "0",								// (string)	Shoto phase in which the clip was taken 
			"filesize": "7769.0",							// (string) Filesize in bytes
			"local_filename": "635761135868813470.mp4",		// (string) Filename on capture device
			"role": "5",									// (string)	Index of role that was selected when clip was captured 
			"media_type": "VIDEO",							// (VIDEO|PHOTO|AUDIO) Media type of recording
			"shot": "0",									// (string) Index of shot selected
			"coverage_class":3,								// (opt.) Index of coverage class that applies
			"shot_meta": "dave"								// (opt.) Content of specific coverage_class information applied to shot
		},
		
		//timed meta-data
		"timed_meta": {										// (object) Time-stamped entries in the form <key>_<value>
			"15:33:06.87":"key_value",
			"15:35:06.87":"zoom_34"
		}
	}
},
```

When retrieving media objects from the API, references to template attributes will be mapped into the following fields:

```javascript
"id": "234234asdasdasdasdasdasd",				// ID of clip
"originalpath": "http://",						// Full URL of original video
"lowres": "http://",							// Full URL of thumbnailed video
"filename": "http://",							// Full URL of original video
"originalthumb": "635761135868813470.mp4.png",	// Filename of image thumbnail
"nicepath": "15-33-06.87_Natalie_Cox.mp4" 		// Filename made with meta-data 
"user": {										// User who created media
	"profile": 
	{
		"displayName": "Natalie Cox"
	}
},
"phase_ex": {									//Phase
	"name": "Show",
	"description": "During the show"
},
"role_ex": {									//Role
	"name": "Unknown"
},
"shot_ex": {									//Shot
	"name": "Flyer Close Up",
	"max_length": 15,
	"wanted": "2",
	"image": "document_forward_detail_mid_straight.png",
	"icon": "document_forward_detail_mid_straight.png",
	"description": "Find a flyer or promo of the buskers and fill the frame.",
	"createdAt": "2015-03-11T10:07:16.000Z",
	"updatedAt": "2015-03-11T10:07:16.000Z",
	"id": 0,
	"footage": 8,
	"hidden": true
},
"coverage_class_ex": {							//Coverage Class
	"name": "Unknown"
}
```
## Micro-Edit JSON

Each micro-edit produced by bootlegger is represented by an edit object.

When submitting an edit, only the `title`, `description` and `media` fields are required.

```javascript
{
	"title": "Test Edit",						// (string) Title of the edit	
	"description": "",							// (string) Description of the edit
	"media": [],								// (Array)  Array of Media Objects to concatenate 2 <= n <= 15
	
	//returned after creation	
	"id": "234234asdasdasdasdasdasd",
	"user_id": "234234asdasdasdasdasdasd",		// ID of user who created the edit
	"code": "VykEzYVlg",						// Shortlink code
	"createdAt": "2015-10-12T11:01:34.780Z",	// When the edit was submitted
	"failed": false,							// True if the edit failed
	"path": "/tmp",								// Path to edited video (once complete)
	"progress": 100,							// Current editing progress
	"shortlink": "VykEzYVlg",					// Shortlink code
	"updatedAt": "2015-10-13T11:24:49.764Z",	// Last updated time
}
```

# Workflow Patterns

Some workflows require specific patterns of interaction, detailed below:

## Logging In

1. Call Login endpoint
2. Follow redirect to login page
3. Handle change of URL, or callback endpoint provided with the API key.
4. Use the returned session id as a cookie in subsequent calls to the api

## Uploading Media

1. Login and get session key
2. Create meta-data for media, returns an ID for the media
3. Obtain S3 PUT signed URL for this media
4. PUT content file to S3
5. Notify bootlegger file has been uploaded

For thumbnails, its the same process using the thumbnail enpoints.

## Auto-Director Integration

1. Login and get session key
2. List shoots available to user
3. Connect to shoot to obtain template
4. Download assets zip file if needed
5. Subscribe to websocket and shoot events
6. Select a role
7. Notify ready to shoot
8. Respond to incoming messages from server as detailed in the documentation
9. Upload meta-data, thumbnails and content when appropriate

## Template Design 

1. Login and get session key
2. Obtain a list of seed templates
3. Obtain a specific seed template from an ID
4. Edit this template offline
5. Create new shoot using this adjusted template

## Browsing and Updating Meta-Data

1. Login and get session key
2. List shoots available to user
3. Use selected shoot id to obtain list of media from shoot
4. Edit meta-data on a clip, and submit for update using media ID as reference