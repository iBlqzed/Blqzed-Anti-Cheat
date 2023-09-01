import { system, world } from "@minecraft/server"
import { doPunishment, config } from "../globalVars"

export default {
	name: "Spam",
	enable() {
		this.id1 = world.beforeEvents.chatSend.subscribe((data) => {
			const player = data.sender
			if ((this.admin && player.isAdmin()) || player.isOwner() || player.getDynamicProperty("mute") || data.message.startsWith(config.commandPrefix)) return
			player.messages.push(60)
		})
		this.id2 = system.runInterval(async () => {
			const spam = await config.modulesDB.get("Spam")
			if (!spam.data) await config.modulesDB.set("Spam", Object.assign(spam, {
				data: {
					messagesIn3Seconds: 5
				}
			}))
			const messageLimit = (await config.modulesDB.get("Spam")).data.messagesIn3Seconds
			for (const player of world.getAllPlayers()) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				const messages = player.messages = (player.messages ??= []).map(v => v - 1).filter(v => v)
				if (messages.length < messageLimit) continue
				player.messages = []
				doPunishment("Spam", player)
			}
		})
	},
	disable() {
		world.beforeEvents.chatSend.unsubscribe(this.id1)
		system.clearRun(this.id2)
	}
}