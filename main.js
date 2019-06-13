/* eslint-disable semi */
var version = require('./version.json')

if (process.argv.includes('-u')) {

	console.log(r)
	process.exit(0)

}

const electron = require('electron');
const { autoUpdater } = require("electron-updater")

const isDev = require('electron-is-dev');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

if (!process.argv.includes('-d')) electron.Menu.setApplicationMenu(null)



autoUpdater.on('checking-for-update', () => {
	console.log('Checking for update...');
})
autoUpdater.on('update-available', (ev, info) => {
	console.log('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
	console.log('Update not available.');
})


let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 850,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		},
		backgroundColor: '#3498db',
		show: true,
		resizable: true,
		title: "Парсер 2Gis " + version
	})

	mainWindow.loadURL(`file://${__dirname}/index.html`)

	if (process.argv.includes('-d')) mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}


if (mainWindow) {
	mainWindow.focus();
}

app.on('ready', () => {
	if (!isDev) autoUpdater.checkForUpdates();
	createWindow();
});

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', function () {

	if (mainWindow === null) {
		createWindow();
	}
});
