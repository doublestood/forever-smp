const unban = (Server) => {
  const BanDB = Server.BanDB

  Server.Commands.register({
    name: "unban",
    description: "mce.command.unban.description",
    usage: "unban <player_name>",
    permission: "ban",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = BanDB.get(args[0])
    if (targetPlayer != undefined) {
      await BanDB.delete(args[0])
      player.sendMessage({ translate: "mce.command.unban.successfully", with: [args[0]] })
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default unban