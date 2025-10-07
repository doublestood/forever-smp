const mute = (Server) => {
  Server.Commands.register({
    name: "mute",
    description: "mce.command.mute.description",
    usage: "mute <player_name>",
    permission: "mute",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.mute.target.self" })
    if (targetPlayer != undefined) {
      if (targetPlayer.isMuted()) return player.sendMessage({ translate: "mce.command.mute.target.muted" })
      await targetPlayer.mute()
      return player.sendMessage({ translate: "mce.command.mute.successfully", with: [targetPlayer.name] })
    } else {
      player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default mute