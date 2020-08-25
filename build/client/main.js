// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const path = require('path');
const pty = require('./pty');
const ipc = require('./ipc');

let loginInfo = false;

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    // frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./my-term/index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  return mainWindow;
}

let webContents;

// Menu.setApplicationMenu(null);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    webContents = createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('action', (event, data) => {
  if (data.type === 'close') {
    BrowserWindow.getFocusedWindow().close();
  } else if (data.type === 'ip') {
    if (ipc.state) {
      ipc.destroy().then(function () {
        ipc.initConnect(data.data);
      });
    } else {
      ipc.initConnect(data.data);
    }
    ipc.registry(function ({ type, data }) {
      switch (type) {
        case ipc.DEVICES:
          webContents.send('devices', data);
          break;
        case ipc.KICKOUT:
          pty.kickout(data);
          break;
        default:
          break;
      }
    });
  }
});

pty.registryRead(function (code, data) {
  webContents.send('termdata', {
    code: code,
    data: Buffer.from(data).toString('base64')
  });
});

pty.registryEixt(function (code) {
  ipc.disdev(code);
  webContents.send('termExit', {
    code: code
  });
});

ipcMain.on('termdata', (event, data) => {
  if (data.data == 'HQ==') {
    return;
  }
  pty.write(data.code, data.data);
});

ipcMain.on('termsize', (event, data) => {
  console.log(data.cols, data.rows)
  pty.resizeDev(data.cols, data.rows)
});

ipcMain.on('logout', (event, data) => {
  ipc.leave();
  loginInfo = false;
});

ipcMain.on('join', (event, data) => ipc.join());

ipcMain.on('kickout', (event, data) => {
  ipc.kickout(data.code).then(result => {
    event.reply('kickout', {
      result
    });
  }).catch(() => {
    event.reply('kickout', {
      result: false
    });
  });
});

ipcMain.on('connect', (event, data) => {
  // connect term; termChange
  pty.connectDev(data.code);
  ipc.usedev(data.code);
  event.reply('connect', {
    code: data.code
  });
});

////////////////////////////////////////////////////

ipcMain.on('login', (event, data) => {
  if (loginInfo && loginInfo.user === data.user && loginInfo.passwd === data.passwd) {
    event.reply('login', {
      code: 0
    });
  } else {
    ipc.check(data.user, data.passwd).then(code => {
      event.reply('login', {
        code
      });
      if (code === 0) {
        loginInfo = {
          user: data.user,
          passwd: data.passwd
        };
      }
    }).catch(() => {
      event.reply('login', {
        code: 2
      });
    });
  }
});




