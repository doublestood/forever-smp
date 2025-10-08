import Utility from "../../Modules/Utility"

const tempban = (Server) => {
  const BanDB = Server.BanDB

  Server.Commands.register({
    name: "tempban",
    description: "mce.command.tempban.description",
    usage: "tempban <player_name> <time> <reason?>",
    permission: "ban",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.ban.target.self" })
    if (!args[1]) return player.sendMessage({ translate: "mce.command.tempban.inputduration" })
    let time = Utility.convertTextToMilliseconds(args[1])
    if (time <= 0) return player.sendMessage({ translate: "mce.command.tempban.inputduration" })
    let duration = Date.now() + time
    let reason = args.slice(2).join(" ") || "No reason"
    if (targetPlayer != undefined) {
      await BanDB.set(targetPlayer.name, {
        reason: reason,
        by: player.name,
        duration: duration
      })
      let result = await targetPlayer.kick(`\n§c§lYou're have been banned\nReason : §e${reason} \n§cBy : §e${player.name} \n§cDuration : §e${Utility.formatTextFutureDate(duration)}`)
      player.sendMessage({ translate: "mce.command.ban.successfully", with: [targetPlayer.name] })
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default tempban