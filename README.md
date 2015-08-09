# BootleggerServer
Bootlegger is a system to orchestrate multiple users capturing footage for a film shoot either. Multiple direction and commissioning engines are available including real-time shot allocation and individual user feedback on shot quality and their performance. 

Each user's native mobile application connects to a Bootlegger server, which coordinates their actions according to a pre-defined shoot templates.

![](architecture.png "Bootlegger Architecture")

## Requirements
Bootlegger requires:

- Node.js https://nodejs.org/
- MongoDB https://www.mongodb.org/
- Redis http://redis.io/
- Google Developer Account (optional)
- Facebook Developer Account (optional)
- Dropbox Developer Account (optional)
- Beanstalk http://kr.github.io/beanstalkd/
- Amazon S3 Account
- Amazon Elastic Transcoder Account

## Setting Up Development
- Install all services
> You might find installing [Ampps](http://www.ampps.com/downloads) helps with mongo, as it includes rockmongo, an admin ui for mongodb.


- Clone from Git
- Enter server directory
- Run `npm install`
- Copy config/local.example.js to config/local.js and fill in missing information, including your Mongo and Redis, Google and S3 connection details.

## Starting the Server
Running bootlegger on your local machine:
`node app.js`

Running a 'live' server:
`node app.js --production`

Pointing your browser at `http://localhost` will give you the website.

When using sails, you will have to close and restart the server after any changes to controller files `CTL+C`. Edits to view files should not require a restart.

## Editing
View files are located in `views\<controller>\<view>.ejs`
Controller logic is located in `api\controllers\<controller>.js`