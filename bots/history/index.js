"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const botbuilder_instrumentation_1 = require("botbuilder-instrumentation");
var config = require('../../config');
var model;
var recognizer;
var intents;
var _lib = new builder.Library('historyBot');
_lib.localePath('./bots/history/locale/');
_lib.dialog('/', [
    function (session, results, next) {
        botbuilder_instrumentation_1.loggerSetCurrentBotName(session, "feedBackBot");
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
function createLibrary() {
    return _lib;
}
exports.createLibrary = createLibrary;
function getName(session) {
    return localize(session, "history-name");
}
exports.getName = getName;
function welcomeMessage(session) {
    return localize(session, "history-welcome");
}
exports.welcomeMessage = welcomeMessage;
function localize(session, text) {
    return session.localizer.gettext(session.preferredLocale(), text);
}
exports.localize = localize;
function initialize(locale, session) {
    model = config.get('LUIS_modelBaseURL') + "?id=" + config.get('LUIS_applicationId_' + locale) + "&subscription-key=" + config.get('LUIS_subscriptionKey') + "&q=";
    var recognizer = new builder.LuisRecognizer(model);
    intents = new builder.IntentDialog({ recognizers: [recognizer] });
    intents.onDefault("historyBot:/");
    intents.matches('info', "historyBot:info");
    intents.matches('goback', "historyBot:goback");
    return intents;
}
exports.initialize = initialize;
;
//# sourceMappingURL=index.js.map