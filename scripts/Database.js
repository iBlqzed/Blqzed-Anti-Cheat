import { system, world, DynamicPropertiesDefinition } from "@minecraft/server";

let database = {}
const inits = {}

world.afterEvents.worldInitialize.subscribe((data) => {
	data.propertyRegistry.registerWorldDynamicProperties(new DynamicPropertiesDefinition().defineString("database", 500000))
	const prop = world.getDynamicProperty('database')
	database = prop ? JSON.parse(prop.decode()) : inits
	world.setDynamicProperty("database", JSON.stringify(database))
})

export class Database {
	constructor(name, init = {}) {
		this.name = name
		this.init = init
		inits[name] = init
	}
	async set(key, value) {
		await Database.queueDatabase()
		database[this.name][key] = value
		await Database.queueSave()
	}
	async get(key) {
		return Database.queueDatabase().then(() => database[this.name][key])
	}
	async delete(key) {
		await Database.queueDatabase()
		delete database[this.name][key]
		await Database.queueSave()
	}
	async has(key) {
		return Database.queueDatabase().then(() => database[this.name].hasOwnProperty(key))
	}
	async keys() {
		return Database.queueDatabase().then(() => Object.keys(database[this.name]))
	}
	async values() {
		return Database.queueDatabase().then(() => Object.values(database[this.name]))
	}
	async entries() {
		return Database.queueDatabase().then(() => Object.entries(database[this.name]))
	}
	async clear() {
		await Database.queueDatabase()
		database[this.name] = this.init
		await Database.queueSave()
	}
	static async queueDatabase() {
		if (!database) return new Promise((v) => system.runTimeout(() => this.queueDatabase().then(v), 5))
		return Promise.resolve()
	}
	static async queueSave() {
		if (this.saving) return
		this.saving = true
		return new Promise((v) => system.run((() => {
			world.setDynamicProperty("database", JSON.stringify(database))
			this.saving = false
			v(true)
		}).bind(this)))
	}
	static saving = false
}

String.prototype.encode = function () {
	var dict = {};
	var data = (this.valueOf() + "");
	var out = [];
	var currChar;
	var phrase = data[0];
	var code = 256;
	for (var i = 1; i < data.length; i++) {
		currChar = data[i];
		if (dict[phrase + currChar] != null) {
			phrase += currChar;
		}
		else {
			out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
			dict[phrase + currChar] = code;
			code++;
			phrase = currChar;
		}
	}
	out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
	for (var i = 0; i < out.length; i++) {
		out[i] = String.fromCharCode(out[i]);
	}
	return out.join("");
}

String.prototype.decode = function () {
	var dict = {};
	var data = (this.valueOf() + "").split("");
	var currChar = data[0];
	var oldPhrase = currChar;
	var out = [currChar];
	var code = 256;
	var phrase;
	for (var i = 1; i < data.length; i++) {
		var currCode = data[i].charCodeAt(0);
		if (currCode < 256) {
			phrase = data[i];
		}
		else {
			phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
		}
		out.push(phrase);
		currChar = phrase.charAt(0);
		dict[code] = oldPhrase + currChar;
		code++;
		oldPhrase = phrase;
	}
	return out.join("");
}