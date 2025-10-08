import Restful from "../../Modules/Restful"
import Utility from "../../Modules/Utility"

/**
 * @param {import("../../main").default} Server
 */
const money = (Server) => {
  Server.Commands.register({
    name: "money",
    description: "mce.command.money.description",
    usage: "money <player_name?>",
    aliases: ["bal", "balance"],
    category: "Money"
  }, async (data, player, args) => {
    if (!args[0]) {
      let playerMoney = player.getMoney()
      player.sendMessage({ translate: "mce.command.money.self", with: [Utility.formatMoney(playerMoney)] })
    } else {
      let targetPlayer = await Server.getPlayer(args[0])
      if (targetPlayer != undefined && targetPlayer != player) {
        let targetMoney = targetPlayer.getMoney()
        player.sendMessage({ translate: "mce.command.money.target", with: [targetPlayer.name, Utility.formatMoney(targetMoney)] })
      } else {
        let playerMoney = player.getMoney()
        player.sendMessage({ translate: "mce.command.money.self", with: [Utility.formatMoney(playerMoney)] })
      }
    }
  })
}

export default money