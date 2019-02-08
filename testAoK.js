'use strict';

/** @type AoKModule */
const aok = require('./lib/AoK');
const aokUtils = require('./lib/AoKUtils');
const {aokModule, ResourceType} = aok;
const _ = require('underscore');
const LOOP = false;

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

    const bergers = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFSHE], unitsByTypeIndex[aok.UnitType.Index.VMSHE])
        .filter(unit => !aokUtils.isIdle(unit));
    if (bergers.length) {
        msg += `\nBergers : ${bergers.length}`;
    }

    const macons = concatIfDefined(unitsByTypeIndex[aok.UnitType.Index.VFBLD], unitsByTypeIndex[aok.UnitType.Index.VMBLD])
        .filter(unit => !aokUtils.isIdle(unit));
    if (macons.length) {
        msg += `\nMaçons : ${macons.length}`;
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

    const idles = units
        .filter(unit => aokUtils.isEconomyUnit(unit))
        .filter(unit => aokUtils.isIdle(unit));
    if (idles.length) {
        msg += `\nVillageois inoccupés : ${idles.length}`;
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
