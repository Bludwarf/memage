'use strict';

const {playerParent, players, setAllResources, stateWithSelectedUnit} = require('./lib/AoK');

playerParent.player.resources.nourriture = 1000;
playerParent.player.resources.bois = 1000;

players.elements.forEach(/** @type Player */ player => {
    if (player) {
        setAllResources(player.resources, 0);
        player.resources.pop = 500;
    }
});


// LOOP
setInterval(function () {

    const selectedUnit = stateWithSelectedUnit.selectedUnit;
    if (selectedUnit) {
        const unitPlayer = selectedUnit.player;
        if (unitPlayer) {
            // Ennemi
            if (unitPlayer !== players.player1) {
                selectedUnit.hp = 0;
            }
        }
    }

}, 50);
