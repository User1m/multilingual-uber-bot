import * as fs from 'fs';
import * as path from 'path';
import * as builder from 'botbuilder';
import * as languageLibrary from './languageLibrary'
import { loggerSetCurrentBotName, BotFrameworkInstrumentation } from 'botbuilder-instrumentation'

require('dotenv').config()

var SESSION: builder.Session;
var bots: Array<any> = [];

function localize(text: string) {
    return (SESSION) ? SESSION.localizer.gettext(SESSION.preferredLocale(), text) : "Whoops! Something went wrong";
}

const BotName: string = "UberBot";

export function create(connector: builder.IConnector) {
    // Defining the default language as english
    var bot: builder.UniversalBot = new builder.UniversalBot(connector, undefined, BotName);
    let customData = {
        name: "Claudius",
        age: 24
    }
    // Setting up instrumentation
    const logger = new BotFrameworkInstrumentation({
        instrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
        sentimentKey: process.env.CG_SENTIMENT_KEY,
    });
    logger.monitor(bot);
    logger.setCustomFields(customData);


    bot.set('localizerSettings', {
        botLocalePath: "./locale",
        defaultLocale: "en"
    });

    // Adding language change library to bot
    bot.library(languageLibrary.createLibrary(bot));

    // Adding middleware to intercept all received messages
    bot.use({
        botbuilder: function(session, next) {
            SESSION = session;
            var message = session &&
                session.message &&
                session.message.text &&
                session.message.text.toLowerCase() || '';

            message = message.trim();

            if (message.match(/^(change|cambia|home|casa)/i)) {
                customData["requestedBot"] = BotName;
                (session.sessionState.callstack.length > 0) ? session.cancelDialog(0, 'change') : session.beginDialog('change');
            } else if (message.match(/^(cancel|cancelar)/i)) {
                customData["requestedBot"] = BotName; w
                session.endConversation(localize('conversation-end'))
            }
            else {
                // Find the corresponding bot
                var goBot = bots.find(function(bot) {
                    return ('go ' + bot.getName(session).toLowerCase() == message);
                });

                if (goBot) {
                    // This will ensure that the next bot will be the one requested
                    session.conversationData.nextBot = goBot.getName(session);
                } else {
                    next();
                }
            }
        }
    });

    // Loop through bots in the /bots directory and add them as sub bots
    function getDirectories(srcpath: string) {
        return fs.readdirSync(srcpath).filter(function(file) {
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
        function(session, results) {
            session.endDialog(localize("locale-home"));
        }
    ])

    var changeLocale = [
        // Prompting the user to choose a language
        (session: builder.Session, results: any, next: any) => {
            // logger.logCustomEvent("Change Language", session, { foo: "bar", life: 41 });
            languageLibrary.changeLocale(session);
            console.log("\nLangChoice: ", session.preferredLocale())
            customData["langChoice"] = session.preferredLocale()
        },
        // // Offering the user a bot to choose from
        (session: builder.Session, args: any, next: any) => {
            if (!session.conversationData.nextBot) {
                var botNames = bots.map(function(bot) { return bot.getName(session); });
                builder.Prompts.choice(session, localize('what-to-do'), botNames);
            } else {
                next();
            }
        },
        // Setting up next bot and directing to dialog
        (session: builder.Session, args: any, next: any) => {

            var requestedBot = session.conversationData.nextBot || args.response.entity;
            console.log("\nRequestedBot: ", args.response.entity)
            customData["requestedBot"] = args.response.entity;

            delete session.conversationData.nextBot;

            var selectedBot = bots.find(function(bot) { return bot.getName(session) == requestedBot; });
            var locale = session.preferredLocale();
            var botKey = 'locale-' + locale + '-' + requestedBot;

            if (!bot.dialog(botKey)) {
                var localeIntents = selectedBot.initialize(locale);
                bot.dialog(botKey, localeIntents);
            }

            //welcome message
            var welcomeMessage: string = (selectedBot.welcomeMessage) ?
                selectedBot.welcomeMessage(session) : "Welcome to the " + requestedBot + " bot!";

            logger.logCustomEvent(`${requestedBot} - Welcome Message`, session, { foo: "bar", life: 42 });

            if (selectedBot.welcomeMessage) {
                session.send(welcomeMessage);
                session.sendTyping();
                session.beginDialog(botKey);
            } else {
                session.send(welcomeMessage);
                bot.beginDialog(session.message.address, botKey)
                // var msgTrigger = new builder.Message()
                //     .text('/')
                //     .address(session.message.address);

                // // mock the receiving of the message that triggers intent InitiateContact
                // bot.receive(msgTrigger.toMessage());
            }

        }
    ]

    var intents = new builder.IntentDialog()

    bot.dialog('change', changeLocale)
    bot.dialog('/', intents)

    intents.onDefault([
        ...changeLocale,
        function(session, args, next) {
            session.send(localize('master-dialog-done'));
        }
    ]);

    return bot;
};
