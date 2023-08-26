import { world, system } from "@minecraft/server";
import { timeFormat, config } from "../globalVars.js";

world.beforeEvents.chatSend.subscribe(data => {
	if (data.message.startsWith(config.commandPrefix)) return
	const muteTime = data.sender.getDynamicProperty("mute")
	if (!muteTime) return
	data.cancel = true
	const reason = data.sender.getDynamicProperty("muteReason")
	if (muteTime === "permanent") return data.sender.sendError(`You have been muted.${reason ? ` Reason: ${reason}.` : ""} Unmuted: Never`)
	const num = Number(muteTime)
	const now = Date.now()
	if (now < num) return data.sender.sendError(`You have been muted.${reason ? ` Reason: ${reason}.` : ""} Unmuted: ${timeFormat(num - now, now)}`)
	data.cancel = false
	system.run(() => {
		data.sender.removeDynamicProperty("mute")
		data.sender.removeDynamicProperty("muteReason")
	})
})