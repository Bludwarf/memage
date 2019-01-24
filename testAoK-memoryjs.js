'use strict';

// const {playerParent} = require('./lib/AoK');
//
// console.log(playerParent.__proto__);
// console.log(playerParent.player.__proto__);
// console.log(playerParent.player.resources.__proto__);
// console.log(playerParent.player.resources.bois);
// playerParent.player.resources.bois = 10000;
// console.log(playerParent.player.resources.bois);

// IMPORTANT Require Node 10.X.X
const memoryjs = require('memoryjs');

// Process
/**
 * @property {number} dwSize example: 304
 * @property {number} th32ProcessID example: 15912
 * @property {number} cntThreads example: 17
 * @property {number} th32ParentProcessID example: 4612
 * @property {number} pcPriClassBase example: 8
 * @property {string} szExeFile example: 'AoK HD.exe'
 * @property {number} handle example: 456
 * @property {number} modBaseAddr example: 1703936
 */
const processAoK = memoryjs.openProcess(`AoK HD.exe`);

// Module
/**
 * @property {number} modBaseAddr example : 1703936
 * @property {number} modBaseSize example : 10764288
 * @property {string} szExePath example : 'C:\\Program Files (x86)\\Jeux\\Steam\\steamapps\\common\\Age2HD\\AoK HD.exe'
 * @property {string} szModule example : 'AoK HD.exe'
 * @property {number} th32ModuleID example : 15912
 */
const moduleAoK = memoryjs.findModule('AoK HD.exe', processAoK.th32ProcessID);

const playerParent$ = memoryjs.readMemory(processAoK.handle, moduleAoK + 0x6F4170, memoryjs.POINTER);
console.log(`${playerParent$.toString(16).toUpperCase()}`);
const player$ = memoryjs.readMemory(processAoK.handle, playerParent$ + 0x134, memoryjs.POINTER);
console.log(`${player$.toString(16).toUpperCase()}`);
const resources$ = memoryjs.readMemory(processAoK.handle, player$ + 0x3c, memoryjs.POINTER);
console.log(`${resources$.toString(16).toUpperCase()}`);
const food = memoryjs.readMemory(processAoK.handle, resources$ + 0x0, memoryjs.FLOAT);
console.log(`${resources$.toString(16).toUpperCase()}: ${food}`);
