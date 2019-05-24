var fs = require('fs')

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
var keywin
var remote = require('electron').remote
global.app = remote.app
//var app = remote.app
var dialog = remote.require('electron').dialog
var win = remote.getCurrentWindow()
var shell = require('electron').shell
var started = false
var taskData = { cities: '', rubrics: '', name: '' }
var dat
var currentVersion = JSON.parse(fs.readFileSync(__dirname + '/version.json'))

var version

var property

var parser = require(__dirname + '/parser4.js')

function isDemo() {
	if (parser.licenseKey == 'demo') return true
	else return false
}

function getCityData() {
	var countries = []

	for (var id in dat.countries) {
		var cities = []
		for (var i = 0; i < dat.cities.length; i++) {
			if (dat.cities[i].country == id) {
				cities.push({
					id: dat.cities[i].id,
					value: dat.cities[i].name,
					code: dat.cities[i].code
				})
			}
		}

		if (cities.length > 0) {
			countries.push({
				id: id,
				open: false,
				value: dat.countries[id],
				data: cities
			})
		}

	}

	return countries
}


function getCityData2() {
	var countries = []

	for (var id in dat.countries) {
		var cities = []
		for (var i = 0; i < dat.cities.length; i++) {
			if (dat.cities[i].country == id) {
				var o = {
					id: dat.cities[i].id,
					value: dat.cities[i].name,
					code: dat.cities[i].code
				}

				if (isDemo()) {
					if (o.id == '69') cities.push(o)
				} else {
					cities.push(o)
				}
			}
		}

		countries.push({
			id: id,
			open: false,
			value: dat.countries[id],
			data: cities
		})
	}

	return countries
}

function getCategoryData() {
	var categories = []

	for (var k = 0; k < dat.categories.length; k++) {
		var rubrics = []
		for (var i = 0; i < dat.categories[k].children.length; i++) {
			rubrics.push({
				id: dat.categories[k].children[i].id,
				value: dat.categories[k].children[i].name
			})
		}

		categories.push({
			id: dat.categories[k].id,
			open: false,
			value: dat.categories[k].name,
			data: rubrics
		})
	}

	return [{
		id: 'root',
		open: true,
		value: 'Все',
		data: categories
	}]
}

function loadDat(callback) {
	var project = '32'
	if (isDemo()) project = '69'
	getJson('https://parselab.org/key/key3.php?project=' + project + '&key=' + parser.licenseKey, (e, r) => {
		dat = r
		version = {
			last: dat.last_version,
			current: currentVersion,
			url: dat.downloadUrl
		}
		callback()
	})
}

function checkNewVersion(version) {
	var current = version.current.split('.')
	var last = version.last.split('.')

	for (var i = 0; i < current.length; i++) {
		if (last[i] > current[i]) return true
		else if (last[i] == current[i]) continue
		else return false
	}

	return false
}

webix.ready(function () {
	loadDat(() => {
		if (checkNewVersion(version)) {
			webix.modalbox({
				title: "Доступна новая версия!",
				buttons: ["Да, скачать!", "Нет, спасибо"],
				width: "500px",
				text: "Доступна более новая версия парсера! Ваша версия: " + version.current + ". Последняя версия: " + version.last + ". Желаете скачать последнюю версию?",
				callback: function (result) {
					if (result == 0) {
						shell.openExternal('https://parselab.org/parser-2gis.html')
					}
				}
			})
		}
		interface_init()
		reloadBases()
		if (isDemo()) {
			$$('keywin').show()
		}
	})
})

function mark_finished(value, data) {
	if (data.finished)
		return "highlight"
}

function mark_minus(value, data) {
	if (value == 0) {
		return "-"
	} else {
		return value
	}
}

function interface_init() {
	keywin = webix.ui({
		view: "window",
		id: "keywin",
		move: true,
		modal: true,
		height: 600,
		//width:500,
		resize: true,
		position: "center",
		head: {
			view: "toolbar",
			cols: [
				{ view: "label", label: "Неактивированная версия парсера" }
			]
		},
		body: {
			rows: [
				{ view: "text", id: "keytext", value: '', label: 'Если у вас есть лицензионный ключ, введите его в поле ниже и нажмите "Активировать"', labelPosition: "top", width: 700 },
				{
					margin: 5,
					cols: [
						{ view: "button", value: "Активировать", click: setKey },
						{ view: "button", value: "Бесплатная версия", click: loadDemo },
						{ view: "button", value: "Купить ключ", click: buyParser, type: "form" }
					]
				},
			]
		}
	})

	webix.ui({
		view: "window",
		id: "propertywin",
		move: true,
		modal: true,
		height: 300,
		width: 330,
		resize: true,
		position: "center",
		head: {
			view: "toolbar",
			cols: [
				{ view: "label", label: "Настройки", id: "keylabel" }
			]
		},
		body: {
			rows: [
				{
					view: "property", id: "sets", nameWidth: 250, disabled: (dat.user_id == '0') ? true : false,
					elements: [
						{ label: "Собирать адреса e-mail с сайтов", type: "checkbox", id: "parse_emails", checkValue: true, uncheckValue: false }

					]
				},
				{
					margin: 5, cols: [
						{ view: "button", value: "Отмена", click: "$$('propertywin').hide();" },
						{ view: "button", value: "Сохранить", click: setProperty, type: "form" }
					]
				},
			]
		}
	})

	webix.ui({
		view: "window",
		id: "exportwin",
		move: true,
		modal: true,
		height: 300,
		width: 330,
		resize: true,
		position: "center",
		head: {
			view: "toolbar",
			cols: [
				{ view: "label", label: "Выгрузка организаций" }
			]
		},
		body: {
			rows: [
				{
					cols: [
						{ view: "label", label: "Выгружено организаций:" },
						{ view: "label", label: "0", id: "countlabel" }
					]
				}
			]
		}
	})

	webix.ui({
		rows: [
			{
				view: "toolbar", cols: [
					{ view: "button", id: "basebutton", type: "iconButton", icon: "plus-circle", label: "Создать базы", autowidth: true, click: selectCity, align: "left" },
					{ view: "button", hidden: false, id: "ctlbutton", disabled: true, type: "iconButton", icon: "play", label: "Старт", autowidth: true, click: startParsing, tooltip: "Запуск парсинга" },
					{ gravity: 4 },
					{ view: "button", hidden: true, id: "reloadbutton", type: "iconButton", tooltip: "Обновить", icon: "refresh", width: 36, click: reloadBases, align: "right" },
					{
						view: "select",
						id: "threads",
						label: "Количество потоков",
						labelWidth: 150,
						width: 200,
						hidden: true,
						//inputWidth: 50,
						value: 1,
						options: [
							{ id: 1, value: "1" }, { id: 2, value: "2" }, { id: 3, value: "3" },
							{ id: 4, value: "4" }, { id: 5, value: "5" }, { id: 6, value: "6" },
							{ id: 7, value: "7" }, { id: 8, value: "8" }, { id: 9, value: "9" },
							{ id: 10, value: "10" }, { id: 11, value: "11" }, { id: 12, value: "12" },
							{ id: 13, value: "13" }, { id: 14, value: "14" }, { id: 15, value: "15" },
							{ id: 16, value: "16" }, { id: 17, value: "17" }, { id: 18, value: "18" },
							{ id: 19, value: "19" }, { id: 20, value: "20" }
						],
						align: "left"
					}
				]
			},
			{
				view: "datatable",
				scrollX: false,
				id: "basestable",
				eachRow: mark_minus,
				columns: [
					{ id: "status", header: { content: "masterCheckbox", css: "center", id: "masterCheckbox", contentId: "mc1" }, width: 60, css: "center", checkValue: "1", uncheckValue: "0", template: "{common.checkbox()}" },
					{ id: "id", header: "", width: 50 },
					{ id: "title", header: "Город", width: 200 },
					{ id: "task_title", header: "Задача", width: 200 },
					{ id: "dbname", header: "Имя базы", width: 200 },
					{ id: "count", header: "Организаций", width: 100, format: mark_minus, cssFormat: mark_finished }
				],
			},
			{
				view: "toolbar", cols: [
					{ view: "button", type: "iconButton", icon: "download", label: "Выгрузить выделенные", autowidth: true, id: "exportbutton", click: exportBases, align: "left", tooltip: "Выгрузить выделенные базы" },
					{ view: "button", type: "iconButton", icon: "remove", label: "Удалить выделенные", autowidth: true, id: "deletebutton", click: deleteBases, align: "left", tooltip: "Удалить выделенные базы" },
					{ gravity: 4 },
					{ view: "button", type: "iconButton", icon: "cog", label: "Настройки", autowidth: true, id: "propertybutton", click: showProperty, align: "right", tooltip: "Настройки", disabled: true }
				]
			},
		]
	})

	webix.ui({
		view: "window",
		id: "mywin",
		move: true,
		modal: true,
		height: 500,
		width: 500,
		resize: true,
		position: "center",
		head: {
			view: "toolbar",
			cols: [
				{ view: "label", label: "Выберите города для парсинга", id: "mylabel" },
				{ view: "button", label: 'Закрыть', width: 100, align: 'right', click: "$$('mywin').hide();" }
			]
		},
		body: {
			rows: [
				{ id: "lll" },
				{ id: "mybutton" }
			]
		}
	})

	$$("mywin").attachEvent("onKeyPress", function (code) {
		if (code == '27') {
			this.hide()
		}
	})
}

function loadProperty(callback) {

}

function setProperty() {

}

function selectTask() {
	$$("mytree").filter("#value#", '')
	taskData.rubrics = getSelectedRubrics()

	webix.ui({
		id: "lll", rows: [{
			view: "form",
			id: "mytree",
			width: 300,
			elements: [
				{ view: "label", label: 'Например: "Автосалоны Абакана"' },
				{ id: "tasktext", view: "text" },
			]
		}]
	}, $$('lll'))

	webix.ui(
		{ view: "button", id: "mybutton", value: "Завершить", width: 100, click: createFilters, hotkey: "enter" }
		, $$('mybutton'))

	webix.ui(
		{ view: "label", label: "Укажите имя задачи", id: "mylabel" }
		, $$('mylabel'))

	$$('mywin').show()
	$$('tasktext').focus()
}

function selectCity() {
	webix.ui({
		id: "lll", rows: [
			{ view: "tree", id: "mytree", threeState: true, scroll: "y", width: 400, template: "{common.icon()} {common.checkbox()}&nbsp<span>#value#</span>", data: getCityData(), select: false }
		]
	}, $$('lll'))

	webix.ui(
		{ view: "button", id: "mybutton", value: "Продолжить", width: 100, click: createBases }
		, $$('mybutton'))

	webix.ui(
		{ view: "label", label: "Выберите города для парсинга", id: "mylabel" }
		, $$('mylabel'))

	$$('mywin').show()
}

function reloadBases() {
	var tasks = parser.getBases()

	if ($$('ctlbutton')) {
		if (tasks.length > 0) {
			$$('ctlbutton').enable()
			if (!started) {
				$$('deletebutton').enable()
				$$('exportbutton').enable()
				$$('threads').enable()
				//$$('propertybutton').enable()
			}
		}
		else {
			$$('ctlbutton').disable()
			$$('deletebutton').disable()
			$$('exportbutton').disable()
			$$('threads').disable()
			//$$('propertybutton').disable()
		}
	}

	$$('basestable').parse(tasks)
	uncheckMaster()
}

function uncheckMaster() {
	$$("basestable").getHeaderContent("mc1").uncheck()
}

function showProperty() {
	loadProperty(function () {
		$$("sets").setValues(JSON.parse(property))
		$$("propertywin").show()
	})
}

function esc() {
	$$('searchtext').refresh()
	$$('searchtext').setValue('')
	$$('searchtext').focus()
	$$("mytree").filter("#value#", $$('searchtext').getValue())
}

function createBases() {
	var cities = getSelectedCities()
	if (cities.length > 0) {
		taskData.cities = cities

		webix.ui({
			id: "lll",
			rows: [
				{ view: "text", id: "searchtext", placeholder: "Поиск" },
				{
					view: "tree", filterMode: {},
					id: "mytree", threeState: true, scroll: "y", template: "{common.icon()} {common.checkbox()}&nbsp<span>#value#</span>", select: false, data: getCategoryData(), datatype: "json", ready: function () {
						this.checkItem("root")
					}
				}
			]
		}, $$('lll'))

		$$("searchtext").attachEvent("onKeyPress", function (code) {
			if (code == '27') {
				esc()
			}
		})

		$$("mytree").attachEvent("onKeyPress", function (code) {
			if (code == '27') {
				esc()
			}
		})

		$$("searchtext").attachEvent("onTimedKeyPress", function () {
			if (this.getValue().length > 1)
				$$("mytree").filter("#value#", this.getValue())
			else
				$$("mytree").filter()
		})

		webix.ui(
			{ view: "button", id: "mybutton", inputWidth: 100, label: "Продолжить", click: selectTask }
			, $$('mybutton'))

		webix.ui(
			{ view: "label", label: "Выберите категории и рубрики", id: "mylabel" }
			, $$('mylabel'))
		$$('mytree').checkItem("root")

		$$('searchtext').focus()
	}
	else {
		webix.message({ type: "error", text: "Необходимо выбрать хотя бы один город для создания базы" })
	}
}

function getSelectedCities() {
	var countries = $$('mytree').serialize()
	var res = []

	for (var i = 0; i < countries.length; i++) {
		for (var k = 0; k < countries[i].data.length; k++) {
			if (countries[i].data[k].checked) {
				res.push({
					id: countries[i].data[k].id,
					title: countries[i].data[k].value,
					code: countries[i].data[k].code
				})
			}
		}
	}

	return res
}

function getSelectedRubrics() {
	var root = $$('mytree').serialize()
	var categories = root[0].data
	var res = []

	/* 	if (root[0].checked) {
			return res
		}
	 */
	for (var i = 0; i < categories.length; i++) {
		for (var k = 0; k < categories[i].data.length; k++) {
			if (categories[i].data[k].checked) {
				res.push(categories[i].data[k].id)
			}
		}
	}

	return res
}

function createFilters() {
	if ($$('tasktext').getValue().trim() != '') {
		taskData.name = $$('tasktext').getValue()
		parser.createTask(taskData.name, taskData.cities, taskData.rubrics)

		$$('mywin').hide()
		$$('basestable').clearAll()
		reloadBases()
	}
	else {
		$$('tasktext').setValue('')
		$$('tasktext').focus()
	}
}

function deleteBases() {
	if (getCheckedCount() > 0) {
		var tasks = $$('basestable').serialize()
		var checked = []

		for (var i = 0; i < tasks.length; i++) {
			if (tasks[i].status == '1') {
				checked.push(tasks[i].dbname)
			}
		}

		parser.removeBases(checked)

		$$('basestable').clearAll()
		reloadBases()
	}
}

function exportBases() {
	if (getCheckedCount() > 0) {
		var dp = ''

		if (dat.user_id == '0') {
			dp = 'gis_abakan'
		}
		$$('exportbutton').disable()
		dialog.showSaveDialog({ buttonLabel: "Выгрузить", defaultPath: dp, filters: [{ name: 'Excel', extensions: ['csv'] }] }, function (filename) {
			$$('exportbutton').enable()
			if (filename) {
				if (getCheckedCount() > 0) {
					var tasks = $$('basestable').serialize()
					var checked = []

					for (var i = 0; i < tasks.length; i++) {
						if (tasks[i].status == '1' && tasks[i].count > 0)  {
							checked.push(tasks[i])
						}
					}

					$$('exportwin').show()
					$$('countlabel').setValue('0')

					parser.on('msg', (c) => {
						$$('countlabel').setValue(c.toString())
					})

					parser.export(checked, filename, (e) => {
						webix.message("Выгрузка выполнена")
						$$('exportwin').hide()
						uncheckMaster()
						shell.openItem(filename)
					})
				}
			}
		})
	}

}

function buyParser() {
	shell.openExternal(JSON.parse(dat).buy_url)
}

function setKey() {
	if ($$('keytext').getValue().trim() != '') {
		parser.setKey($$('keytext').getValue(), function (res) {
			if (res) {
				webix.alert("Ваш ключ успешно активирован!", function () {
					$$('keywin').hide()
					win.reload()
				})
			} else {
				webix.alert("Указанный вами ключ недействителен")
				$$('keytext').setValue('')
			}
		})
	}
	else {
		$$('keytext').setValue('')
	}
}

function getCheckedCount() {
	var cnt = 0
	$$('basestable').eachRow(
		function (row) {
			if ($$('basestable').getItem(row).status == '1') {
				cnt++
			}
		}
	)

	return cnt
}

function startParsing2() {
	started = true
	$$('threads').disable()
	$$('deletebutton').disable()
	$$('exportbutton').disable()
	$$('propertybutton').disable()

	webix.ui({ view: "button", id: "ctlbutton", type: "iconButton", icon: "stop", label: "Стоп", autowidth: true, click: stopParsing, tooltip: "Остановка парсинга" }, $$('ctlbutton'))

	gis.parseBases($$('threads').getValue(), function (res, type) {
		if (type == 'msg') {
			var id = $$('basestable').getIdByIndex(res[0])
			var record = $$('basestable').getItem(id)
			record['count'] = res[1]
			$$('basestable').updateItem(id, record)
		}
		else if (type == 'close') {
			if (started) {
				let id = $$('basestable').getIdByIndex(res.index)
				$$('basestable').addCellCss(id, "count", "highlight")
				webix.message("Сборка города " + res.title + " завершена")
			}
		}
		else if (type == 'finished') {
			stopParsing()
		}
	})
}



function startParsing() {
	started = true
	$$('threads').disable()
	$$('deletebutton').disable()
	$$('exportbutton').disable()
	$$('propertybutton').disable()
	webix.ui({ view: "button", id: "ctlbutton", type: "iconButton", icon: "stop", label: "Стоп", autowidth: true, click: stopParsing, tooltip: "Остановка парсинга" }, $$('ctlbutton'))
	parser.start((r) => {
		var id = $$('basestable').getIdByIndex(parser.curIndex)
		var record = $$('basestable').getItem(id)
		if (r.type) {
			if (r.type == 'base') {
				$$('basestable').addCellCss(id, "count", "highlight")
				webix.message("Сборка города " + r.cityTitle + " завершена")
			} else if (r.type == 'finish') {
				webix.message("Парсинг завершен")
			}
		} else {
			record['count'] = r
			$$('basestable').updateItem(id, record)
		}
	}, () => {
		stopParsing()
	})
	//$$('basestable').updateItem(id, record)

}

function loadDemo() {

	keywin.close()
	//$$('keywin').hide();
	//win.reload()
}

function stopParsing() {
	started = false
	parser.stop()

	//gis.stopChilds()
	$$('threads').enable()
	$$('deletebutton').enable()
	$$('exportbutton').enable()
	$$('propertybutton').enable()
	webix.ui({ view: "button", id: "ctlbutton", type: "iconButton", icon: "play", label: "Старт", autowidth: true, click: startParsing, tooltip: "Запуск парсинга" }, $$('ctlbutton'))

}

