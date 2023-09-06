import { world } from "@minecraft/server";
import { Command } from "../Command.js";

const broadcastCommand = new Command({
	name: "broadcast",
	description: "Broadcast a message! Example: -broadcast This is a message",
	permission: (player) => player.isAdmin(),
})

broadcastCommand.addArgument("all", (player, message) => {
	world.sendMessage(`${"-".repeat(50)}\n\n§l[§6BROADCAST§f] §r${message}\n\n${"-".repeat(50)}`)
})

Command.register(broadcastCommand)