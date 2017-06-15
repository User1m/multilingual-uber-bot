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
function create(connector) {
    var bot = new builder.UniversalBot(connector, undefined, "UberBot");
    const logging = new botbuilder_instrumentation_1.BotFrameworkInstrumentation({
        instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
        sentimentKey: process.env.CG_SENTIMENT_KEY,
    });
    logging.monitor(bot);
    bot.set('localizerSettings', {
        botLocalePath: "./locale",
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
                (session.sessionState.callstack.length > 0) ? session.cancelDialog(0, 'change') : session.beginDialog('change');
            }
            else if (message.match(/^(cancel|cancelar)/i)) {
                session.endConversation(localize('conversation-end'));
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
            languageLibrary.changeLocale(session);
        },
        (session, args, next) => {
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
            if (selectedBot.welcomeMessage) {
                session.send(welcomeMessage);
                session.sendTyping();
                session.beginDialog(botKey);
            }
            else {
                session.send(welcomeMessage);
                bot.beginDialog(session.message.address, botKey);
            }
        }
    ];
    var intents = new builder.IntentDialog();
    bot.dialog('change', changeLocale);
    bot.dialog('/', intents);
    intents.onDefault([
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