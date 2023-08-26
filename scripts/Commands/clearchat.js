import { config } from "../globalVars.js"
import { Command } from "../Command.js"
import { world } from "@minecraft/server"

const clearchatCommand = new Command({
	name: "clearchat",
	description: "Clear the chat! Ex: clearchat",
	permission: (player) => player.isAdmin(),
	callback(player) {
		world.sendMessage(`\n`.repeat(100) + `${config.messagePrefix}Chat has been cleared by ${player.name}`)
	}
})

Command.register(clearchatCommand)