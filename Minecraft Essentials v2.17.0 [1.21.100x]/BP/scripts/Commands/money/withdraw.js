import { ItemStack, world } from "@minecraft/server"
import Utility from "../../Modules/Utility"
import Money from "../../Modules/Money"

/** @param {import("../../main").default} Server */
const withdraw = (Server) => {
  Server.Commands.register({
    name: "withdraw",
    description: "mce.command.withdraw.description",
    usage: "withdraw <amount>",
    aliases: ["banknote"],
    category: "Money"
  }, async (data, player, args) => {
    if (player.getInvetory().emptySlotsCount <= 0) return player.sendMessage({ translate: "mce.player.inventory.full" })
    if (!args[0]) return player.sendMessage({ translate: "mce.command.withdraw.inputammount" })
    let amount = Number(args[0])
    if (!Number.isInteger(amount)) return player.sendMessage({ translate: "mce.command.inputnumber" })
    if (amount <= 0) return player.sendMessage({ translate: "mce.command.pay.inputmorethanone" })
    let playerMoney = player.getMoney()
    if (amount > playerMoney) return player.sendMessage({ translate: "mce.command.insufficientfunds" })
    playerMoney = playerMoney - amount
    await player.setMoney(playerMoney)

    player.getInvetory().addItem(Banknote.create(amount))
    return player.sendMessage({ translate: "mce.command.withdraw.converted", with: [Utility.formatMoney(amount)] })
  })

  const Banknote = {}

  Banknote.create = (amount) => {
    const bankNote = new ItemStack("minecraft:paper")
    bankNote.nameTag = `§r§e${Utility.formatMoney(amount, false)} §fBanknote`
    bankNote.setLore([
      "",
      `§r§eValue: §r${amount}`,
      `§r§eCreated: §r${new Date().toLocaleDateString()}`,
    ])

    return bankNote
  }

  Banknote.parse = (banknote) => {
    const lore = banknote.getLore()
    return Number(lore?.[1]?.substring("§r§eValue: §r".length)) ?? undefined
  }

  world.beforeEvents.itemUse.subscribe(async data => {
    if (data.cancel || Server.Setting.get("withdrawSystem") == false) return
    const { itemStack, source: player } = data
    const selectedSlot = player.selectedSlotIndex
    if (itemStack.typeId === "minecraft:paper") {
      if (!player.isSneaking) {
        const banknoteMoney = Banknote.parse(itemStack)
        if (!banknoteMoney) return
        data.cancel = true
        if (player.getMoney() >= Money.getMaxMoney()) return player.sendMessage({ translate: "mce.player.money.maxed" })

        await null;
        player.setMoney(player.getMoney() + banknoteMoney)
        if ((itemStack.amount - 1) <= 0) {
          player.getInvetory().setItem(selectedSlot)
        } else {
          itemStack.amount -= 1
          player.getInvetory().setItem(selectedSlot, itemStack)
        }
        return player.sendMessage({ translate: "mce.command.withdraw.claimed", with: [Utility.formatMoney(banknoteMoney)] })
      }
    }
  })
}

export default withdraw