const fs = require('fs');
const AoK = require('./AoK');

/**
 * Load strings file located at : <code>resources\*\strings\key-value\key-value-strings-utf8.txt</code>
 * @return {object} strings indexed by i18nName
 */
function loadStringsFile(path) {
    console.log("Chargement du fichier : "+path);

    const rx = /^(\w+) "(.*)"/i;
    const strings = {};

    fs.readFileSync(path, 'utf-8').split(/\r?\n/).forEach(line => {
        // Comment
        if (line.startsWith('//')) {
            return;
        }
        const m = rx.exec(line);
        // Donnée
        if (m) {
            const [matched, i18nName, string] = m;
            strings[i18nName] = string;
        }
    });

    console.log("Chargement terminé");
    return strings;
}

const i18n = {
    _unitTypes: undefined,

    /** see AoK file : resources\fr\strings\key-value\key-value-strings-utf8.txt */
    get unitTypes() {
        if (!this._unitTypes) {
            this._unitTypes = loadStringsFile('C:\\Program Files (x86)\\Jeux\\Steam\\steamapps\\common\\Age2HD\\resources\\fr\\strings\\key-value\\key-value-strings-utf8.txt');
        }
        return this._unitTypes;
    }
};

/**
 * Example :
 * <pre>5121 -&gt; 'Villagegois'</pre>
 * @param {string} i18nName i18nName of the UnitType we want to translate
 * @return {string} the unit name translated into the desired language, [i18nName] is undefined
 */
i18n.translateUnitTypeName = function(i18nName) {
    const name = i18n.unitTypes[i18nName];
    if (!name) {
        return `[${i18nName}]`;
    }
    return name;
};

/**
 * Détecte si une unité est inoccupée. Actuellement il semblerait que le jeu utilise le sprite actuel de l'unité (SLP)
 * pour savoir s'il correspond au sprite inoccupée (Standing Graphics) de l'unité. (cf Advanced Genie Editor)
 * @param {Unit} unit
 */
function isIdle(unit) {
    if (!(unit.currentGraphics && unit.type && unit.type.standingGraphics)) {
        return undefined;
    }
    return unit.currentGraphics === unit.type.standingGraphics;
}

const ECONOMY_UNITS = [
    AoK.UnitType.Index.VFBAS,
    AoK.UnitType.Index.VMBAS,
    AoK.UnitType.Index.VFLUM,
    AoK.UnitType.Index.VMLUM
];

/**
 * @param {Unit} unit
 * @return {boolean} true si l'unité est un villageois(e)
 */
function isEconomyUnit(unit) {
    return ECONOMY_UNITS.includes(unit.type.index);
}

module.exports = {
    i18n,
    isIdle,
    isEconomyUnit
};
