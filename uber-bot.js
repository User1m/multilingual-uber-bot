"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const builder = require("botbuilder");
const languageLibrary = require("./languageLibrary");
const botbuilder_instrumentation_1 = require("botbuilder-instrumentation");
require('dotenv').config();
var SESSION;
var bots = [];
function localize(text) {
    return (SESSION) ? SESSION.localizer.gettext(SESSION.preferredLocale(), text) : "Whoops! Something went wrong";
}
const BotName = "UberBot";
function create(connector) {
    var bot = new builder.UniversalBot(connector, undefined, BotName);
    let customData = {
        name: "Claudius",
        age: 24
    };
    const logger = new botbuilder_instrumentation_1.BotFrameworkInstrumentation({
        instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
        sentimentKey: process.env.CG_SENTIMENT_KEY,
        autoLogOptions: {
            autoCollectConsole: true,
            autoCollectExceptions: true,
            autoCollectRequests: true,
            autoCollectPerf: true
        }
    });
    logger.monitor(bot);
    logger.setCustomFields(customData);
    bot.set('localizerSettings', {
        botLocalePath: __dirname + "/locale",
        defaultLocale: "en"
    });
    bot.library(languageLibrary.createLibrary(bot));
    bot.use({
        botbuilder: function (session, next) {
            SESSION = session;
            var message = session &&
                session.message &&
                session.message.text &&
                session.message.text.toLowerCase() || '';
            message = message.trim();
            if (message.match(/^(change|cambia|home|casa)/i)) {
                customData["requestedBot"] = BotName;
                session.userData["CLAUDIUS"] = `I SET THIS - ${bot.name}`;
                session.clearDialogStack();
                (session.sessionState.callstack.length > 0) ? session.cancelDialog(0, 'change') : session.beginDialog('change');
            }
            else if (message.match(/^(cancel|cancelar)/i)) {
                customData["MBEMBA"] = "Updating custom data object";
                session.userData["CLAUDIUS"] = `I RESET THIS - ${bot.name}`;
                session.clearDialogStack();
                (session.sessionState.callstack.length > 0) ? session.cancelDialog(0, 'change') : session.beginDialog('change');
            }
            else if (message.match(/^(reset)/i)) {
                session.privateConversationData = {};
                session.userData = {};
                session.conversationData = {};
                session.clearDialogStack();
            }
            else {
                var goBot = bots.find(function (bot) {
                    return ('go ' + bot.getName(session).toLowerCase() == message);
                });
                if (goBot) {
                    session.conversationData.nextBot = goBot.getName(session);
                }
                else {
                    next();
                }
            }
        }
    });
    function getDirectories(srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isDirectory();
        });
    }
    var botDirectories = getDirectories('./bots');
    for (var dirIdx in botDirectories) {
        var dirName = botDirectories[dirIdx];
        var childBot = require('./bots/' + dirName);
        bots.push(childBot);
        bot.library(childBot.createLibrary());
    }
    bot.dialog('home', [
        function (session, results) {
            session.endDialog(localize("locale-home"));
        }
    ]);
    var changeLocale = [
        (session, results, next) => {
            logger.setCustomFields(session.userData, "CLAUDIUS");
            languageLibrary.changeLocale(session);
            console.log("\nLangChoice: ", session.preferredLocale());
            customData["langChoice"] = session.preferredLocale();
        },
        (session, args, next) => {
            botbuilder_instrumentation_1.setCurrentBotName(session, bot.name);
            if (!session.conversationData.nextBot) {
                var botNames = bots.map(function (bot) { return bot.getName(session); });
                builder.Prompts.choice(session, localize('what-to-do'), botNames);
            }
            else {
                next();
            }
        },
        (session, args, next) => {
            var requestedBot = session.conversationData.nextBot || args.response.entity;
            console.log("\nRequestedBot: ", args.response.entity);
            customData["requestedBot"] = args.response.entity;
            delete session.conversationData.nextBot;
            var selectedBot = bots.find(function (bot) { return bot.getName(session) == requestedBot; });
            var locale = session.preferredLocale();
            var botKey = 'locale-' + locale + '-' + requestedBot;
            if (!bot.dialog(botKey)) {
                var localeIntents = selectedBot.initialize(locale);
                bot.dialog(botKey, localeIntents);
            }
            var welcomeMessage = (selectedBot.welcomeMessage) ?
                selectedBot.welcomeMessage(session) : "Welcome to the " + requestedBot + " bot!";
            logger.logCustomEvent(`${requestedBot} - Welcome Message`, session, { foo: "bar", life: 42 });
            if (selectedBot.welcomeMessage) {
                session.send(welcomeMessage);
                session.sendTyping();
                session.beginDialog(botKey);
            }
            else {
                session.send(welcomeMessage);
                session.beginDialog(botKey);
            }
        }
    ];
    var intents = new builder.IntentDialog();
    bot.dialog('change', changeLocale);
    bot.dialog('/', intents);
    intents.onDefault([
        function (session, args, next) {
            botbuilder_instrumentation_1.setCurrentBotName(session, bot.name);
            next();
        },
        ...changeLocale,
        function (session, args, next) {
            session.send(localize('master-dialog-done'));
        }
    ]);
    return bot;
}
exports.create = create;
;
//# sourceMappingURL=uber-bot.js.map