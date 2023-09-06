import { Command } from "../Command.js";
import { config } from "../globalVars.js";

const helpCommand = new Command({
	name: "help",
	description: "Get information on every command! Ex: help 1",
})

helpCommand.addOptionalArgument("number", (player, page) => {
	const pageIndex = page ? 5 * (page - 1) : 0
	const commands = Object.entries(Command.cache).filter(v => v[1].permission(player))
	const pagedCommands = commands.slice(pageIndex, pageIndex + 5)
	if (pagedCommands.length === 0) return player.sendError(`No commands on page ${page}!`)
	player.sendMsg(`Displaying page ${page || 1} of ${Math.ceil(commands.length / 5)}\n${pagedCommands.map(v => `§6${config.commandPrefix + v[0]}§r: ${v[1].description ?? "No description provided..."}`).join("\n")}`)
})

helpCommand.addOptionalArgument("string", (player, command) => {
	const commandData = Command.cache[command]
	if (!commandData) return player.sendError(`No command with the name "${command}"!`)
	const next = (arg, last = "") => arg.nextArg ? next(arg.nextArg, `${last}${arg.optional ? `[${arg.type}]` : `<${arg.type}>`} `) : `${last}${arg.optional ? `[${arg.type}]` : `<${arg.type}>`}`
	const format = (cmd, start = `§6${config.commandPrefix}${cmd.name}§r `) => Object.entries(cmd.subCommands).map(([name, data]) => format(data, start + name + " ")).join("\n") + "\n" + (cmd.arguments.length === 0 ? start : cmd.arguments.map(data => start + next(data)).join("\n"))
	player.sendMsg(`Displaying command "${command}"\n§r${commandData.description ?? "No description provided..."}${format(commandData)}`)
})

Command.register(helpCommand)