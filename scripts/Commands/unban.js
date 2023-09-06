import { config } from "../globalVars.js"
import { Command } from "../Command.js"

const unbanCommand = new Command({
	name: "unban",
	description: "Unban a player! Ex: unban \"Player\"",
	permission: (player) => player.isAdmin(),
})

unbanCommand.addArgument("offlinePlayer", async (player, target) => {
	if (!await config.banDB.has(target)) return player.sendError(`${target} is not banned!`)
	await config.banDB.delete(target)
	player.sendMsg(`Unbanned ${target}!`)
})

Command.register(unbanCommand)