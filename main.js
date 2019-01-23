'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');

// Nourriture
const {playerParent} = require('./lib/AoK');
const resources = playerParent.player.resources;
console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));
resources.pop = 0;
resources.popRestante = 500;
resources.nourriture = 10000;
console.log(resources.bois, resources.nourriture, resources.or, resources.pierre, resources.pop + '/' + (resources.pop + resources.popRestante));



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

ipcMain.on('change-resources', function (event, bois, nourriture, or, pierre) {
    console.log("this is the firstname from the form ->", nourriture);
    resources.nourriture = nourriture;
    resources.bois = bois;
    resources.or = or;
    resources.pierre = pierre;
});

app.on('ready', function(){
    createWindow();
});
