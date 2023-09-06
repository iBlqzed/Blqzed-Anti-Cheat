import { world } from "@minecraft/server";
import { config, timeFormat } from "../globalVars.js";

world.afterEvents.playerSpawn.subscribe(async (data) => {
	if (!data.initialSpawn || !data.player) return
	if (data.player.isAdmin()) return config.banDB.delete(data.player.name)
	const player = data.player
	const arr = await config.banDB.get(player.name)
	console.warn(arr) 
	if (!arr) return
	console.warn(arr[0]) 
	const now = Date.now()
	if (arr[0] === "permanent" || arr[0] > now) return player.kick(arr[1] + ". Unbanned: " + timeFormat(arr[0] - now), true)
	config.banDB.delete(player.name)
	player.sendMsg(`§aYou have been unbanned!`)
})