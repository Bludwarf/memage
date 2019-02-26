'use strict';

/** @type AoKModule */
const aok = require('./lib/AoK');
const aokUtils = require('./lib/AoKUtils');
const {aokModule, ResourceType, UnitType} = aok;
const _ = require('underscore');
const cTable = require('console.table');
const moment = require('moment');
moment.locale('fr');
const {jStat} = require('jStat');

const LOOP = false;
const SPEED = 8;

/**
 * @param {[Unit]} units
 */
const unselectAll = (units) => units.forEach(unit => unit.selected = false);

function setResources() {
    aokModule.players.all.forEach((/** @type Player */player, i) => {
        if (player) {
            // Ressources
            if (player === aokModule.players.gaia) {
                // NOP
                console.log('On ne touche pas aux ressources de Gaia');
            }
            if (player === aokModule.players.player1) {
                aokModule.setAllResources(player.resources, 10000);
                player.resources.pop = 0;
                player.resources.popRestante = 500;
            } else {
                aokModule.setAllResources(player.resources, 0);
                player.resources.pop = 500;
                player.resources.popRestante = 0;
            }

            // Unités
            console.log('Le player #' + i + ' a ' + player.stateElse.units.length + ' unités');
        }
    });
}

let currentUnitIndex = -1;
/** @type Unit */
let currentUnit = undefined;

// console.log(aokModule.players.gaia.stateElse.units.length);

// units.forEach(unit => console.log(unit.hp));

const cycledUnits = aokModule.players.player1.stateElse.units;
unselectAll(cycledUnits);

function cycleSelect() {
    if (currentUnit) {
        // currentUnit.selected = false;
    }

    currentUnitIndex = (currentUnitIndex + 1) % cycledUnits.length;
    currentUnit = cycledUnits[currentUnitIndex];
    if (currentUnit) {
        console.log("Select unit " + currentUnitIndex, {hp: currentUnit.hp, x: currentUnit.x, y: currentUnit.y});
        // currentUnit.selected = true;
    } else {
        console.error('No unit ' + currentUnitIndex);
    }
}

// cycledUnits[5].resourceCount = 10000;
// cycledUnits[5].resourceType = ResourceType.FOOD;

// Passage en revue des unités possédées
// setInterval(() => {
//
//     cycleSelect();
// }, 1000);

// LOOP
if (LOOP) {
    setInterval(function () {

        const selectedUnit = aokModule.stateWithSelectedUnit.selectedUnit;
        if (selectedUnit) {
            const unitPlayer = selectedUnit.player;
            if (unitPlayer) {
                // Ennemi
                if (unitPlayer !== aokModule.players.player1) {
                    selectedUnit.hp = 0;
                } else {
                    // Bibi
                    selectedUnit.hp = selectedUnit.type.hp;
                }
            }
        }

    }, 50);
}


function concatIfDefined(...arrays) {
    let concat = [];
    arrays.forEach(array => {
        if (array) {
            concat = concat.concat(array);
        }
    });
    return concat;
}

/**
 * Affichage du message de la minicarte économique + commandes avancées
 * @param {Unit[]} units
 */
function showVillagers(units) {

    let msg = '';
    const unitsByTypeIndex = _.groupBy(units, unit => unit.type.index);
    console.log('unitsByTypeIndex:');
    console.table(_.keys(unitsByTypeIndex)
        .map(typeIndex => ({
            typeIndex,
            typeIndexName: UnitType.Index.name(+typeIndex),
            n: unitsByTypeIndex[typeIndex].length
        })));

    // Contrairement à Age II on compte les unités de commerce dans les villageois inoccupés
    const commerce = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.COGXX], unitsByTypeIndex[aok.UnitType.Index.TCART], unitsByTypeIndex[aok.UnitType.Index.TCARTF])
        .filter(unit => !aokUtils.isIdle(unit));
    if (commerce.length) {
        msg += `\nUnités de commerce : ${commerce.length}`;
    }

    const bergers = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFSHE], unitsByTypeIndex[aok.UnitType.Index.VMSHE])
        .filter(unit => !aokUtils.isIdle(unit));
    if (bergers.length) {
        msg += `\nBergers : ${bergers.length}`;
    }

    const pecheurs = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFFIS], unitsByTypeIndex[aok.UnitType.Index.VMFIS])
        .filter(unit => !aokUtils.isIdle(unit));
    if (pecheurs.length) {
        msg += `\nPêcheurs : ${pecheurs.length}`;
    }

    const idles = units
        .filter(unit => aokUtils.isEconomyUnit(unit))
        .filter(unit => aokUtils.isIdle(unit));
    if (idles.length) {
        msg += `\nVillageois inoccupés : ${idles.length}`;
    }

    const macons = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFBLD], unitsByTypeIndex[aok.UnitType.Index.VMBLD])
        .filter(unit => !aokUtils.isIdle(unit));
    if (macons.length) {
        msg += `\nMaçons : ${macons.length}`;
    }

    const fermiers = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFFAR], unitsByTypeIndex[aok.UnitType.Index.VMFAR])
        .filter(unit => !aokUtils.isIdle(unit));
    if (fermiers.length) {
        msg += `\nFermier : ${fermiers.length}`;
    }

    const chasseurs = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFHUN], unitsByTypeIndex[aok.UnitType.Index.VMHUN])
        .filter(unit => !aokUtils.isIdle(unit));
    if (chasseurs.length) {
        msg += `\nChasseur : ${chasseurs.length}`;
    }

    const bucherons = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFLUM], unitsByTypeIndex[aok.UnitType.Index.VMLUM])
        .filter(unit => !aokUtils.isIdle(unit));
    if (bucherons.length) {
        msg += `\nBûcheron : ${bucherons.length}`;
    }

    const mineurs = concatIfDefined(
        unitsByTypeIndex[aok.UnitType.Index.VFMIN],
        unitsByTypeIndex[aok.UnitType.Index.VMMIN],
        unitsByTypeIndex[aok.UnitType.Index.VFGLD],
        unitsByTypeIndex[aok.UnitType.Index.VMGLD])
        .filter(unit => !aokUtils.isIdle(unit));
    if (mineurs.length) {
        msg += `\nMineur : ${mineurs.length}`;
    }

    console.log(msg);
}

function clearConsole() {
    const lines = process.stdout.getWindowSize()[1];
    for (let i = 0; i < lines; i++) {
        console.log('\r\n');
    }
}

showVillagers(aokModule.players.player1.stateElse.units);

// const notifier = require('node-notifier');
//
// // Object
// notifier.notify(
//     {
//         'title': 'David Walsh Blog',
//         'subtitle': 'Daily Maintenance',
//         'message': 'Go approve comments in moderation!',
//         'icon': 'Terminal Icon',
//         'contentImage': 'blog.png',
//         'sound': 'ding.mp3',
//         'wait': true,
//         reply: true
//     },
//     function (error, response, metadata) {
//         console.log(response, metadata);
//     });

class ArrayUtils {

    /**
     *
     * @param {string|function} field
     * @param array
     * @return {*}
     */
    static sum(field, array) {
        const iteratee = ArrayUtils.getIteratee(field);
        return array.map(iteratee).reduce((a, b) => a + b, 0);
    }

    /**
     *
     * @param {string|function} field
     * @param array
     * @return {number}
     */
    static average(field, array) {
        const sum = ArrayUtils.sum(field, array);
        return sum / array.length;
    }

    /**
     * @param {string|function} o
     * @return {function} function to use with array.map to iterate over array items
     */
    static getIteratee(o) {
        if (typeof o === 'string') {
            return item => item[o];
        }
        if (typeof o === 'function') {
            return o;
        }
        throw new Error('Not Implemented');
    }
}

const STATES_MAX_LENGTH = 3600; // 1 heure
class ResourcesStats {

    /**
     *
     * @param {Player} player
     */
    constructor(player) {
        this.player = player;
        /** @type ResourcesStat[] */
        this.states = [];
    }

    static get STATES_MAX_LENGTH() {
        return STATES_MAX_LENGTH;
    }

    /**
     *
     * @param {ResourcesStat} currentState
     */
    push(currentState) {

        // Previous
        currentState.previous = this.states.length >= 1 ? this.states[this.states.length - 1] : undefined;

        // Limiter l'échantillonage
        if (this.states.length >= STATES_MAX_LENGTH) {
            this.states.shift();
        }

        // Ajout
        this.states.push(currentState);
    }

    /**
     * @param {number} size size is in game seconds
     * @return {ResourcesStats}
     */
    slice(size) {
        const slice = new ResourcesStats();
        slice.states = this.states.slice(Math.max(this.states.length - size, 0), this.states.length);
        return slice;
    }

    /**
     * @param {string|function} field
     * @return {number}
     */
    average(field) {
        return ArrayUtils.average(field, this.states);
    }

    print() {
        console.log(`Production moyenne par paysan: (t. jeu : ${moment.duration(this.states.length*1000).humanize()}`);

        // Paysans
        const units = this.player.stateElse.units;
        const gatherers = {
            bois: aokUtils.getWoodGatherers(units),
            nourriture: aokUtils.getFoodGatherers(units),
            or: aokUtils.getGoldGatherers(units).concat(aokUtils.getTradeUnits(units)),
            pierre: aokUtils.getStoneGatherers(units)
        };

        // Stats
        const getTableStat = (field, slice) => {
            const gatherers2 = gatherers[field];
            const average = (gatherers2.length) ? slice.average(stat => stat.delta(field)) : 0;
            const averageByVillager = (average / gatherers2.length).toFixed(2);
            return `${average.toFixed(2)}/${gatherers2.length}=${averageByVillager}`;
        };
        const slicesInfos = [
            {name: ' 1 min',   size: 60},
            {name: ' 5 mins',  size: 5*60},
            {name: '10 mins', size: 10*60},
            {name: ' 1 h',     size: 3600}
        ];
        const table = [];
        slicesInfos.forEach(sliceInfos => {
            const slice = this.slice(sliceInfos.size);
            table.push({
                interval: sliceInfos.name,
                deltaBois:       getTableStat('bois', slice),
                deltaNourriture: getTableStat('nourriture', slice),
                deltaOr:         getTableStat('or', slice),
                deltaPierre:     getTableStat('pierre', slice)
            })
        });

        console.table(table);
    }
}

class ResourcesStat {

    /**
     * @param {Resources} resources
     */
    constructor(resources) {
        this.realTime = new Date();
        this.bois = resources.bois;
        this.nourriture = resources.nourriture;
        this.or = resources.or;
        this.pierre = resources.pierre;
        this.pop = resources.pop;
        this.popTotale = resources.pop + resources.popRestante;
        /** @type ResourcesStat */
        this.previous = undefined;
    }

    delta(field) {
        return this.previous ? this[field] - this.previous[field] : 0;
    }
}

// TODO : limiter
/** one line / second (time in the game) */
const stats = new ResourcesStats(aokModule.players.player1);
setInterval(() => {

    // Capture de l'état actuel pour les stats futures
    const currentState = new ResourcesStat(aokModule.players.player1.resources);

    // Sauvegarde
    stats.push(currentState);

    // Affichage
    stats.print();

}, 1000 / SPEED);
