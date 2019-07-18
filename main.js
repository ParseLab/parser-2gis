/* eslint-disable semi */
const fs = require('fs')

var version = require('./version.json')

const electron = require('electron');
const contextMenu = require('electron-context-menu');
contextMenu();

const { autoUpdater } = require("electron-updater")
const app = electron.app;

const BrowserWindow = electron.BrowserWindow;

if (!process.argv.includes('-d')) electron.Menu.setApplicationMenu(null)

let mainWindow;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 850,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		},
		backgroundColor: '#3498db',
		show: process.argv.includes('-d'),
		resizable: true,
		title: "Парсер 2Gis " + version
	})

	mainWindow.autoUpdater = autoUpdater

	mainWindow.loadURL(`file://${__dirname}/index.html`)

	if (process.argv.includes('-d')) mainWindow.webContents.openDevTools()
	//mainWindow.webContents.openDevTools()
	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}


if (mainWindow) {
	mainWindow.focus();
}

app.on('ready', () => {

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
