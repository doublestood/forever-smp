import Utility from "../../Modules/Utility"

const pay = (Server) => {
  Server.Commands.register({
    name: "pay",
    description: "mce.command.pay.description",
    usage: "pay <player_name> <amount>",
    category: "Money"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (!args[1]) return player.sendMessage({ translate: "mce.command.pay.inputammount" })
    if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.pay.target.self" })
    if (targetPlayer != undefined) {
      const maxMoney = Server.Money.getMaxMoney()
      let amount = Number(args[1])
      if (!Number.isInteger(amount)) return player.sendMessage({ translate: "mce.command.inputnumber" })
      if (amount <= 0) return player.sendMessage({ translate: "mce.command.pay.inputmorethanone" })
      let playerMoney = player.getMoney()
      let targetMoney = targetPlayer.getMoney()
      if (amount > playerMoney) return player.sendMessage({ translate: "mce.command.insufficientfunds" })
      if (targetMoney >= maxMoney) return player.sendMessage({ translate: "mce.command.pay.target.maxmoney", with: [targetPlayer.name] })
      if ((targetMoney + amount) > maxMoney) amount = maxMoney - targetMoney
      playerMoney = playerMoney - amount
      targetMoney = targetMoney + amount
      await player.setMoney(playerMoney)
      await targetPlayer.setMoney(targetMoney)
      player.sendMessage({ translate: "mce.command.pay.successfully", with: [targetPlayer.name, Utility.formatMoney(amount)] })
      targetPlayer.sendMessage({ translate: "mce.player.gotpaid", with: [player.name, Utility.formatMoney(amount)] })
      Server.Log(`[Money] ${player.name} paid to ${targetPlayer.name} for ${Utility.formatMoney(amount)}`)
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default pay