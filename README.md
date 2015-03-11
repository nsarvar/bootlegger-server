# BootleggerServer
Bootlegger is a system to orchestrate multiple users capturing footage for a film shoot either. Multiple direction and commissioning engines are available including real-time shot allocation and individual user feedback on shot quality and their performance. 

Each user's native mobile application connects to a Bootlegger server, which coordinates their actions according to a pre-defined shoot templates.

## Other Features
- shot instructions
- dropbox integration to sync footage at the end of the shoot
- S3 backend for storing media

## Requirements
Bootlegger requires:

- Node.js
- MongoDB
- Websockets ([Socket.io](http://socket.io/))
- [SailsJS](http://sailsjs.org) (MVC Framework)

## Setting Up Development
- Install [Node.js](http://nodejs.org/) and [MongoDB](http://www.mongodb.org/)
> You might find installing [Ampps](http://www.ampps.com/downloads) helps with mongo, as it includes rockmongo, an admin ui for mongodb.

- Download files from Git
- Enter server directory
- Run `npm install`
- Copy config/local.example.js to config/local.js and fill in missing information, including your Mongo and Redis, Google and S3 connection details.

## Starting the Server
Running bootlegger on your local machine:
`node app.js`

Running Local Mode Server (4 digit code login) (without nginx to serve static resources): 
`node app.js --local`

Running a 'live' server:
`node app.js --production`

Pointing your browser at `http://localhost` will give you the website.

When using sails, you will have to close and restart the server after any changes to controller files `CTL+C`. Edits to view files should not require a restart.

## Editing
View files are located in `views\<controller>\<view>.ejs`
Controller logic is located in `api\controllers\<controller>.js`