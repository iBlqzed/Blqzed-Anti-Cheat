import { DynamicPropertiesDefinition, EntityTypes, world, system } from "@minecraft/server"
import { config } from "./globalVars.js"

export const modules = {}

config.modulesDB.entries().then(mods => mods.forEach(async ([name, options]) => {
	const module = (await import("./Modules/Anti" + name)).default
	module.admin = options.admin
	if (options.enabled) module.enable()
	modules[name] = module
}))

world.afterEvents.worldInitialize.subscribe(data => {
	data.propertyRegistry.registerEntityTypeDynamicProperties(new DynamicPropertiesDefinition().defineBoolean("isAdmin", false).defineBoolean("isOwner", false).defineString("mute", 14).defineString("muteReason", 100), EntityTypes.get("minecraft:player"))
})

system.afterEvents.scriptEventReceive.subscribe(data => {
	if (data.id !== "AC:start") return
	const player = data.sourceEntity
	player.setDynamicProperty("isAdmin", true)
	player.setDynamicProperty("isOwner", true)
	player.sendMsg(`§aAnticheat started up! You are the owner! Run ${config.commandPrefix}help for more information`)
}, { namespaces: ["AC"] })

import("./Commands/index.js")
import("./Systems/index.js")