'use strict';

/** @type AoKModule */
const aok = require('./lib/AoK');

aok.players.elements.forEach(/** @type Player */ player => {
    if (player) {
        if (player === aok.players.player1) {
            aok.setAllResources(player.resources, 10000);
            player.resources.pop = 0;
            player.resources.popRestante = 500;
        } else {
            aok.setAllResources(player.resources, 0);
            player.resources.pop = 500;
            player.resources.popRestante = 0;
        }
    }
});


// LOOP
setInterval(function () {

    const selectedUnit = aok.stateWithSelectedUnit.selectedUnit;
    if (selectedUnit) {
        const unitPlayer = selectedUnit.player;
        if (unitPlayer) {
            // Ennemi
            if (unitPlayer !== aok.players.player1) {
                selectedUnit.hp = 0;
            } else {
                // Bibi
                selectedUnit.hp = selectedUnit.type.hp;
            }
        }
    }

}, 50);
