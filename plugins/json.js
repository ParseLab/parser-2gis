const fs = require('fs')

Parser.prototype.onAfterExport = function (callback) {
    callback(']')
}

Parser.prototype.onBeforeExport = function (callback) {
    callback('[')
}

Parser.prototype.onExport = function (arr, callback) {
    var line = `{`

    if (this.exportCo != 1) line = ',' + line

    for (var i = 0; i < this.fields.length; i++) {
        var val = arr[this.fields[i][0]]

        if (i != 0) {
            line += ','
        }
        console.log('indx:', i, 'field:', this.fields[i][1], 'val:', val)
        line += '"' + this.fields[i][1] + '": "' + val + '"'
    }

    line += '}'

    callback(line)
}