import { system, world } from "@minecraft/server"
import { doPunishment } from "../globalVars"

export default {
	name: "Fly",
	enable() {
		this.id = system.runInterval(() => {
			for (const player of world.getPlayers({ excludeGameModes: ['creative', 'spectator'] })) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				const hasEffect = player.getEffect("jump_boost") || player.getEffect("levitation")
				if (!hasEffect && (!player.isFalling && !player.isGliding && player.location.y - (player.lastLoc ??= player.location).y > 4 && player.getVelocity().y !== 0) || player.isFlying) doPunishment("Fly", player)
				player.lastLoc = player.location
			}
		})
	},
	disable() {
		system.clearRun(this.id)
	}
}