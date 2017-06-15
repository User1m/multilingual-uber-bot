import * as builder from 'botbuilder';
import { BotFrameworkInstrumentation } from 'botbuilder-instrumentation';
const config = require('../../config');

//=========================================================
// Library creation
//=========================================================

// var feedbackBot = (function () {

var model;
var recognizer;
var intents;
var _lib = new builder.UniversalBot(undefined, undefined, 'feedbackBot');

// Setting up instrumentation
const logging = new BotFrameworkInstrumentation({
    instrumentationKey: process.env.APP_INSIGHTS_INSTRUMENTATION_KEYS.split(',')[1],
    sentimentKey: process.env.CG_SENTIMENT_KEY,
});
logging.monitor(_lib);

_lib.localePath('./bots/feedback/locale/');
_lib.dialog('/', [
    function (session, results, next) {
        logging.logCustomEvent(localize(session, 'feedback-welcome'), null)
        session.send(localize(session, "feedback-welcome"));
    }
]);

_lib.dialog('feedback', [
    function (session, results) {
        logging.logCustomEvent(localize(session, 'feedback-message'), null)
        session.send(localize(session, 'feedback-message'));
    }
]);

_lib.dialog('info', [
    function (session, results) {
        session.send(localize(session, "feedback-details"));
    }
]);

_lib.dialog('goback', [
    function (session, results) {
        session.endDialog(localize(session, "feedback-goback"));
    }
]);

export function createLibrary() {
    return _lib;
}

export function getName(session: builder.Session) {
    return localize(session, "feedback-name");
}

function welcomeMessage(session: builder.Session) {
    return localize(session, "feedback-welcome");
}

export function localize(session: builder.Session, text: string) {
    return session.localizer.gettext(session.preferredLocale(), text);
}

export function initialize(locale: string, session: builder.Session) {
    _lib.connector(session.message.address.channelId, session.connector);
    _lib.loadSession(session.message.address, (err, session) => {
        if (!err) {
            console.log("Successfull");
        }
    })
    // Create LUIS recognizer that points at our model for selected locale
    model = config.get('LUIS_modelBaseURL') + "?id=" + config.get('LUIS_applicationId_' + locale) + "&subscription-key=" + config.get('LUIS_subscriptionKey') + "&q=";

    intents = new builder.IntentDialog();
    intents.onDefault("feedbackBot:/");
    intents.matches(/^(feedback|retroalimentación)/i, "feedbackBot:feedback");
    intents.matches('info', "feedbackBot:info");
    intents.matches('goback', "feedbackBot:goback");
    // .onDefault(builder.DialogAction.send("I'm sorry. I didn't understand."))
    return intents;
};

//     return {
//         createLibrary: createLibrary,
//         getName: getName,
//         welcomeMessage: welcomeMessage,
//         initialize: initialize
//     }

// })();

// module.exports = feedbackBot;