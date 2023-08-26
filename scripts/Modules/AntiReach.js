import { world, Vector } from "@minecraft/server"
import { doPunishment } from "../globalVars.js"

export default {
	name: "Reach",
	enable() {
		this.id = world.afterEvents.entityHitEntity.subscribe(data => {
			if (data.damagingEntity.typeId !== "minecraft:player" || data.hitEntity.typeId !== "minecraft:player") return
			if ((this.admin && data.damagingEntity.isAdmin()) || data.damagingEntity.isOwner()) return
			const raycast = data.damagingEntity.getEntitiesFromViewDirection()[0]
			let distance = raycast?.entity?.id !== data.hitEntity.id ? Math.min(Vector.distance(data.damagingEntity.getHeadLocation(), data.hitEntity.location), Vector.distance(data.damagingEntity.getHeadLocation(), data.hitEntity.getHeadLocation())) : raycast.distance
			if (distance > 6.9) doPunishment("Reach", data.damagingEntity)
		})
	},
	disable() {
		world.afterEvents.entityHitEntity.unsubscribe(this.id)
	}
}