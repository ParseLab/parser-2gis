const Parser = require(__dirname + '/parser4.js')

exports.log = function () {
    remote.getGlobal('console').log(...arguments)
}

exports.table = function () {
    remote.getGlobal('console').table(...arguments)
}


exports.help = () => {
    var h = `<command> [arg1] [arg2]`

    this.log(h)
}

exports.start = () => {
    info('Cli started.')

    var plugins = fs.readdirSync(__dirname + '/plugins')

    for (var i = 0; i < plugins.length; i++) {
        if (config.plugins.includes(plugins[i])) {
            require(__dirname + '/plugins/' + plugins[i])
        }
    }

    global.parser = new Parser()

    var a = getCmd()

    switch (a.cmd) {
        case "tasks":
            var tasks = parser.getTasks()

            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i]

                this.log(i + ' ' + task.name)
            }
            remote.process.exit(0)
            break;
        case "bases":
            var bases = parser.getBases()
            this.table(bases, ['dbname'])

            break
        case "parse":
            var step = 0
            parser.start((r) => {
                if (r.type) {
                    if (r.type == 'base') {
                        this.log("Сборка города " + r.cityTitle + " завершена")
                    } else if (r.type == 'finish') {
                        this.log("Парсинг завершен")
                    }
                } else {
                    step++
                    if(step == 10){
                        step = 0
                        var i = parseInt(parser.co, 10)
                        i++
                        this.log("City: " + parser.curCity.id + '  Firms: ' + i)
                    }
                }
            }, () => {
                remote.process.exit(0)
            })

            break
        default:
            this.help()
            remote.process.exit(0)
    }

}

function getCmd() {
    var arr = []
    var argv = remote.process.argv.slice(2)

    log('argv:', argv)

    for (var i = argv.length - 1; i >= 0; i--) {
        var arg = argv[i]
        log('i: ' + i + ' arg:' + arg)
        if (argv[i].indexOf('-') != 0) {
            arr.unshift(argv[i])
        }
    }

    log('arr:', arr)

    if (arr[0]) {
        var cmd = arr[0]
        log('Command: ' + cmd)
    } else {
        this.help()
    }

    var args = arr.slice(1)

    if (args.length > 0) {
        info('Arguments: ', args)
    }

    return { cmd: cmd, args: args }
}