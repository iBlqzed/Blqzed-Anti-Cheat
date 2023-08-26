import { system, world } from "@minecraft/server"
import { config } from "../globalVars"

export default {
	name: "CLog",
	enable() {
		this.lastHits = {}
		this.data = {}
		this.id1 = world.afterEvents.entityHurt.subscribe(data => {
			if (data.hurtEntity.typeId !== "minecraft:player") return
			if ((this.admin && data.hurtEntity.isAdmin()) || data.hurtEntity.isOwner()) return
			if (data.damageSource.cause !== "entityAttack" || data.damageSource.damagingEntity.typeId !== "minecraft:player") return
			delete this.lastHits[data.damageSource.damagingEntity]
			this.lastHits[data.hurtEntity.id] = Date.now()
		})
		this.id2 = world.afterEvents.playerLeave.subscribe(async ({ playerId, playerName }) => {
			if (!this.lastHits.hasOwnProperty(playerId)) return
			const mod = await config.modulesDB.get("CLog")
			if (Date.now() - mod.data.secondsSinceLastHit * 1000 > this.lastHits[playerId]) return
			const [dimension, location, items] = this.data[playerId]
			if (mod.data.sendMessage) world.sendMessage(`${config.errorPrefix}${playerName} combat logged!`)
			items.forEach(item => dimension.spawnItem(item, location))
			config.clogDB.set(playerId, 0)
		})
		this.id3 = world.afterEvents.playerSpawn.subscribe(async ({ player, initialSpawn }) => {
			if (!initialSpawn) return
			if (!(await config.clogDB.has(player.id))) return
			config.clogDB.delete(player.id)
			player.runCommandAsync(`clear @s`)
			player.sendError(`You have been cleared for combat logging!`)
		})
		this.id4 = system.runInterval(async () => {
			for (const player of world.getAllPlayers()) {
				const inv = player.getComponent("minecraft:inventory").container
				const equip = player.getComponent("minecraft:equipment_inventory")
				this.data[player.id] = [player.dimension, player.location, [["head", "chest", "legs", "feet"].map(v => equip.getEquipment(v)).filter(v => v), Array.from({ length: 36 }).map((_, i) => inv.getItem(i)).filter(v => v)].flat()]
			}
		})
	},
	disable() {
		world.afterEvents.entityHurt.unsubscribe(this.id1)
		world.afterEvents.playerLeave.unsubscribe(this.id2)
		world.afterEvents.playerSpawn.unsubscribe(this.id2)
		system.clearRun(this.id4)
		delete this.lastHits
		delete this.items
	}
}