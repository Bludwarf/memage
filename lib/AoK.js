'use strict';

// noinspection JSUnusedLocalSymbols
const {Struct, Type} = require('./cReflection');
// Must be defined before creating structure
Struct.PTR_SIZE = 4;
const {Process, Memory} = require("robot-js");



// Process
const processName = `AoK HD.exe`;
const processes = Process.getList(processName);
if (!processes.length) {
    throw new Error("Processus AoK HD.exe introuvable !");
}
if (processes.length > 1) {
    throw new Error("Processus AoK HD.exe non unique !");
}
const processAoK = processes[0];

// Module
const modules = processAoK.getModules(processName);
if (!modules.length) {
    throw new Error("Module AoK HD.exe introuvable !");
}
if (modules.length > 1) {
    throw new Error("Module AoK HD.exe non unique !");
}
const moduleAoK = modules[0].getBase();

// Memory
let memory = Memory(processAoK);


/**
 * @typedef Resources
 * @property {float} nourriture
 * @property {float} bois
 * @property {float} pierre
 * @property {float} or
 * @property {float} pop
 * @property {float} popRestante
 */
const Resources = new Struct('Resources')
    .addField(Type.float, 'nourriture')
    .addField(Type.float, 'bois')
    .addField(Type.float, 'pierre')
    .addField(Type.float, 'or')
    .addField(Type.float, 'popRestante')
    .addField(Type.float, 'pop', 11 * Type.float.size)
    .getClass();

/**
 * @typedef Player
 * @property {Resources} resources état des ressources du joueur
 */
const Player = new Struct('Player')
    .addField(Resources.struct.pointer, 'resources', 0x3C)
    .getClass();

/**
 * @typedef PlayerParent
 * @property {Player} player the player
 */
const PlayerParent = new Struct('PlayerParent')
    .addField(Player.struct.pointer, 'player', 0x134)
    .getClass();

/**
 * @type {PlayerParent}
 */
const playerParent = PlayerParent.struct.pointer.read(memory, moduleAoK + 0x6F4170);

module.exports = {
    playerParent
};
