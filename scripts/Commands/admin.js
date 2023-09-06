import { Command } from "../Command.js";

const adminCommand = new Command({
	name: "admin",
	description: "Promote or demote an admin! Ex: admin \"Player\"",
	permission: (player) => player.isOwner(),
})

adminCommand.addArgument("player", (player, target) => {
	if (target.isOwner()) return player.sendError(`You can't demote the owner!`)
	const isAdmin = target.getDynamicProperty("isAdmin")
	player.sendMsg(isAdmin ? `Demoted ${target.name} from admin` : `Promoted ${target.name} to admin`)
	target.sendMsg(isAdmin ? `§cYou have been demoted from admin` : `§aYou have been promoted to admin`)
	target.setDynamicProperty("isAdmin", !isAdmin);
})

Command.register(adminCommand)