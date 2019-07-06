const fs = require('fs')
const util = require('util');


var fd = fs.openSync(remote.app.getPath('userData') + '/log.txt', 'a')

var cons = remote.getGlobal('console')

global.verbose = function () {
    if (['verbose'].includes(config.log.consoleLevel)) {
        writeConsole(...arguments)
    }
    if (['verbose'].includes(config.log.fileLevel)) {
        writeFile(...arguments)
    }
}

global.info = function () {
    if (['verbose', 'info'].includes(config.log.consoleLevel)) {
        writeConsole(...arguments)
    }
    if (['verbose', 'info'].includes(config.log.fileLevel)) {
        writeFile(...arguments)
    }
}

global.warning = function () {
    if (['verbose', 'info', 'warning'].includes(config.log.consoleLevel)) {
        cons.log(...arguments)
    }

    if (['verbose', 'info', 'warning'].includes(config.log.fileLevel)) {
        writeFile(...arguments)
    }
}

global.log = verbose

global.error = function () {
    if (['error', 'warning', 'info', 'verbose'].includes(config.log.consoleLevel)) {
        cons.error(...arguments)
        //console.error(...arguments)
    }
    if (['error', 'warning', 'info', 'verbose'].includes(config.log.fileLevel)) {
        writeFile(...arguments)
    }
}



function writeConsole(){
    //cons.log(...arguments)    

    var args = [...arguments]

    for (var i = 0; i < args.length; i++) {
        cons.log(args[i])
    }
}

function writeFile() {
    var res = ''
    var args = [...arguments]

    for (var i = 0; i < args.length; i++) {
        res += util.inspect(args[i]) + '\n'
    }

    fs.appendFile(fd, res + '\n', (e) => {
        if (e) {
            throw new Error('Cant write to log file')
        }

    })
}