'use strict';
// src : https://stackoverflow.com/a/43501418/1655155

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const resState = electron.remote.getCurrentWindow().resState;

function sendForm(event) {
    event.preventDefault(); // stop the form from submitting
    console.log('sendForm');

    const bois = +document.getElementById("bois").value;
    const nour = +document.getElementById("nourriture").value;
    const or = +document.getElementById("or").value;
    const pierre = +document.getElementById("pierre").value;

    ipcRenderer.send('change-resources', bois, nour, or, pierre);
}

document.getElementById("bois").value = resState.bois;
document.getElementById("nourriture").value = resState.nourriture;
document.getElementById("or").value = resState.or;
document.getElementById("pierre").value = resState.pierre;
