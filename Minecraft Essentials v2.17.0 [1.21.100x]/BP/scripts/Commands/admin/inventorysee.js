import { EquipmentSlot, Player } from "@minecraft/server"
import ChestFormData from "../../Modules/ChestForms"
import { ForceOpen } from "../../Modules/Forms"
import Utility from "../../Modules/Utility"

/**
 * Get Index by Value in Object
 * @param {object} obj 
 * @param {any} value 
 * @returns {string}
 */
const findIndexByValue = (obj, value) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
  return undefined
}

const inventorysee = (Server) => {
  Server.Commands.register({
    name: "inventorysee",
    description: "mce.command.inventorysee.description",
    usage: "invsee <player_name>",
    aliases: ["invsee"],
    permission: "invsee",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      player.sendMessage({ translate: "mce.ui.closechat" })
      await CheckInventory(player, targetPlayer)
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}


/**
 * @param {Player} player 
 * @param {Player} targetPlayer 
 */
const CheckInventory = async (player, targetPlayer) => {
  let playerInventory = targetPlayer.getInvetory()
  let playerEquipment = targetPlayer.getEquipmentInventory()
  const InventoryForm = new ChestFormData("shop")
    .title(`${targetPlayer.name}'s Inventory`)

  let playerItems = {}
  for (let slot = 0; slot < playerInventory.size; slot++) {
    let item = playerInventory.getItem(slot)
    if (!item) continue
    playerItems[slot] = item
    let itemDesc = []
    let enchantments = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? []
    let enchantedItem = false
    if (enchantments.length > 0) {
      enchantedItem = true
      enchantments.forEach(e => itemDesc.push(Utility.enchantToText(e)))
    }
    itemDesc.push("")
    item.getLore().forEach(l => itemDesc.push("§o§5" + l))
    itemDesc.push(`§cClick to remove from inventory`)
    InventoryForm.button(slot, Utility.getItemname(item), itemDesc, item.typeId, item.amount, enchantedItem)
  }

  const buttonSlot = {
    "Head": 36,
    "Chest": 37,
    "Legs": 38,
    "Feet": 39,
    "Offhand": 44
  }
  let playerItemEquipment = {}
  for (const slot in EquipmentSlot) {
    let item = playerEquipment.getEquipment(slot)
    if (!item) continue
    if (!buttonSlot[slot]) continue
    playerItemEquipment[slot] = item
    let itemDesc = []
    let enchantments = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? []
    let enchantedItem = false
    if (enchantments.length > 0) {
      enchantedItem = true
      enchantments.forEach(e => itemDesc.push(Utility.enchantToText(e)))
    }
    itemDesc.push("")
    item.getLore().forEach(l => itemDesc.push("§o§5" + l))
    itemDesc.push(`§cClick to remove from inventory`)
    InventoryForm.button(buttonSlot[slot], Utility.getItemname(item), itemDesc, item.typeId, item.amount, enchantedItem)
  }

  let res = await ForceOpen(player, InventoryForm)
  if (!res.canceled) {
    if (res.selection < 36) {
      let selectedItem = playerItems[res.selection]
      if (!selectedItem) return
      let item = playerInventory.getItem(res.selection)
      if (!item || item.typeId != selectedItem.typeId) return player.sendMessage({ translate: "mce.command.inventorysee.item.unknown" })

      playerInventory.setItem(res.selection)
      player.getInvetory().addItem(item)
      player.sendMessage({ translate: "mce.command.inventorysee.remove" })
    } else {
      let slot = findIndexByValue(buttonSlot, res.selection)
      let selectedItem = playerItemEquipment[slot]
      if (!selectedItem) return
      let item = playerEquipment.getEquipment(slot)
      if (!item || item.typeId != selectedItem.typeId) return player.sendMessage({ translate: "mce.command.inventorysee.item.unknown" })

      playerEquipment.setEquipment(slot)
      player.getInvetory().addItem(item)
      player.sendMessage({ translate: "mce.command.inventorysee.remove" })
    }
    return CheckInventory(player, targetPlayer)
  }
}

export default inventorysee
export { CheckInventory }