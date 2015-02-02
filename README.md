# Bootlegger Server
Bootlegger is a system to orchestrate multiple users capturing footage for a film shoot either. Multiple direction and commissioning engines are available including real-time shot allocation and individual user feedback on shot quality and their performance. 

Each user's native mobile application connects to a Bootlegger server, which coordinates their actions according to a pre-defined shoot templates.

The server runs on a server (or multiple servers using bootlegger-loadbalancer). Film shoots are created, commissioned and footage retrieved using the web interface.

Participants can join the film shoot using the mobile application, which connects to the bootlegger server receiving instructions for requesting shots from the user and uploading video back to the server.

Bootlegger is still under development, and the documentation will be added to over time as development progresses.

There is currently a permanent installation of bootlegger-server at https://bootlegger.tv for anyone to use.

## Other Features
- Shot instructions (HTML formatted)
- Dropbox integration to sync footage at the end of the shoot
- S3 backend for storing media centrally.

## Requirements
Bootlegger requires:

- Node.js
- MongoDB
- Redis
- Nginx / Other static reverse proxy.
- Google API key
- Dropbox API key
- Amazon S3 account

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

Pointing your browser at `http://localhost` will give you the main website.

When using sails, you will have to close and restart the server after any changes to controller files `CTL+C`. Edits to view files should not require a restart.

## Bootlegger Server is based on SailsJS
SailsJS is an MVC framaework for node.js which transparently integrates http and websockets connections. All bootlegger logic and website functionality is written in sails.js.

View files are located in `views\<controller>\<view>.ejs`
Controller logic is located in `api\controllers\<controller>.js`