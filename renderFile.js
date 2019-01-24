'use strict';
// src : https://stackoverflow.com/a/43501418/1655155

const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const resources = electron.remote.getCurrentWindow().resources;

function sendForm(event) {
    event.preventDefault(); // stop the form from submitting
    console.log('sendForm');

    const bois = +document.getElementById("bois").value;
    const nour = +document.getElementById("nourriture").value;
    const or = +document.getElementById("or").value;
    const pierre = +document.getElementById("pierre").value;
    const pop = +document.getElementById("pop").value;
    const popRestante = +document.getElementById("popRestante").value;

    ipcRenderer.send('change-resources', bois, nour, or, pierre);
}

document.getElementById("bois").value = resources.bois;
document.getElementById("nourriture").value = resources.nourriture;
document.getElementById("or").value = resources.or;
document.getElementById("pierre").value = resources.pierre;
document.getElementById("pop").value = resources.pop;
document.getElementById("popRestante").value = resources.popRestante;
