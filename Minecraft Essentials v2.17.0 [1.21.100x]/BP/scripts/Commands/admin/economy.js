import Money from "../../Modules/Money";
import Utility from "../../Modules/Utility"

const economy = (Server) => {
  Server.Commands.register({
    name: "economy",
    description: "mce.command.economy.description",
    usage: "economy <give/take/set/reset> <player_name> <amount>",
    permission: "economy",
    aliases: ["eco"],
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.economy.operations" })
    if (!args[1]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    const targetName = args[1]
    const targetPlayer = Server.getPlayer(targetName)
    if (!targetPlayer) return player.sendMessage({ translate: "mce.command.target.unknown" })

    switch (args[0].toLowerCase()) {
      case "give":
        if (!args[2]) return player.sendMessage({ translate: "mce.command.economy.inputammount" })
        var amount = Number(args[2])
        if (!Number.isInteger(amount)) return player.sendMessage({ translate: "mce.command.inputnumber" })
        targetPlayer.setMoney(targetPlayer.getMoney() + amount)
        if (amount < 0) return player.sendMessage({ translate: "mce.command.economy.take", with: [Utility.formatMoney(Math.abs(amount)), targetPlayer.name] })
        return player.sendMessage({ translate: "mce.command.economy.give", with: [Utility.formatMoney(amount), targetPlayer.name] })

      case "take":
        if (!args[2]) return player.sendMessage({ translate: "mce.command.economy.inputammount" })
        var amount = Number(args[2])
        if (!Number.isInteger(amount)) return player.sendMessage({ translate: "mce.command.inputnumber" })
        targetPlayer.setMoney(targetPlayer.getMoney() - amount)
        if (amount < 0) return player.sendMessage({ translate: "mce.command.economy.give", with: [Utility.formatMoney(Math.abs(amount)), targetPlayer.name] })
        return player.sendMessage({ translate: "mce.command.economy.take", with: [Utility.formatMoney(amount), targetPlayer.name] })

      case "set":
        if (!args[2]) return player.sendMessage({ translate: "mce.command.economy.inputammount" })
        var amount = Number(args[2])
        if (!Number.isInteger(amount)) return player.sendMessage({ translate: "mce.command.inputnumber" })
        targetPlayer.setMoney(amount)
        return player.sendMessage({ translate: "mce.command.economy.set", with: [Utility.formatMoney(amount), targetPlayer.name] })

      case "reset":
        targetPlayer.setMoney(Money.getStarterMoney())
        return player.sendMessage({ translate: "mce.command.economy.reset", with: [targetPlayer.name] })

      default:
        return player.sendMessage({ translate: "mce.command.economy.wrongoperations" })
    }

  })
}

export default economy