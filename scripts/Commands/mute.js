import { Command } from "../Command.js";
import { timeFormat } from "../globalVars.js";

const muteCommand = new Command({
	name: "mute",
	description: "Mute a player! Ex: mute \"Player\" 1 month Spamming in chat!",
	permission: (player) => player.isAdmin(),
})

muteCommand.addArgument("player").chainArgument("time").chainArgument("all", true, async (player, [target, time, reason]) => {
	if (target.name === player.name) return player.sendError(`You can't mute yourself!`)
	if (reason?.length > 100) return player.sendError(`Mute reason has to be less than 100 characters long!`)
	const muteTime = target.getDynamicProperty("mute"), now = Date.now()
	if (muteTime) {
		if (muteTime === "permanent" || Number(muteTime) < now) return player.sendError(`${target.name} is already muted! Unmuted: ${muteTime === "permanent" ? "Never" : timeFormat(Number(muteTime) - now, now)}`)
		target.removeDynamicProperty("mute")
		if (reason) target.removeDynamicProperty('muteReason')
	}
	if (target.isOwner()) return player.sendError(`You can't mute the owner!`)
	if (target.isAdmin()) return player.sendError(`You can't mute an admin!`)
	target.setDynamicProperty("mute", (!time || time === "permanent") ? "permanent" : (now + time).toString())
	if (reason) target.setDynamicProperty("muteReason", reason)
	const f = timeFormat(time, now)
	target.sendError(`You have been muted.${reason ? ` Reason: ${reason}.` : ""} Unmuted: ${f}`)
	player.sendMsg(`Muted ${target.name}.${reason ? ` Reason: ${reason}.` : ""} Unmuted: ${f}`)
})

Command.register(muteCommand)