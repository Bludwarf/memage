'use strict';

// noinspection JSUnusedLocalSymbols
const {Struct, Type} = require('./cReflection');
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
const process = processes[0];

// Module
const modules = process.getModules(processName);
if (!modules.length) {
    throw new Error("Module AoK HD.exe introuvable !");
}
if (modules.length > 1) {
    throw new Error("Module AoK HD.exe non unique !");
}
const moduleAoK = modules[0].getBase();

// TODO check 32/64 bits

// Memory
let memory = Memory(process);

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
    .addField(Type.float, 'pop', 11 * Type.float.size);

// TODO : forcer l'argument offset, changer l'ordre et le type REAL :  addField(0x04, 'nourriture', Type.FLOAT | Type.REAL)
// TODO : remplacer l'instanciation new Struct par la création auto de classe héritant de Struct
// TODO : rendre memory static pour faciliter la création des instances de Struct

/**
 * @typedef Player
 * @property {Resources} resources état des ressources du joueur
 */
const Player = new Struct('Player')
    .addField(Resources.pointer, 'resources', 0x3C);

/**
 * @typedef PlayerParent
 * @property {Player} player the player
 */
const PlayerParent = new Struct('PlayerParent')
    .addField(Player.pointer, 'player', 0x134);

/**
 * @type {PlayerParent}
 * @property player
 */
const playerParent = PlayerParent.pointer.read(memory, moduleAoK + 0x6F4170);

module.exports = {
    playerParent
};
