import { system, world } from "@minecraft/server"
import { doPunishment } from "../globalVars"

export default {
	name: "GMC",
	enable() {
		this.id = system.runInterval(() => {
			for (const player of world.getPlayers({ gameMode: "creative" })) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				player.runCommandAsync("gamemode s @s")
				doPunishment("GMC", player)
			}
		})
	},
	disable() {
		system.clearRun(this.id)
	}
}