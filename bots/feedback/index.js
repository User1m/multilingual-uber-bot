"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const config = require('../../config');
var model;
var recognizer;
var intents;
var _lib = new builder.Library('feedbackBot');
_lib.localePath('./bots/feedback/locale/');
_lib.dialog('/', [
    function (session, results, next) {
        session.send(localize(session, "feedback-welcome"));
    }
]);
_lib.dialog('feedback', [
    function (session, results) {
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
function createLibrary() {
    return _lib;
}
exports.createLibrary = createLibrary;
function getName(session) {
    return localize(session, "feedback-name");
}
exports.getName = getName;
function welcomeMessage(session) {
    return localize(session, "feedback-welcome");
}
function localize(session, text) {
    return session.localizer.gettext(session.preferredLocale(), text);
}
exports.localize = localize;
function initialize(locale) {
    model = config.get('LUIS_modelBaseURL') + "?id=" + config.get('LUIS_applicationId_' + locale) + "&subscription-key=" + config.get('LUIS_subscriptionKey') + "&q=";
    intents = new builder.IntentDialog();
    intents.onDefault("feedbackBot:/");
    intents.matches(/^(feedback|retroalimentación)/i, "feedbackBot:feedback");
    intents.matches('info', "feedbackBot:info");
    intents.matches('goback', "feedbackBot:goback");
    return intents;
}
exports.initialize = initialize;
;
//# sourceMappingURL=index.js.map