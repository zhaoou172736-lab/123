const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: "爆款架构师 - Viral Video Architect",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows using node features if needed, adjust for security in production
      webSecurity: false // Optional: Helps with some local file loading issues in dev
    },
    backgroundColor: '#fcfaf7', // Matches app background
    show: false // Don't show until ready to prevent white flash
  });

  // Load logic:
  // 1. If VITE_DEV_SERVER_URL is present, load it (Development)
  // 2. Otherwise load the index.html from the dist folder (Production / Packaged)
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production, the file is likely in resources/app/dist or adjacent to main.js depending on build config
    // We assume a standard Vite build output to 'dist' and main.js is at root
    // For Electron Forge with Vite plugin, it handles this, but for manual build:
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(() => {
        // Fallback for simple structure where index.html is in root (legacy mode)
        mainWindow.loadFile('index.html');
    });
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create a custom menu or remove it for a cleaner "App" feel
  const template = [
    {
      label: '应用',
      submenu: [
        { role: 'about', label: '关于' },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'forceReload', label: '强制刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});