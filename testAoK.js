'use strict';

const {playerParent} = require('./lib/AoK');

console.log(playerParent.__proto__);
console.log(playerParent.player.__proto__);
console.log(playerParent.player.resources.__proto__);
console.log(playerParent.player.resources.bois);
playerParent.player.resources.nourriture = 1000;
playerParent.player.resources.bois = 1000;
console.log(playerParent.player.resources.bois);
