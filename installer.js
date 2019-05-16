var electronInstaller = require('electron-winstaller');

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: __dirname + '/dist/win-unpacked',
    outputDirectory: __dirname + '/installer',
    authors: 'ParseLab',
    exe: 'parser2gis4.exe'
  });

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));

