import * as builder from 'botbuilder';
import { loggerSetCurrentBotName } from 'botbuilder-instrumentation'

var LOCALE_VAR = 'BotBuilder.Data.PreferredLocale';
var LANGUAGES: { [index: string]: string } = {
    "English": 'en',
    "Espanol": 'es'
};

// var languageLibrary = (function () {

var _lib = new builder.Library('languageLibrary');
var _bot: any;

_lib.dialog('change', [
    function (session, args, next) {
        loggerSetCurrentBotName(session, "languageLibraryBot")
        // session.send('Please choose a language \n\n Por favor, elige un idioma');
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

export function createLibrary(bot: builder.Library) {

    if (!bot) {
        throw 'Please provide a bot object';
    }

    _bot = bot;
    return _lib;
}

export function start() {
    _lib.beginDialogAction("change", 'languageLibrary:change')
}

export function changeLocale(session: builder.Session, options = {}) {
    // Start dialog in libraries namespace
    session.beginDialog('languageLibrary:change', options);
}

export function ensureLocale(session: builder.Session) {
    session.preferredLocale(session.userData[LOCALE_VAR]);
    _bot.settings.localizerSettings.defaultLocale = session.preferredLocale();
}

export function isLocaleSet(session: builder.Session) {
    return session.userData[LOCALE_VAR] || false;
}

export function localize(session: builder.Session, text: string) {
    return session.localizer.gettext(session.preferredLocale(), text);
}

    // return {
    //     createLibrary: createLibrary,
    //     changeLocale: changeLocale,
    //     ensureLocale: ensureLocale,
    //     isLocaleSet: isLocaleSet
    // };

// })();

// module.exports = languageLibrary;