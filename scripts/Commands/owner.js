import { MessageFormData } from "@minecraft/server-ui";
import { Command } from "../Command.js";
import { show } from "../globalVars.js"

const ownerCommand = new Command({
	name: "owner",
	description: "Transfer ownership! Ex: owner \"Player\"",
	permission: (player) => player.isOwner(),
})

ownerCommand.addArgument("player", async (player, target) => {
	if (target.isOwner()) return player.sendError(`You can't demote the owner!`)
	player.sendMsg("Close chat to see form")
	const result = await show(player, new MessageFormData().title("TRANSFER OWNERSHIP").body(`§4Are you sure you want to transfer ownership?`.toUpperCase()).button1("§aYes").button2("§cNo"))
	if (result.canceled || result.selection === 1) return
	player.setDynamicProperty("isOwner", false)
	player.sendError(`You are no longer owner! You can no longer bypass the anticheat!`)
	target.setDynamicProperty("isOwner", true)
	target.sendMsg(`§aYou have been promoted to owner! You can now bypass the entire anticheat and have access to every command!`)
})

Command.register(ownerCommand)