// main.js — Electron 31, Windows
// Kiosk mode: sem barra, sem menu, sem Alt+F4, sem devtools.
const { app, BrowserWindow, globalShortcut, powerSaveBlocker, session } = require('electron');
const path = require('path');

let win = null;
let blockerId = null;
let shuttingDown = false;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
      webSecurity: true
    }
  });

  win.setMenu(null);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.loadFile('index.html');

  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.on('close', (e) => {
    if (!shuttingDown) {
      e.preventDefault();
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  win.on('blur', () => {
    if (shuttingDown) return;
    setTimeout(() => { if (win && !win.isDestroyed()) win.focus(); }, 50);
  });
}

app.whenReady().then(() => {
  const blocked = [
    'Alt+F4', 'Alt+Tab', 'Alt+Escape',
    'CommandOrControl+W', 'CommandOrControl+R',
    'CommandOrControl+Shift+I', 'CommandOrControl+Shift+J',
    'CommandOrControl+Shift+C', 'CommandOrControl+T',
    'CommandOrControl+N', 'CommandOrControl+F',
    'F11', 'F12', 'Escape',
    'Super+D', 'Super+Tab', 'Super+L'
  ];
  blocked.forEach(k => {
    try { globalShortcut.register(k, () => {}); } catch (e) {}
  });

  blockerId = powerSaveBlocker.start('prevent-display-sleep');

  createWindow();

  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(permission === 'media');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', (e) => {
  if (!shuttingDown) {
    e.preventDefault?.();
    if (!win || win.isDestroyed()) createWindow();
  }
});

process.on('SIGTERM', () => { shuttingDown = true; app.quit(); });
process.on('SIGINT',  () => { shuttingDown = true; app.quit(); });
