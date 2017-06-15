import * as builder from 'botbuilder';
import { BotFrameworkInstrumentation } from 'botbuilder-instrumentation';
var config = require('../../config');

//=========================================================
// Library creation
//=========================================================

// var historyBot = (function () {

var model;
var recognizer;
var intents;
var _lib = new builder.UniversalBot(undefined, undefined, 'historyBot');

// Setting up instrumentation
// const logging = new BotFrameworkInstrumentation({
//   instrumentationKey: process.env.APP_INSIGHTS_INSTRUMENTATION_KEYS.split(',')[2],
//   sentimentKey: process.env.CG_SENTIMENT_KEY,
// });
// logging.monitor(_lib);

_lib.localePath('./bots/history/locale/');
_lib.dialog('/', [
  function (session, results, next) {
    session.send(localize(session, "history-welcome"));
  }
]);

_lib.dialog('info', [
  function (session, results) {
    session.send(localize(session, "history-details"));
  }
]);

_lib.dialog('goback', [
  function (session, results) {
    session.endDialog(localize(session, "history-goback"));
  }
]);

export function createLibrary() {
  return _lib;
}

export function getName(session: builder.Session) {
  return localize(session, "history-name");
}

export function welcomeMessage(session: builder.Session) {
  return localize(session, "history-welcome");
}

export function localize(session: builder.Session, text: string) {
  return session.localizer.gettext(session.preferredLocale(), text);
}


export function initialize(locale: string, session: builder.Session) {
  _lib.connector(session.message.address.channelId, session.connector);
  // Create LUIS recognizer that points at our model for selected locale
  model = config.get('LUIS_modelBaseURL') + "?id=" + config.get('LUIS_applicationId_' + locale) + "&subscription-key=" + config.get('LUIS_subscriptionKey') + "&q=";

  var recognizer = new builder.LuisRecognizer(model);
  intents = new builder.IntentDialog({ recognizers: [recognizer] });
  intents.onDefault("historyBot:/")
  intents.matches('info', "historyBot:info");
  intents.matches('goback', "historyBot:goback");

  return intents;
};

//   return {
//     createLibrary: createLibrary,
//     getName: getName,
//     welcomeMessage: welcomeMessage,
//     initialize: initialize
//   }

// })();

// module.exports = historyBot;