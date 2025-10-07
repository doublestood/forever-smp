import { system, world } from "@minecraft/server"

/**
 * @param {import("../main").default} Server
 */
const tps = (Server) => {
  Server.Commands.register({
    name: "tps",
    description: "mce.command.tps.description",
    usage: "tps",
    category: "General"
  }, async (data, player, args) => {
    let TPS = Math.floor(Server.TPS())
    if (TPS > 20) TPS = 20
    player.sendMessage({ translate: "mce.command.tps.tps", with: [`${TPS}`] })
  })
}

export default tps