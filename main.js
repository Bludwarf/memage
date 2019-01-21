'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');

// Nourriture
const {resState} = require('./lib/AoK');
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
