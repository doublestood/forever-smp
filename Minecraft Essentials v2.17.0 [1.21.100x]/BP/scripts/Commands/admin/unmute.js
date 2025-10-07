const unmute = (Server) => {
  Server.Commands.register({
    name: "unmute",
    description: "mce.command.unmute.description",
    usage: "unmute <player_name>",
    permission: "mute",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (!targetPlayer.isMuted()) return player.sendMessage({ translate: "mce.command.unmute.target.notmuted" })
      await targetPlayer.unmute()
      return player.sendMessage({ translate: "mce.command.unmute.successfully", with: [targetPlayer.name] })
    } else {
      player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default unmute