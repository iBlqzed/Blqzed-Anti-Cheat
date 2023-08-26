import { system, world } from "@minecraft/server"
import { doPunishment } from "../globalVars"

export default {
	name: "Nuker",
	enable() {
		this.id1 = world.afterEvents.blockBreak.subscribe(({ player, block, brokenBlockPermutation, dimension }) => {
			if ((this.admin && player.isAdmin()) || player.isOwner()) return
			const data = player.lastBlockData
			if (!data) return player.lastBlockData = [Date.now(), brokenBlockPermutation, block.location, 0]
			if (data[0] > Date.now() - 50) {
				dimension.getBlock(data[2]).setPermutation(data[1])
				dimension.getBlock(block.location).setPermutation(brokenBlockPermutation)
				dimension.getEntitiesAtBlockLocation(data[2]).forEach(v => v.typeId === "minecraft:item" && v.kill())
				dimension.getEntitiesAtBlockLocation(block.location).forEach(v => v.typeId === "minecraft:item" && v.kill())
			}
			if (data?.[3] >= 5) doPunishment("Nuker", player)
			player.lastBlockData = [Date.now(), brokenBlockPermutation, block.location, data[3] + 1]
		})
		this.id2 = system.runInterval(() => {
			for (const player of world.getAllPlayers()) {
				if ((this.admin && player.isAdmin()) || player.isOwner()) continue
				const data = player.lastBlockData
				if (!data) continue
				player.lastBlockData = [data[0], data[1], data[2], 0]
			}
		})
	},
	disable() {
		world.afterEvents.blockBreak.unsubscribe(this.id1)
		system.clearRun(this.id2)
	}
}