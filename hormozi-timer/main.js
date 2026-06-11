const {
  app,
  BrowserWindow,
  Notification,
  ipcMain,
  nativeImage,
  powerMonitor,
  globalShortcut,
  Menu,
  shell,
} = require('electron');
const { menubar } = require('menubar');
const Store = require('electron-store');
const path = require('path');

const store = new Store({
  defaults: {
    entries: [],
    intervalMinutes: 15,
    paused: false,
  },
});

let timerHandle = null;
let nextFireAt = null;
let summaryWindow = null;

const iconImage = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icon.png'));
iconImage.setTemplateImage(true);

const mb = menubar({
  icon: iconImage,
  index: `file://${path.join(__dirname, 'renderer', 'index.html')}`,
  browserWindow: {
    width: 420,
    height: 560,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  },
  preloadWindow: true,
  showDockIcon: true,
});

function updateTrayTitle() {
  if (!mb.tray) return;
  if (store.get('paused')) {
    mb.tray.setTitle(' ⏸ ');
    return;
  }
  if (!nextFireAt) {
    mb.tray.setTitle(' ⏰ ');
    return;
  }
  const msLeft = nextFireAt - Date.now();
  if (msLeft <= 0) {
    mb.tray.setTitle(' ⏰ 0:00 ');
    return;
  }
  const m = Math.floor(msLeft / 60000);
  const s = Math.floor((msLeft % 60000) / 1000);
  mb.tray.setTitle(` ⏰ ${m}:${s.toString().padStart(2, '0')} `);
}

let tickHandle = null;
function startTickingTitle() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(updateTrayTitle, 1000);
}

function scheduleNextFire() {
  if (timerHandle) clearTimeout(timerHandle);
  if (store.get('paused')) {
    nextFireAt = null;
    updateTrayTitle();
    return;
  }
  const mins = store.get('intervalMinutes', 15);
  nextFireAt = Date.now() + mins * 60 * 1000;
  timerHandle = setTimeout(fireTimer, mins * 60 * 1000);
  updateTrayTitle();
}

function fireTimer() {
  if (store.get('paused')) return;

  try {
    new Notification({
      title: 'What did you just do?',
      body: 'Log your last 15 minutes',
      sound: 'Glass',
    }).show();
  } catch (e) {}

  if (mb.window) {
    mb.showWindow();
    mb.window.focus();
    mb.window.webContents.send('timer-fired');
  }

  nextFireAt = null;
  updateTrayTitle();
}

mb.on('ready', () => {
  mb.tray.setIgnoreDoubleClickEvents(true);
  updateTrayTitle();
  startTickingTitle();
  scheduleNextFire();

  // Show form once on first launch so user knows the app is running
  setTimeout(() => {
    mb.showWindow();
    mb.window.focus();
  }, 400);

  // Startup notification
  try {
    new Notification({
      title: 'Hormozi Timer is running',
      body: 'Look for the clock icon in your menu bar. Next prompt in 15 min.',
    }).show();
  } catch (e) {}

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Log entry now',
      click: () => {
        mb.showWindow();
        mb.window.focus();
        mb.window.webContents.send('timer-fired');
      },
    },
    {
      label: 'View summary',
      click: () => openSummaryWindow(),
    },
    { type: 'separator' },
    {
      label: 'Pause / Resume',
      click: () => {
        const paused = !store.get('paused');
        store.set('paused', paused);
        if (paused) {
          if (timerHandle) clearTimeout(timerHandle);
          nextFireAt = null;
        } else {
          scheduleNextFire();
        }
        updateTrayTitle();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  mb.tray.on('right-click', () => {
    mb.tray.popUpContextMenu(contextMenu);
  });

  globalShortcut.register('CommandOrControl+Shift+L', () => {
    mb.showWindow();
    mb.window.focus();
    mb.window.webContents.send('timer-fired');
  });
});

mb.on('after-create-window', () => {
  // mb.window.webContents.openDevTools({ mode: 'detach' });
});

powerMonitor.on('resume', () => {
  if (store.get('paused')) return;
  if (nextFireAt && Date.now() >= nextFireAt) {
    fireTimer();
  } else if (nextFireAt) {
    if (timerHandle) clearTimeout(timerHandle);
    timerHandle = setTimeout(fireTimer, nextFireAt - Date.now());
  } else {
    scheduleNextFire();
  }
});

ipcMain.handle('submit-entry', (_event, entry) => {
  const entries = store.get('entries', []);
  entries.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    text: entry.text,
    valueTier: entry.valueTier,
    intervalMinutes: store.get('intervalMinutes', 15),
  });
  store.set('entries', entries);
  scheduleNextFire();
  mb.hideWindow();
  if (summaryWindow && !summaryWindow.isDestroyed()) {
    summaryWindow.webContents.send('entries-updated');
  }
  return { ok: true };
});

ipcMain.handle('skip-round', () => {
  scheduleNextFire();
  mb.hideWindow();
  return { ok: true };
});

ipcMain.handle('snooze', (_event, mins) => {
  if (timerHandle) clearTimeout(timerHandle);
  nextFireAt = Date.now() + mins * 60 * 1000;
  timerHandle = setTimeout(fireTimer, mins * 60 * 1000);
  updateTrayTitle();
  mb.hideWindow();
  return { ok: true };
});

ipcMain.handle('get-state', () => {
  return {
    entries: store.get('entries', []),
    intervalMinutes: store.get('intervalMinutes', 15),
    paused: store.get('paused', false),
    nextFireAt,
  };
});

ipcMain.handle('set-interval', (_event, mins) => {
  store.set('intervalMinutes', mins);
  scheduleNextFire();
  return { ok: true };
});

ipcMain.handle('delete-entry', (_event, id) => {
  const entries = store.get('entries', []).filter((e) => e.id !== id);
  store.set('entries', entries);
  if (summaryWindow && !summaryWindow.isDestroyed()) {
    summaryWindow.webContents.send('entries-updated');
  }
  return { ok: true };
});

ipcMain.handle('open-summary', () => {
  openSummaryWindow();
});

ipcMain.handle('export-csv', async () => {
  const { dialog } = require('electron');
  const fs = require('fs');
  const entries = store.get('entries', []);
  const header = 'timestamp,value_tier,interval_minutes,text\n';
  const rows = entries
    .map((e) => {
      const text = `"${(e.text || '').replace(/"/g, '""')}"`;
      return `${e.timestamp},${e.valueTier},${e.intervalMinutes || 15},${text}`;
    })
    .join('\n');
  const result = await dialog.showSaveDialog({
    defaultPath: `hormozi-tracker-${new Date().toISOString().slice(0, 10)}.csv`,
  });
  if (result.canceled || !result.filePath) return { ok: false };
  fs.writeFileSync(result.filePath, header + rows);
  return { ok: true, path: result.filePath };
});

function openSummaryWindow() {
  if (summaryWindow && !summaryWindow.isDestroyed()) {
    summaryWindow.focus();
    return;
  }
  summaryWindow = new BrowserWindow({
    width: 980,
    height: 720,
    title: 'Hormozi Timer — Summary',
    backgroundColor: '#0b0b0f',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  summaryWindow.loadFile(path.join(__dirname, 'renderer', 'summary.html'));
  summaryWindow.on('closed', () => {
    summaryWindow = null;
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});
