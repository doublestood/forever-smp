const kick = (Server) => {
  Server.Commands.register({
    name: "kick",
    description: "mce.command.kick.description",
    usage: "kick <player_name> <reason?>",
    permission: "kick",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.kick.target.self" })
    let reason = args.slice(1).join(" ") || "No reason"
    if (targetPlayer != undefined) {
      let result = await targetPlayer.kick(`\n§c§lYou're have been kicked\nReason : §e${reason} \n§cBy : §e${player.name}`)
      player.sendMessage({ translate: "mce.command.kick.successfully", with: [targetPlayer.name] })
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default kick