// preload.js — context isolation ligado, bridge mínima
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('kiosk', {
  version: process.versions.electron
});
