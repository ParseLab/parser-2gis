const fs = require('fs')
var status

var argv = parseArgv()

var defaultConfig = {
    encoding: "win1251",
    plugins: [],
    log: {
        fileLevel: 'error',
        consoleLevel: 'warning',
        file: remote.app.getPath('userData') + '/log.txt'
    },
    headless: false
}

var configFile = remote.app.getPath('userData') + '/config.json'

if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, '    '))
    status = `New config file created '${configFile}':`
} else {
    status = `Config file '${configFile}' loaded:`
}

var config = require(configFile)

if(argv.verbose) config.log.consoleLevel = 'verbose'
if(argv.info) config.log.consoleLevel = 'info'
if(argv.warning) config.log.consoleLevel = 'warning'
if(argv.error) config.log.consoleLevel = 'error'
if(argv.headless) config.headless = true

global.config = Object.assign(defaultConfig, config)

require('./log.js')
log('Arguments:', argv)

info(status)

log('Current config:', config)

function parseArgv() {

    var params = [
        ['verbose', 'v', 'boolean'],
        ['info', 'i', 'boolean'],
        ['warning', 'w', 'boolean'],
        ['error', 'e', 'boolean'],
        ['headless', 'h', 'boolean']
    ]
    
    var res = {}

    var argv = remote.process.argv.slice(2)

    for (var k=0;k<params.length;k++) {
        var p = params[k]
        
        res[p[0]] = null

        for(var i = 0; i < argv.length; i++){
            var a = argv[i]

            if(a.indexOf('--' + p[0]) == 0){
                if(p[2] == 'boolean'){
                    res[p[0]] = true
                } else if (p[2] == 'string'){
                    res[p[0]] = a.substr(a.indexOf('=')+1)
                }
            } else if ('-' + p[1] == a){
                if(p[2] == 'boolean'){
                    res[p[0]] = true
                } else if (p[2] == 'string'){
                    i++
                    res[p[0]] = argv[i]
                }
            }
        }
    }

    return res
} 