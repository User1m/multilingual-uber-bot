import * as restify from 'restify';
import * as builder from 'botbuilder'
const uberBot = require('./uber-bot');
const config = require('./config');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
const server = restify.createServer();
server.use(restify.queryParser());

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: config.get('BOT_MicrosoftAppId'),
    appPassword: config.get('BOT_MicrosoftAppPassword')
});
const bot = uberBot.create(connector);

server.post('/api/messages', connector.listen());