import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Command } from "../Command.js";
import { modules } from "../index.js";
import { config, show, timeToMS } from "../globalVars.js";

async function showModulesForm(player) {
	const modulesForm = new ActionFormData().title("Modules").body("Select which module to edit")
	const keys = Object.keys(modules)
	keys.forEach(mod => modulesForm.button(mod))
	const result = await show(player, modulesForm)
	if (result.canceled) return
	showModuleForm(player, keys[result.selection])
}

async function showModuleForm(player, moduleName) {
	const mod = await config.modulesDB.get(moduleName)
	const moduleForm = new ActionFormData().title(moduleName).body("Select settings to edit").button("Enabled: " + (mod.enabled ? "§aYes" : "§cNo")).button("Admin: " + (mod.admin ? "§aYes" : "§cNo"))
	if (mod.punishment) moduleForm.button("View/Edit Punishment")
	if (mod.data) moduleForm.button("View/Edit Data")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	if (result.selection === 0) {
		mod.enabled = !mod.enabled
		if (mod.enabled) modules[moduleName].enable()
		else modules[moduleName].disable()
		await config.modulesDB.set(moduleName, mod)
		return showModuleForm(player, moduleName)
	}
	if (result.selection === 1) {
		mod.admin = !mod.admin
		modules[moduleName].admin = mod.admin
		await config.modulesDB.set(moduleName, mod)
		return showModuleForm(player, moduleName)
	}
	if (result.selection === 2) return mod.punishment ? showModulePunishmentForm(player, moduleName, mod) : showModuleDataForm(player, moduleName, mod)
	if (result.selection === 3) return showModuleDataForm(player, moduleName, mod)
}

const forms = [showModulePunishmentMessageForm, showModulePunishmentMuteForm, showModulePunishmentKickForm, showModulePunishmentBanForm]

async function showModulePunishmentForm(player, moduleName, mod) {
	const moduleForm = new ActionFormData().title(moduleName).body("Edit or view punishment!").button("View").button("Message").button("Mute").button("Kick").button("Ban")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	const index = result.selection
	if (index) return forms[index - 1](player, moduleName, mod)
	switch (mod.punishment.type) {
		case "message":
			player.sendMsg(`${moduleName}\nType: Message\nMessage: ${mod.punishment.data.message}`)
			break
		case "mute":
			player.sendMsg(`${moduleName}\nType: Mute\nLength: ${mod.punishment.data.length}\nReason: ${mod.punishment.data.reason}`)
			break
		case "kick":
			player.sendMsg(`${moduleName}\nType: Kick\nReason: ${mod.punishment.data.reason}`)
			break
		case "ban":
			player.sendMsg(`${moduleName}\nType: Ban\nLength: ${mod.punishment.data.length}\nReason: ${mod.punishment.data.reason}`)
			break
	}
}

async function showModulePunishmentMessageForm(player, moduleName, mod) {
	const moduleForm = new ModalFormData().title(moduleName).textField(`Message punishment\n\nSet the message sent`, "Message here...")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	const message = result.formValues[0]
	if (message === "") return player.sendError(`Couldn't alter message`)
	mod.punishment.type = "message"
	mod.punishment.data = { message }
	await config.modulesDB.set(moduleName, mod)
	player.sendMsg(`Changed the module's punishment`)
}

async function showModulePunishmentMuteForm(player, moduleName, mod) {
	const moduleForm = new ModalFormData().title(moduleName).textField(`Mute punishment\n\nSet the mute length`, "Length here...").textField("Set the mute reason", "Reason here...")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	const [length, reason] = result.formValues
	if (isNaN(timeToMS(length))) return player.sendError(`Couldn't alter length`)
	if (reason === "") return player.sendError(`Couldn't alter reason`)
	mod.punishment.type = "mute"
	mod.punishment.data = { length, reason }
	await config.modulesDB.set(moduleName, mod)
	player.sendMsg(`Changed the module's punishment`)
}

async function showModulePunishmentKickForm(player, moduleName, mod) {
	const moduleForm = new ModalFormData().title(moduleName).textField(`Kick punishment\n\nSet the kick reason`, "Reason here...")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	const reason = result.formValues[0]
	if (reason === "") return player.sendError(`Couldn't alter reason`)
	mod.punishment.type = "kick"
	mod.punishment.data = { reason }
	await config.modulesDB.set(moduleName, mod)
	player.sendMsg(`Changed the module's punishment`)
}

async function showModulePunishmentBanForm(player, moduleName, mod) {
	const moduleForm = new ModalFormData().title(moduleName).textField(`Ban punishment\n\nSet the ban length`, "Length here...").textField("Set the ban reason", "Reason here...")
	const result = await show(player, moduleForm)
	if (result.canceled) return
	const [length, reason] = result.formValues
	if (isNaN(timeToMS(length))) return player.sendError(`Couldn't alter length`)
	if (reason === "") return player.sendError(`Couldn't alter reason`)
	mod.punishment.type = "ban"
	mod.punishment.data = { length, reason }
	await config.modulesDB.set(moduleName, mod)
	player.sendMsg(`Changed the module's punishment`)
}

async function showModuleDataForm(player, moduleName, mod) {
	const moduleForm = new ModalFormData().title(moduleName)
	const keys = Object.keys(mod.data)
	keys.forEach(v => {
		switch (typeof v) {
			case "number":
			case "string":
				moduleForm.textField(`Edit ${v.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}`, `${typeof v} here...`, mod.data[v].toString())
				break
			case "boolean":
				moduleForm.toggle(`Edit ${v.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}`, mod.data[v])
				break
		}
	})
	const result = await show(player, moduleForm)
	if (result.canceled) return
	result.formValues.forEach((v, i) => {
		const data = keys[i]
		switch (typeof mod.data[data]) {
			case "string":
				if (!v || v === "") return player.sendError(`Couldn't alter ${data.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}}`)
				mod.data[data] = v
				break
			case "number":
				if (!v || v === "") return player.sendError(`Couldn't alter ${data.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}}`)
				const num = parseInt(v)
				if (isNaN(num) || num < 1) return player.sendError(`Couldn't alter ${data.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}}`)
				mod.data[data] = num
				break
			case "boolean":
				mod.data[data] = v
				break
		}
	})
	await config.modulesDB.set(moduleName, mod)
	player.sendMsg(`Edited the module data!`)
}

Command.register(new Command({
	name: "modules",
	description: "View or edit anticheat modules! Ex: modules",
	permission: (player) => player.isOwner(),
	async callback(player) {
		player.sendMsg(`Close chat to see the form`)
		showModulesForm(player)
	}
}))