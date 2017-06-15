"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const botbuilder_instrumentation_1 = require("botbuilder-instrumentation");
var LOCALE_VAR = 'BotBuilder.Data.PreferredLocale';
var LANGUAGES = {
    "English": 'en',
    "Espanol": 'es'
};
var _lib = new builder.Library('languageLibrary');
var _bot;
_lib.dialog('change', [
    function (session, args, next) {
        botbuilder_instrumentation_1.loggerSetCurrentBotName(session, "languageLibraryBot");
        builder.Prompts.choice(session, 'Please choose a language \n\n Por favor, elige un idioma', Object.keys(LANGUAGES));
    },
    function (session, results, next) {
        session.userData[LOCALE_VAR] = LANGUAGES[results.response.entity];
        session.preferredLocale(session.userData[LOCALE_VAR]);
        _bot.settings.localizerSettings.defaultLocale = session.preferredLocale();
        session.send(localize(session, 'languageLibrary:language-change-success'));
        session.endDialog();
    }
]);
function createLibrary(bot) {
    if (!bot) {
        throw 'Please provide a bot object';
    }
    _bot = bot;
    return _lib;
}
exports.createLibrary = createLibrary;
function start() {
    _lib.beginDialogAction("change", 'languageLibrary:change');
}
exports.start = start;
function changeLocale(session, options = {}) {
    session.beginDialog('languageLibrary:change', options);
}
exports.changeLocale = changeLocale;
function ensureLocale(session) {
    session.preferredLocale(session.userData[LOCALE_VAR]);
    _bot.settings.localizerSettings.defaultLocale = session.preferredLocale();
}
exports.ensureLocale = ensureLocale;
function isLocaleSet(session) {
    return session.userData[LOCALE_VAR] || false;
}
exports.isLocaleSet = isLocaleSet;
function localize(session, text) {
    return session.localizer.gettext(session.preferredLocale(), text);
}
exports.localize = localize;
//# sourceMappingURL=languageLibrary.js.map