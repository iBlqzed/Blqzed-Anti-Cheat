import { system, world } from "@minecraft/server"
import { doPunishment, config } from "../globalVars"

export default {
	name: "Autoclicker",
	enable() {
		this.id1 = world.afterEvents.entityHitEntity.subscribe(data => {
			if (data.damagingEntity.typeId !== "minecraft:player") return
			if ((this.admin && data.damagingEntity.isAdmin()) || data.damagingEntity.isOwner()) return
			data.damagingEntity.cps.push(20)
		})
		this.id2 = system.runInterval(async () => {
			const cpsLimit = (await config.modulesDB.get("Autoclicker")).data.cpsLimit
			for (const player of world.getAllPlayers()) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				const arr = player.cps = (player.cps ??= []).map(v => v - 1).filter(v => v)
				if (arr.length >= cpsLimit) doPunishment("Autoclicker", player)
			}
		})
	},
	disable() {
		world.afterEvents.entityHitEntity.unsubscribe(this.id1)
		system.clearRun(this.id2)
	}
}