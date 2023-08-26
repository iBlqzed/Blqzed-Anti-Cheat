import { Command } from "../Command.js";

const unmuteCommand = new Command({
	name: "unmute",
	description: "Unmute a player! Ex: unmute \"Player\"",
	permission: (player) => player.isAdmin(),
})

unmuteCommand.addArgument("player", async (player, target) => {
	if (!target.getDynamicProperty("mute")) return player.sendError(`${target.name} was not muted!`)
	target.removeDynamicProperty("mute")
	target.removeDynamicProperty("muteReason")
	player.sendMessage(`You have unmuted ${target.name}!`)
	target.sendMessage(`§aYou have been unmuted by ${player.name}!`)
})

Command.register(unmuteCommand) 