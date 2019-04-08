/* eslint-disable no-unused-vars */

const fs = require('fs')
//var dataDir = '/data/parser_data'

var dataDir = app.getPath('userData')

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)
if (!fs.existsSync(dataDir + '/db')) fs.mkdirSync(dataDir + '/db')
if (!fs.existsSync(dataDir + '/key.json')) fs.writeFileSync(dataDir + '/key.json', '"demo"')
if (!fs.existsSync(dataDir + '/tasks.json')) fs.writeFileSync(dataDir + '/tasks.json', '{"tasks":[],"count":0}')

const fetch = require('node-fetch')
const Bluebird = require('bluebird')
fetch.Promise = Bluebird

function getJson(url, callback) {
	fetch(url)
		.then(res => res.json())
		.then(r => {
			callback(null, r)
		})
		.catch(e => {
			callback(e, null)
		})
}


var curCity
var curTaskId
var pool
var ids
var co

function parseBase(city, taskId, rubrics, msg, callback){
	curCity = city
	curTaskId = taskId
	ids = {}
	co = 0

	fs.mkdirSync(dataDir + '/db/gis_' + curTaskId + '_' + curCity.code)

	createPool(city, rubrics)

	parseRubric(msg, ()=>{
		//console.log('FINISH')
		msg('base')
		callback()
	})
}

function parseRubric(msg, callback){
	var rubricId = pool.shift()

	getJson('http://db.parselab.org/4.0/' + curCity.id + '/' + rubricId + '.json?key=zzzxxx', (e, r)=>{
		for(var i=0;i<r.length;i++){
			if (!ids.hasOwnProperty(r[i][0])){
				ids[r[i][0]] = true
				co++
				msg(co)
			}
		}

		

		fs.writeFile(dataDir + '/db/gis_' + curTaskId + '_' + curCity.code + '/' + rubricId + '.json', JSON.stringify(r), (e)=>{
			if (pool.length > 0){
				parseRubric(msg, callback)
			} else {
				callback()
			}
		})
	})
}

function createPool(city, rubrics){
	pool = []

	for(var i=0;i<rubrics.length;i++){
		pool.push(rubrics[i])
	}
}

class Parser {
	constructor(){

	}

	parseBase(city, taskId, rubrics, msg, callback){
		parseBase(city, taskId, rubrics, msg, ()=>{
			callback()
		})
	}

	createTask(name, cities, rubrics){
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

	getTasks(){
		return JSON.parse(fs.readFileSync(dataDir + '/tasks.json')).tasks
	}

	removeBases(ids){
		var tasks = JSON.parse(fs.readFileSync(dataDir + '/tasks.json'))
		var newTasks = []

		for(var i=0;i<tasks.tasks.length;i++){
			var taskId = tasks.tasks[i].id
			var newCities = []
			for(var k=0;k<tasks.tasks[i].cities.length;k++){
				var cityCode = tasks.tasks[i].cities[k].code
				var baseId = 'gis_' + taskId + '_' + cityCode

				if(!ids.includes(baseId)){
					newCities.push(tasks.tasks[i].cities[k])
				}
			}

			if (newCities.length > 0){
				tasks.tasks[i].cities = newCities
				newTasks.push(tasks.tasks[i])
			}
		}
		tasks.tasks = newTasks
		fs.writeFileSync(dataDir + '/tasks.json', JSON.stringify(tasks))
	}

	removeTasks(ids){
		var tasks = JSON.parse(fs.readFileSync(dataDir + '/tasks.json'))
		for(var i=0;i<tasks.tasks.length;i++){
			if(ids.includes(tasks.tasks[i].id)){
				tasks.tasks.splice(i, 1)
			}
		}

		fs.writeFileSync(dataDir + '/tasks.json', JSON.stringify(tasks))
	}

	getBases(){
		var tasks = this.getTasks()
		var res = []
		var co = 0
		for(var k=0;k<tasks.length;k++){
			for(var i=0;i<tasks[k].cities.length;i++){
				co++
				res.push({
					id: co,
					taskId: tasks[k].id,
					city: tasks[k].cities[i],
					rubrics: tasks[k].rubrics,
					title: tasks[k].cities[i].title,
					task_title: tasks[k].name,
					dbname: 'gis_'+tasks[k].id+'_'+tasks[k].cities[i].code,
					count: '-'
				})
			}
		}

		return res
	}

	getKey(){
		return JSON.parse(fs.readFileSync(dataDir + '/key.json'))
	}
}

module.exports = new Parser()