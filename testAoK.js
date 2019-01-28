'use strict';

/** @type AoKModule */
const aok = require('./lib/AoK');
const {aokModule, ResourceType} = aok;
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
            console.log('Le player #'+i+' a '+player.stateElse.units.length+' unités');
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
        console.log("Select unit "+currentUnitIndex, {hp: currentUnit.hp, x: currentUnit.x, y: currentUnit.y});
        // currentUnit.selected = true;
    } else {
        console.error('No unit '+currentUnitIndex);
    }
}

// cycledUnits[5].resourceCount = 10000;
// cycledUnits[5].resourceType = ResourceType.FOOD;

// Passage en revue des unités possédées
setInterval(() => {

    cycleSelect();
}, 1000);

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
