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
 * @property {Player} player the current player that runs the game on this computer ? (= players.player1)
 */
const PlayerParent = new Struct('PlayerParent')
    .addField(Player.struct.pointer, 'player', 0x134)
    .getClass();

/**
 * @type {PlayerParent}
 */
const playerParent = PlayerParent.struct.pointer.read(memory, moduleAoK + 0x6F4170);
// TODO create a Super Struct for module



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Players
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef ArrayOfPlayers
 * @property {Player} player1
 * @property {Player} player2
 * @property {Player} player3
 * @property {Player} player4
 * @property {Player} player5
 * @property {Player} player6
 * @property {Player} player7
 * @property {Player} player8
 */
const ArrayOfPlayers = new Struct('ArrayOfPlayers')
    .addField(Player.struct.pointer, 'player1', 0x08)
    .addField(Player.struct.pointer, 'player2', 0x10)
    .addField(Player.struct.pointer, 'player3', 0x18)
    .addField(Player.struct.pointer, 'player4', 0x20)
    .addField(Player.struct.pointer, 'player5', 0x28)
    .addField(Player.struct.pointer, 'player6', 0x30)
    .addField(Player.struct.pointer, 'player7', 0x38)
    .addField(Player.struct.pointer, 'player8', 0x40)
    .getClass();

// TODO extends Array
/**
 * @property {[Player]} ArrayOfPlayers.elements
 */
Object.defineProperty(ArrayOfPlayers.prototype, 'elements', {
    get: function() {
        return [
            this.player1,
            this.player2,
            this.player3,
            this.player4,
            this.player5,
            this.player6,
            this.player7,
            this.player8
        ]
    }
});

/**
 * @typedef StateWithPlayers
 * @property {ArrayOfPlayers} players
 */
const StateWithPlayers = new Struct('StateWithPlayers')
    .addField(ArrayOfPlayers.struct.pointer/*.array*/, 'players', 0x184)
    .getClass();

/**
 * @typedef StatesWithPlayers
 * @property {StateWithPlayers} stateWithPlayers
 */
const StatesWithPlayers = new Struct('StatesWithPlayers')
    .addField(StateWithPlayers.struct.pointer, 'stateWithPlayers', 0xC8)
    .getClass();

/** @type StatesWithPlayers */
const statesWithPlayers = StatesWithPlayers.struct.pointer.read(memory, moduleAoK + 0x6F2C58);
const players = statesWithPlayers.stateWithPlayers.players;

/**
 *
 * @param {Resources} resources
 * @param {float} value
 */
function setAllResources(resources, value) {
    resources.bois = value;
    resources.nourriture = value;
    resources.or = value;
    resources.pierre = value;
}

/**
 * @typedef Unit
 * @property {Player} player
 * @property {float} hp
 */
const Unit = new Struct('Unit')
    .addField(Player.struct.pointer, 'player', 0x10)
    .addField(Type.float, 'hp', 0x34)
    .getClass();

/**
 * @typedef StateWithSelectedUnit
 * @property {Unit} selectedUnit
 */
const StateWithSelectedUnit = new Struct()
    .addField(Unit.struct.pointer, 'selectedUnit', 0xD5C)
    .getClass();

/** @type StateWithSelectedUnit */
const stateWithSelectedUnit = StateWithSelectedUnit.struct.pointer.read(memory, moduleAoK + 0x6F3D90);

// trié par ordre dans la mémoire
module.exports = {
    statesWithPlayers,
    players,
    stateWithSelectedUnit,
    playerParent,
    setAllResources
};
