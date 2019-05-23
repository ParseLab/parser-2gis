/* eslint-disable no-unused-vars */

const fs = require('fs')
//var dataDir = '/data/parser_data'
const fetch = require('node-fetch')
const Promise = require('bluebird')
var iconv = require('iconv-lite');

fetch.Promise = Promise
var dataDir = app.getPath('userData')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
if (!fs.existsSync(dataDir + '/db')) fs.mkdirSync(dataDir + '/db')
if (!fs.existsSync(dataDir + '/key.json')) fs.writeFileSync(dataDir + '/key.json', '"demo"')
if (!fs.existsSync(dataDir + '/tasks.json')) fs.writeFileSync(dataDir + '/tasks.json', '{"tasks":[],"count":0}')

var firmurl4 = 'http://db.parselab.org/4.0/[city]/[category].json?key=[key]'

function parseFirmUrl(category, city, key) {
	return firmurl4
		.replace('[category]', category)
		.replace('[city]', city)
		.replace('[key]', key)
}


class Parser {
	constructor() {
		this.pool = []
		this.curCity
		this.curTaskId
		this.curIndex
		this.ids
		this.co
		this.started = false
		this.licenseKey = this.getKey()
	}

	init() {

	}

	start(msg, callback) {
		this.started = true
		this.parseBase(msg, callback)
	}

	createPool(base) {
		var status = this.getBaseStatus(base.taskId, base.city.code)
		if (status.count > 0 && !status.finished) {
			this.pool = status.pool
			this.ids = status.ids
			this.co = status.count
		} else {
			this.ids = {}
			this.co = 0
			for (var i = 0; i < base.rubrics.length; i++) {
				this.pool.push(base.rubrics[i])
			}
		}
	}

	parseBase(msg, callback) {
		var base = this.getFirstBase()
		if (!base) {
			msg({ type: "finish"})
			callback()
		} else {
			var city = base.city
			var taskId = base.taskId
			var rubrics = base.rubrics
			this.curCity = city
			this.curTaskId = taskId
			var baseDir = dataDir + '/db/gis_' + taskId + '_' + city.code

			if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir)

			this.createPool(base)

			this.parseRubric(msg, () => {
				//this.setBaseFinished(taskId, city.code)
				if (this.started) {
					this.finish()
					msg({ type: "base", cityTitle: city.title })
					this.parseBase(msg, callback)
				} else {
					callback()
				}
			})
		}
	}

	parseRubric(msg, callback) {
		if (this.started) {
			var rubricId = this.pool.shift()
			var url = parseFirmUrl(rubricId, this.curCity.id, this.licenseKey)
			this.getJson(url, (e, r) => {
				var c = 0
				for (var i = 0; i < r.length; i++) {
					if (!this.ids.hasOwnProperty(r[i][0])) {
						this.ids[r[i][0]] = true
						c++
					}
				}
				this.co += c

				msg(this.co)

				fs.writeFile(dataDir + '/db/gis_' + this.curTaskId + '_' + this.curCity.code + '/' + rubricId + '.json', JSON.stringify(r), (e) => {
					if (this.pool.length > 0) {
						this.parseRubric(msg, callback)
					} else {
						this.finish()
						callback()
					}
				})
			})
		} else {
			this.pause()
			callback()
		}
	}

	getJson(url, callback) {
		fetch(url)
			.then(res => res.json())
			.then(r => {
				callback(null, r)
			})
			.catch(e => {
				callback(e, null)
			})
	}

	getText(url, callback) {
		fetch(url)
			.then(res => res.text())
			.then(r => {
				callback(null, r)
			})
			.catch(e => {
				callback(e, null)
			})
	}

	createTask(name, cities, rubrics) {
		var tasks = JSON.parse(fs.readFileSync(dataDir + '/tasks.json'))
		tasks.count++

		tasks.tasks.push({
			id: tasks.count,
			name: name,
			cities: cities,
			rubrics: rubrics
		})

		fs.writeFileSync(dataDir + '/tasks.json', JSON.stringify(tasks))
	}

	getTasks() {
		return JSON.parse(fs.readFileSync(dataDir + '/tasks.json')).tasks
	}

	removeBases(ids) {
		var tasks = JSON.parse(fs.readFileSync(dataDir + '/tasks.json'))
		var newTasks = []

		for (var i = 0; i < tasks.tasks.length; i++) {
			var taskId = tasks.tasks[i].id
			var newCities = []
			for (var k = 0; k < tasks.tasks[i].cities.length; k++) {
				var cityCode = tasks.tasks[i].cities[k].code
				var baseId = 'gis_' + taskId + '_' + cityCode

				if (!ids.includes(baseId)) {
					newCities.push(tasks.tasks[i].cities[k])
				}
			}

			if (newCities.length > 0) {
				tasks.tasks[i].cities = newCities
				newTasks.push(tasks.tasks[i])
			}
		}
		tasks.tasks = newTasks
		fs.writeFileSync(dataDir + '/tasks.json', JSON.stringify(tasks))
	}

	removeTasks(ids) {
		var tasks = JSON.parse(fs.readFileSync(dataDir + '/tasks.json'))
		for (var i = 0; i < tasks.tasks.length; i++) {
			if (ids.includes(tasks.tasks[i].id)) {
				tasks.tasks.splice(i, 1)
			}
		}

		fs.writeFileSync(dataDir + '/tasks.json', JSON.stringify(tasks))
	}

	getBases() {
		var tasks = this.getTasks()
		var res = []
		this.co = 0
		for (var k = 0; k < tasks.length; k++) {
			for (var i = 0; i < tasks[k].cities.length; i++) {
				this.co++

				var o = {
					id: this.co,
					taskId: tasks[k].id,
					city: tasks[k].cities[i],
					rubrics: tasks[k].rubrics,
					title: tasks[k].cities[i].title,
					task_title: tasks[k].name,
					dbname: 'gis_' + tasks[k].id + '_' + tasks[k].cities[i].code,
					count: '-'
				}

				var status = this.getBaseStatus(tasks[k].id, tasks[k].cities[i].code)

				o.finished = status.finished
				o.count = status.count

				res.push(o)
			}
		}

		return res
	}

	getFirstBase() {
		var bases = this.getBases()

		for (var i = 0; i < bases.length; i++) {
			if (!bases[i].finished) {
				this.curIndex = i
				return bases[i]
			}
		}

		return false
	}

	getBaseStatus(taskId, cityCode) {
		var statusFile = dataDir + '/db/gis_' + taskId + '_' + cityCode + '/status.json'
		var status

		if (fs.existsSync(statusFile)) {
			status = JSON.parse(fs.readFileSync(statusFile))
		} else {
			status = {
				finished: false,
				count: 0,
				ids: {},
				pool: []
			}

			//this.saveBaseStatus(taskId, cityCode, status)
		}

		return status
	}

	saveBaseStatus(taskId, cityCode, status) {
		var statusFile = dataDir + '/db/gis_' + taskId + '_' + cityCode + '/status.json'

		fs.writeFileSync(statusFile, JSON.stringify(status))
	}

	setBaseFinished(taskId, cityCode) {
		var status = this.getBaseStatus(taskId, cityCode)
		status.count = this.co
		status.finished = true
		this.saveBaseStatus(taskId, cityCode, status)
	}

	finish() {
		var status = this.getBaseStatus(this.curTaskId, this.curCity.code)
		status.count = this.co
		status.finished = true
		status.ids = {}
		status.pool = []
		this.saveBaseStatus(this.curTaskId, this.curCity.code, status)
	}

	stop() {
		this.started = false
	}

	pause() {
		var status = this.getBaseStatus(this.curTaskId, this.curCity.code)
		status.count = this.co
		status.ids = this.ids
		status.pool = this.pool
		this.saveBaseStatus(this.curTaskId, this.curCity.code, status)
	}

	setBaseCount(taskId, cityCode) {
		var status = this.getBaseStatus(taskId, cityCode)
		status.count = this.co
		this.saveBaseStatus(taskId, cityCode, status)
	}

	export(tasks, fileName, callback) {
		var co = 1
		var header = `sep=;\n"id";"name";"city_name";"geometry_name";"post_code";"phone";"email";"website";"vkontakte";"instagram";"lon";"lat";"category";"subcategory"\n`
		fs.appendFileSync(fileName, header);

		for(var i=0;i<tasks.length;i++){
			var task = tasks[i]
			var ids = []
			for(var k=0;k<task.rubrics.length;k++){
				var rubricFile = dataDir + '/db/' + task.dbname + '/' + task.rubrics[k] + '.json'
				
				var d = JSON.parse(fs.readFileSync(rubricFile))

				for (var n =0; n < d.length; n++){
					var arr = d[n]

					if (!ids.includes(arr[0])){
						ids.push(arr[0])
						var line = `"${co}";"${arr[1]}";"${arr[2]}";"${arr[3]}";"${arr[4]}";"${arr[5]}";"${arr[7]}";"${arr[8]}";"${arr[9]}";"${arr[10]}";"${arr[11]}";"${arr[12]}";"${arr[13]}";"${arr[14]}"\n`
						fs.appendFileSync(fileName, iconv.encode(line, 'win1251'));
						callback('msg', co)
						co++
					}


				}
				
			}
		}

		callback('finished', null)
	}

	getKey() {
		return JSON.parse(fs.readFileSync(dataDir + '/key.json'))
	}

	setKey(key, callback) {
		this.getText('https://parselab.org/key/key3.php?key='+key+'&key_check', (e, r)=>{
			if (r != '0'){
				this.licenseKey = key
				fs.writeFileSync(dataDir + '/key.json', JSON.stringify(key))
				callback(r)
			} else {
				callback(false)
			}
		})
	}
}

module.exports = new Parser()