import { Player, system, world } from "@minecraft/server"
import { Database } from "./Database.js"

export const config = {
    commandPrefix: "-",
    messagePrefix: "§l[§6BAC§f] §r",
    errorPrefix: "§l[§6BAC§f] §r§c",
    banDB: new Database("BAN"),
    clogDB: new Database("CLOG"),
    modulesDB: new Database("MODS", {
        GMC: {
            enabled: true,
            punishment: {
                type: "message",
                data: {
                    message: "You are not allowed to go into creative!",
                    flags: 1
                }
            },
            admin: true
        },
        Reach: {
            enabled: true,
            punishment: {
                type: "ban",
                data: {
                    length: "1 month",
                    reason: "You are not allowed to use reach hack!",
                    flags: 1
                }
            },
            admin: false
        },
        Autoclicker: {
            enabled: true,
            punishment: {
                type: "kick",
                data: {
                    reason: "You are not allowed to click over 15 cps!",
                    flags: 5
                }
            },
            data: {
                cpsLimit: 15
            },
            admin: false
        },
        Nuker: {
            enabled: true,
            punishment: {
                type: "ban",
                data: {
                    length: "1 month",
                    reason: "You are not allowed to use nuker!",
                    flags: 1
                }
            },
            admin: false
        },
        Fly: {
            enabled: true,
            punishment: {
                type: "message",
                data: {
                    message: "You are not allowed to fly!",
                    flags: 2
                }
            },
            admin: true
        },
        Phase: {
            enabled: true,
            punishment: {
                type: "kick",
                data: {
                    reason: "You are not allowed to phase!",
                    flags: 2
                }
            },
            admin: false
        },
        CLog: {
            enabled: true,
            data: {
                secondsSinceLastHit: 10,
                sendMessage: true
            },
            admin: true
        },
        Spam: {
            enabled: true,
            punishment: {
                type: "mute",
                data: {
                    length: "15 minutes",
                    reason: "You are not allowed to spam in chat!",
                    flags: 16
                }
            },
            data: {
                messagesIn3Seconds: 5
            },
            admin: true
        }
    }),
}

Player.prototype.isAdmin = function () {
    return this.getDynamicProperty("isAdmin")
}

Player.prototype.isOwner = function () {
    return this.getDynamicProperty("isOwner")
}

Player.prototype.sendMsg = function (message) {
    this.sendMessage(config.messagePrefix + message)
}

Player.prototype.sendError = function (message) {
    this.sendMessage(config.errorPrefix + message)
    try { this.playSound("note.bass") } catch { system.run(() => this.playSound("note.bass")) }
}

Player.prototype.kick = function (reason = "No reason specified", banned = false) {
    this.runCommandAsync(`kick "${this.name}" ${config.errorPrefix} You have been ${banned ? "Banned" : "Kicked"}! Reason: ${reason}`)
}

export function timeToMS(time) {
    if (!time || time.toLowerCase() === "permanent") return null
    const [t, unit] = /^(\d+)\s*(\w+)$/.exec(time.toLowerCase())?.slice(1, 3) ?? []
    if (!t) return NaN
    if (unit[0] === "s") return t * 1000
    if (unit[0] === "m") return t * 60000
    if (unit[0] === "h") return t * 3600000
    if (unit[0] === "d") return t * 86400000
    if (unit[0] === "w") return t * 604800000
    if (unit[0] === "y") return t * 31536000000
}

export async function doPunishment(module, player) {
    world.getAllPlayers().forEach(player => player.isAdmin() && player.sendMsg(`${player.name} getting punished for "${module}"`))
    const { punishment } = await config.modulesDB.get(module);
    switch (punishment.type) {
        case "message":
            player.sendError(punishment.data.message)
            break
        case "mute":
            const now = Date.now()
            const time = timeToMS(punishment.data.length)
            const reason = punishment.data.reason
            player.setDynamicProperty("mute", !time ? "permanent" : (now + time).toString())
            if (reason) player.setDynamicProperty("muteReason", reason)
            const f = timeFormat(time, now)
            player.sendError(`You have been muted.${reason ? ` Reason: ${reason}.` : ""} Unmuted: ${f}`)
            break
        case "kick":
            player.kick(punishment.data.reason)
            break
        case "ban": {
            const { reason, length } = punishment.data
            const time = timeToMS(length)
            const t = [(!time) ? "permanent" : Date.now() + time, reason]
            config.banDB.set(player.name, t)
            player.kick(reason, true)
            break
        }
    }
}

export function timeDifference(fromDate, toDate) {
    const differenceInSec = (toDate - fromDate) / 1000;
    const seconds = Math.floor(differenceInSec);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days >= 1) return [(typeof toDate === "number" ? new Date(toDate) : toDate).toLocaleDateString(), true];
    if (hours > 0) return [hours === 1 ? "1 hour" : `${hours} hours`, false];
    if (minutes > 0) return [minutes === 1 ? "1 minute" : `${minutes} minutes`, false];
    return [seconds === 1 ? "1 second" : `${seconds} seconds`, false];
}

export function timeFormat(time, now = Date.now()) {
    if (typeof time !== "number") return "Never"
    const v = timeDifference(now, time + now)
    return v[1] ? `on ${v[0]}` : `in ${v[0]}`
}

export async function show(player, form) {
    const result = await form.show(player)
    if (result.cancelationReason === "UserBusy") return new Promise((r) => system.run(() => show(player, form).then(r)))
    return Promise.resolve(result)
}