'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');

// Nourriture
const aok = require('./lib/AoK');
const aokUtils = require('./lib/AoKUtils');
const {aokProcess, ResourceType, UnitType} = aok;
const resources = aokProcess.players.player1.resources;
// console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));
// resources.bois = 10000;
// resources.nourriture = 10000;
// resources.or = 10000;
// resources.pierre = 10000;
// resources.pop = 0;
// resources.popRestante = 500;
// console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));



function createWindow(){
    const window = new BrowserWindow({
        show: false
    });

    window.loadURL(`file://${__dirname}/index.html`);
    window.once('ready-to-show', function (){
        window.show();
    });

    window.resources = resources;

    window.webContents.openDevTools();

    window.on('closed', function() {
        // window = null;
    });
}

ipcMain.on('change-resources', function (event, bois, nourriture, or, pierre, pop, popRestante) {
    console.log("this is the firstname from the form ->", nourriture);
    resources.nourriture = nourriture;
    resources.bois = bois;
    resources.or = or;
    resources.pierre = pierre;
    resources.pop = pop;
    resources.popRestante = popRestante;
});

app.on('ready', function(){
    createWindow();
});
