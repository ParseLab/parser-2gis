/* eslint-disable no-unused-vars */

const fs = require('fs')
//var dataDir = '/data/parser_data'
const fetch = require('node-fetch')
const Promise = require('bluebird')
fetch.Promise = Promise
var dataDir = app.getPath('userData')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
if (!fs.existsSync(dataDir + '/db')) fs.mkdirSync(dataDir + '/db')
if (!fs.existsSync(dataDir + '/key.json')) fs.writeFileSync(dataDir + '/key.json', '"demo"')
if (!fs.existsSync(dataDir + '/tasks.json')) fs.writeFileSync(dataDir + '/tasks.json', '{"tasks":[],"count":0}')

var licenseKey = require(dataDir + '/key.json')

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
	}

	init (){

	}

	createPool(city, rubrics) {
		for (var i = 0; i < rubrics.length; i++) {
			this.pool.push(rubrics[i])
		}
	}

	parseBase(msg, callback) {
		var base = this.getFirstBase()
		
		if (!base) {
			callback()
		} else {
			var city = base.city
			var taskId = base.taskId
			var rubrics = base.rubrics
			this.curCity = city
			this.curTaskId = taskId
			this.ids = {}
			this.co = 0

			var baseDir = dataDir + '/db/gis_' + taskId + '_' + city.code

			if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir)

			this.getBaseStatus(taskId, city.code)

			this.createPool(city, rubrics)

			this.parseRubric(msg, () => {
				this.setBaseFinished(taskId, city.code)
				msg({ type: "base", cityTitle: city.title })
				this.parseBase(msg, callback)
			})
		}
	}

	parseRubric(msg, callback) {
		var rubricId = this.pool.shift()
		var url = parseFirmUrl(rubricId, this.curCity.id, licenseKey)
		this.getJson(url, (e, r) => {
			for (var i = 0; i < r.length; i++) {
				if (!this.ids.hasOwnProperty(r[i][0])) {
					this.ids[r[i][0]] = true
					this.co++
					msg(this.co)
				}
			}
	
			fs.writeFile(dataDir + '/db/gis_' + this.curTaskId + '_' + this.curCity.code + '/' + rubricId + '.json', JSON.stringify(r), (e) => {
				if (this.pool.length > 0) {
					this.parseRubric(msg, callback)
				} else {
					callback()
				}
			})
		})
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

				for (var p in status) {
					o[p] = status[p]
				}

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
				count: 0
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

	setBaseCount(taskId, cityCode) {
		var status = this.getBaseStatus(taskId, cityCode)
		status.count = co
		this.saveBaseStatus(taskId, cityCode, status)
	}

	getKey() {
		return JSON.parse(fs.readFileSync(dataDir + '/key.json'))
	}
}

module.exports = new Parser()