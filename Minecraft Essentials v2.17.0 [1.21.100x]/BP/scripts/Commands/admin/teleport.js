/**
 * @param {import("../../main").default} Server 
 */
const teleport = (Server) => {
  Server.Commands.register({
    name: "teleport",
    description: "Teleport to player",
    usage: "teleport <player_name>",
    permission: "teleport",
    aliases: ["tp"],
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      const res = player.runCommand(`tp "${targetPlayer.name}"`)
      if (res.successCount > 0) {
        player.sendMessage("§aTeleport successful.")
      } else {
        player.sendMessage("§cTeleport failed.")
      }
    } else {
      player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default teleport