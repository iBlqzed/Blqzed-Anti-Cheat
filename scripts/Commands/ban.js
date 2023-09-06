import { world } from "@minecraft/server";
import { Command } from "../Command.js";
import { config, timeFormat } from "../globalVars.js";

const banCommand = new Command({
	name: "ban",
	description: "Ban a player! Ex: ban \"Player\" 1 month Bypassing the anticheat!",
	permission: (player) => player.isAdmin(),
})

banCommand.addArgument("player").chainArgument("time", true).chainArgument("all", true, async (player, [target, time, reason]) => {
	if (target.name === player.name) return player.sendError(`You can't ban yourself!`)
	const get = await config.banDB.get(target.name)
	const now = Date.now()
	if (get) {
		if (get[0] === "permanent" || get[0] > now) return player.sendError(`${target.name} is already banned for: ${get[1]}! Unbanned: ${typeof get[0] === "number" ? timeFormat(get[0] - now, now) : "Never"}`)
		await config.banDB.delete(target.name)
	}
	if (target.isOwner()) return player.sendError(`You can't ban the owner!`)
	if (target.isAdmin()) return player.sendError(`You can't ban an admin!`)
	const t = [(!time || time === "permanent") ? "permanent" : now + time, reason]
	const f = typeof t[0] === "number" ? timeFormat(time) : "Never"
	config.banDB.set(target.name, t)
	target.kick((reason ?? "No reason specified") + ", Unbanned: " + f, true)
	player.sendMsg(`Banned ${target.name}${reason ? ` for ${reason}` : ""}, unbanned ${f}!`)
})

banCommand.addArgument("offlinePlayer").chainArgument("time", true).chainArgument("all", true, async (player, [target, time, reason]) => {
	const get = await config.banDB.get(target)
	const now = Date.now()
	if (get) {
		if (get[0] === "permanent" || get[0] > now) return player.sendError(`${target} is already banned for: ${get[1]}! Unbanned: ${typeof get[0] === "number" ? timeFormat(get[0] - now, now) : "Never"}`)
		await config.banDB.delete(target)
	}
	const t = [(!time || time === "permanent") ? "permanent" : now + time, reason]
	const f = typeof t[0] === "number" ? timeFormat(time, now) : "Never"
	config.banDB.set(target, t)
	player.sendMsg(`Banned ${target}${reason ? ` for ${reason}` : ""}, unbanned ${f}!`)
})

Command.register(banCommand)