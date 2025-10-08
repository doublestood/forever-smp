const ban = (Server) => {
  const BanDB = Server.BanDB

  Server.Commands.register({
    name: "ban",
    description: "mce.command.ban.description",
    usage: "ban <player_name> <reason?>",
    permission: "ban",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.ban.target.self" })
    let reason = args.slice(1).join(" ") || "No reason"
    if (targetPlayer != undefined) {
      await BanDB.set(targetPlayer.name, {
        reason: reason,
        by: player.name
      })
      let result = await targetPlayer.kick(`\n§c§lYou're have been banned\nReason : §e${reason} \n§cBy : §e${player.name}`)
      player.sendMessage({ translate: "mce.command.ban.successfully", with: [targetPlayer.name] })
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default ban