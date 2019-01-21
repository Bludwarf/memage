'use strict';

const path = require ('path');
const fs = require('fs');
const os = require('os');

const { app, BrowserWindow, ipcMain } = require('electron');

const Robot = require("robot-js");
const cReflection = require('./lib/cReflection');
const [Struct, StructInstance, FieldType] = [cReflection.Struct, cReflection.StructInstance, cReflection.FieldType];
const [Process, Module, Memory, Window] = [Robot.Process, Robot.Module, Robot.Memory, Robot.Window];



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

// Ressources
function getRessources() {
    const $state1 = memory.readPtr(moduleAoK + 0x6F4170);
    const $state2 = memory.readPtr($state1 + 0x134);
    const $resState = memory.readPtr($state2 + 0x3C);
}

const structResourceState = new Struct('ResourceState')
    .addField(FieldType.REAL_32, 'nourriture')
    .addField(FieldType.REAL_32, 'bois')
    .addField(FieldType.REAL_32, 'pierre')
    .addField(FieldType.REAL_32, 'or')
    .addField(FieldType.REAL_32, 'popRestante')
    .addField(FieldType.REAL_32, 'pop', 11 * FieldType.REAL_32.size);

class ResourceState extends StructInstance {
    constructor(ptr) {
        super(structResourceState, memory, ptr);
    }
}

// Nourriture
const $state1 = memory.readPtr(moduleAoK + 0x6F4170);
const $state2 = memory.readPtr($state1 + 0x134);
const $resState = memory.readPtr($state2 + 0x3C);
const resState = new ResourceState($resState);
console.log(resState.bois, resState.nourriture, resState.or, resState.pierre, resState.pop + '/' + (resState.pop + resState.popRestante));
resState.pop = 0;
resState.popRestante = 500;
resState.nourriture = 10000;
console.log(resState.bois, resState.nourriture, resState.or, resState.pierre, resState.pop + '/' + (resState.pop + resState.popRestante));



function createWindow(){
    const window = new BrowserWindow({
        show: false
    });

    window.loadURL(`file://${__dirname}/index.html`);
    window.once('ready-to-show', function (){
        window.show();
    });

    window.resState = resState;

    window.webContents.openDevTools();

    window.on('closed', function() {
        // window = null;
    });
}

ipcMain.on('change-resources', function (event, bois, nourriture, or, pierre) {
    console.log("this is the firstname from the form ->", nourriture);
    resState.nourriture = nourriture;
    resState.bois = bois;
    resState.or = or;
    resState.pierre = pierre;
});

app.on('ready', function(){
    createWindow();
});
