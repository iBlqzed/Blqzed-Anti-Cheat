import { Vector, system, world } from "@minecraft/server"
import { doPunishment } from "../globalVars"

export default {
	name: "Phase",
	enable() {
		this.id1 = world.afterEvents.projectileHit.subscribe(data => {
			const player = data.source
			if ((this.admin && player.isAdmin()) || player.isOwner()) return
			if (player?.typeId !== "minecraft:player") return
			const loc = player.location
			if (player.dimension.getBlock(loc).isSolid()) player.teleport(Vector.subtract(loc, Vector.multiply(data.hitVector, 3)))
		})
		this.id2 = system.runInterval(() => {
			for (const player of world.getAllPlayers()) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				const lastLoc = (player.lastLoc ??= player.location)
				const vel = player.getVelocity()
				if (player.dimension.getBlock(Vector.lerp(lastLoc, player.location, 0.5)).isSolid() && player.dimension.getBlock(Vector.lerp(Vector.add(lastLoc, Vector.up), Vector.add(player.location, Vector.up), 0.5)).isSolid() && !player.isSwimming) {
					if (vel.x === 0 && vel.y === 0 && vel.z === 0) continue
					const test = player.location.y - Math.floor(player.location.y)
					if (lastLoc.y !== player.location.y || test === 0.5) continue
					player.teleport(lastLoc)
					doPunishment("Phase", player)
				}
				player.lastLoc = player.location
			}
		})
	},
	disable() {
		world.afterEvents.projectileHit.unsubscribe(this.id1)
		system.clearRun(this.id2)
	}
}