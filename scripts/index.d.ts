interface String {
	encode(): string
	decode(): string
}

export module "@minecraft/server" {
	interface Player {
		isOwner(): boolean
		isAdmin(): boolean
		kick(reason: string, banned?: boolean): void
		sendMsg(message: string): void
		sendError(message: string): void
	}
}