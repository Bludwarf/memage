'use strict';

const {Struct, FieldType, StructPointer} = require('./cReflection');
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

const ResourcesState = new Struct('ResourcesState')
    .addField(FieldType.REAL_32, 'nourriture')
    .addField(FieldType.REAL_32, 'bois')
    .addField(FieldType.REAL_32, 'pierre')
    .addField(FieldType.REAL_32, 'or')
    .addField(FieldType.REAL_32, 'popRestante')
    .addField(FieldType.REAL_32, 'pop', 11 * FieldType.REAL_32.size);

const Player = new Struct('Player')
    .addField(ResourcesState.pointer, 'resourcesState', 0x3C);

const ResourceStateParentParent = new Struct('ResourceStateParentParent')
    .addField(Player.pointer, 'player', 0x134);

// Ressources
const resStateParentParent = ResourceStateParentParent.pointer.read(memory, moduleAoK + 0x6F4170);
const resState = resStateParentParent.resourcesStateParent.resourcesState;

module.exports = {
    ResourceState: ResourcesState,
    resState
};
