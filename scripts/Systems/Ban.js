import { world } from "@minecraft/server";
import { config, timeFormat } from "../globalVars.js";

world.afterEvents.playerSpawn.subscribe(async (data) => {
	if (!data.initialSpawn) return
	if (data.player.isAdmin()) return config.banDB.delete(data.player.name)
	const arr = await config.banDB.get(data.player.name)
	if (!arr) return
	const now = Date.now()
	if (arr[0] === "permanent" || arr[0] < now) return player.kick(arr[1] + ". Unbanned: " + timeFormat(arr[0] - now), true)
	config.banDB.delete(data.player.name)
	data.player.sendMsg(`§aYou have been unbanned!`)
})