'use strict';

// Nourriture
const {resources} = require('./lib/AoK');
console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));
resources.pop = 0;
resources.popRestante = 500;
resources.nourriture = 10000;
console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));
