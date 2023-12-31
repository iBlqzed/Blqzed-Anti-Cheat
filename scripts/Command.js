import { world, ItemTypes, system } from "@minecraft/server";
import { config } from "./globalVars";
export class Command {
	constructor(info) {
		this.data = {
			name: "",
			arguments: [],
			subCommands: {}
		};
		this.data.name = info.name.toLowerCase();
		this.data.description = info.description;
		this.data.permission = info.permission ?? (() => true);
		this.data.callback = info.callback;
	}
	static register(command) {
		this.cache[command.data.name] = command.data;
	}
	addArgument(type, callback) {
		//@ts-ignore
		return (this.data.arguments[this.data.arguments.length] = new Argument(type, false, callback));
	}
	addOptionalArgument(type, callback) {
		return (this.data.arguments[this.data.arguments.length] = new Argument(type, true, callback));
	}
	addSubCommand(command) {
		this.data.subCommands[command.data.name] = command.data;
		return this;
	}
}
Command.cache = {};
class Argument {
	constructor(type, optional = false, callback) {
		this.type = type;
		this.optional = optional;
		this.callback = callback;
	}
	//@ts-ignore
	chainArgument(type, optional = false, callback) {
		if (this.optional && !optional)
			optional = true;
		//@ts-ignore
		return (this.nextArg = new Argument(type, optional, callback));
	}
	execute(player, arg, other, prevResult) {
		const handleOptionalError = () => {
			if (!this.nextArg) {
				//@ts-ignore
				this.callback?.(player, prevResult ? [prevResult, null].flat() : null);
				return true;
			}
			let nextArg = this.nextArg;
			const results = prevResult ? [prevResult].flat() : [null];
			while (true) {
				if (!nextArg.nextArg)
					return;
				nextArg = nextArg.nextArg;
				results.push(null);
				break;
			}
			nextArg.callback(player, results);
			return true;
		};
		if (!arg || arg === "") {
			if (this.optional)
				return handleOptionalError();
			return false;
		}
		const [result, args] = argTypes[this.type](arg, other, player) ?? [undefined, undefined];
		if (!args) return false
		if (this.nextArg)
			return this.nextArg.execute(player, args.shift(), args, prevResult ? [...prevResult, result] : [result]);
		//@ts-ignore
		this.callback?.(player, prevResult ? [...prevResult, result] : result);
		return true;
	}
}
const argTypes = {};
world.beforeEvents.chatSend.subscribe(ev => {
	if (!ev.message.startsWith(config.commandPrefix))
		return;
	ev.cancel = true
	const player = ev.sender;
	const [name, ...args] = ev.message.slice(config.commandPrefix.length).trim().split(/\s+/g);
	//@ts-ignore
	let data = Command.cache[name.toLowerCase()];
	//@ts-ignore
	let nextArg = args.shift();
	if (!data) return player.sendError(`Invalid command!`);
	//@ts-ignore
	if (!data.permission(player)) return player.sendError(`§cInvalid command permission!`);
	if (data?.callback) system.run(() => data.callback(player, args));
	const end = () => {
		const keys = Object.keys(data.subCommands);
		const argthing = (arg, prevType = "") => {
			//@ts-ignore
			if (arg.nextArg)
				return argthing(arg.nextArg, prevType + arg.type + "-");
			return prevType + arg.type;
		};
		//@ts-ignore
		const thing = [nextArg, ...args].join(" ");
		player.sendError(`Invalid arguments ${thing.length === 0 ? "[Nothing]" : thing}, expected ${[(keys.length === 0 ? undefined : keys.join(", ")), (data.arguments.length === 0 ? undefined : data.arguments.map(v => argthing(v)).join(", "))].filter(v => v).join(" or ")}`);
	};
	system.run(() => {
		while (true) {
			const sub = data.subCommands?.[nextArg ?? ''];
			if (sub) {
				if (!sub.permission(player))
					return player.sendError(`Invalid sub-command permission for command ${sub.name}!`);
				data = sub;
				nextArg = args.shift();
				continue;
			}
			let found = false;
			if (data.arguments.length === 0 && Object.keys(data.subCommands).length === 0)
				return;
			for (const arg of data.arguments) {
				//@ts-ignore
				const worked = arg.execute(player, nextArg, args.map(v => v));
				if (!worked)
					continue;
				found = true;
				break;
			}
			if (!found)
				end();
			break;
		}
	})
});
function addArgument(type, callback) {
	//@ts-ignore
	argTypes[type] = callback;
}
addArgument("all", (nextArg, args) => {
	return [[nextArg, ...args].join(" "), []];
});
addArgument("string", (nextArg, args) => {
	if (nextArg.startsWith('"')) {
		const argsCopy = args.map(v => v);
		let currentArg = nextArg, result = "";
		while (currentArg) {
			result += " " + currentArg;
			if (result.endsWith('"') && result !== ' "')
				return [result.slice(2, -1), argsCopy];
			currentArg = argsCopy.shift();
		}
	}
	return [nextArg, args];
});
addArgument("number", (nextArg, args) => {
	const v = Number(nextArg);
	if (!isNaN(v))
		return [v, args];
});
addArgument("boolean", (nextArg, args) => {
	const v = nextArg.toLowerCase();
	if (!["true", "false"].includes(v))
		return;
	return [v[0] === "t" ? true : false, args];
});
addArgument("player", (nextArg, args, player) => {
	if (!nextArg.startsWith('"')) {
		const target = world.getPlayers({ name: nextArg[0] === "@" ? nextArg.slice(1) : nextArg })[0];
		if (target)
			return [target, args];
	}
	let currentArg = nextArg, result = "";
	while (currentArg) {
		result += " " + currentArg;
		if (result.endsWith('"')) {
			const target = world.getPlayers({ name: result[2] === "@" ? result.slice(3, -1) : result.slice(2, -1) })[0];
			if (target)
				return [target, args];
			break;
		}
		currentArg = args.shift();
	}
});
addArgument("offlinePlayer", (nextArg, args, player) => {
	if (!nextArg.startsWith('"'))
		return [nextArg, args];
	let currentArg = nextArg, result = "";
	while (currentArg) {
		result += " " + currentArg;
		if (result.endsWith('"'))
			return [result.slice(2, -1), args];
		currentArg = args.shift();
	}
});
addArgument("item", (nextArg, args) => {
	const v = ItemTypes.get(nextArg);
	if (v)
		return [v, args];
});
addArgument("time", (nextArg, args) => {
	const lower = nextArg.toLowerCase();
	if (lower === "permanent" || lower === "perm")
		return ["permanent", args];
	let t = parseInt(lower), i = 1, unit = args[0]?.[0]?.toLowerCase();
	if (isNaN(t)) {
		i = 0;
		const v = /^(\d+)\s*(\w+)$/.exec(nextArg);
		if (!v)
			return;
		t = parseInt(v[1]);
		unit = v[2][0].toLowerCase();
	}
	if (isNaN(t))
		return;
	const v = (num) => [Number(t) * num, args.slice(i)];
	if (unit === "s")
		return v(1000);
	if (unit === "m")
		return v(60000);
	if (unit === "h")
		return v(3600000);
	if (unit === "d")
		return v(86400000);
	if (unit === "w")
		return v(604800000);
	if (unit === "y")
		return v(31536000000);
});
