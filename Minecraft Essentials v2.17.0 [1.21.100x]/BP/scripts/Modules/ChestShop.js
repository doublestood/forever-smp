import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import { Database } from "./Database"
import { ModalFormData, ActionFormData } from "@minecraft/server-ui"
import { ForceOpen } from "./Forms"
import Utility from "./Utility"
import Server from "../main"
import Ranks from "./Ranks"

const { world } = mc

const ChestShop = {}
const ChestShopDB = new Database("chestShopDB")
// ChestShopDB.clear()

/**
 * @param {mc.Player} player 
 * @param {mc.Block} sign 
 * @param {mc.Block} chest 
 * @param {{itemId: string, type: string, price: number}} data 
 */
ChestShop.createChestShop = (player, sign, chest, data) => {
  data.signLocation = sign.location
  data.chestLocation = chest.location
  data.dimensionId = chest.dimension.id
  data.playerName = player.name
  data.dataId = `${player.name}${Object.keys(sign.location).map(l => sign.location[l]).join("|")}`

  ChestShopDB.set(data.dataId, data)
}

/**
 * @param {string} dataId 
 */
ChestShop.editChestShop = (dataId, chestData) => {
  ChestShopDB.set(dataId, chestData)
}

/**
 * @param {string} dataId 
 */
ChestShop.deleteChestShop = (dataId) => {
  ChestShopDB.delete(dataId)
}

/**
 * 
 * @returns {{
 * signLocation: mc.Vector3, 
 * chestLocation: mc.Vector3, 
 * dimensionId: string, 
 * playerName: string, 
 * itemId: string, 
 * type: string, 
 * price: number,
 * adminShop: boolean,
 * dataId: string
 * }[]}
 */
ChestShop.GetAllShops = () => {
  return ChestShopDB.values()
}

/**
 * @param {mc.Block} sign 
 */
ChestShop.GetShopBySign = (sign) => {
  const { x, y, z } = sign.location
  return ChestShop.GetAllShops().find(({ dimensionId, signLocation }) => {
    if (dimensionId && dimensionId !== sign.dimension.id) return false
    if (
      signLocation.x === x &&
      signLocation.y === y &&
      signLocation.z === z
    ) return true
  })
}

/**
 * @param {mc.Block} chest 
 */
ChestShop.GetShopByChest = (chest) => {
  const { x, y, z } = chest.location
  return ChestShop.GetAllShops().find(({ dimensionId, chestLocation }) => {
    if (dimensionId && dimensionId !== chest.dimension.id) return false
    if (
      chestLocation.x === x &&
      chestLocation.y === y &&
      chestLocation.z === z
    ) return true
  })
}

/**
 * @param {mc.Block} block 
 * @returns {mc.Block | null}
 */
const getChestAround = (block) => {
  const checkLocation = ["east", "north", "south", "west"]
  let chest = undefined
  for (const direction of checkLocation) {
    let b = block[direction]()
    if (b.getComponent("inventory")) {
      chest = b
      break
    }
  }

  return chest
}

/**
 * @param {string} type 
 * @param {string} playerName 
 * @param {string} itemId 
 * @param {number} price 
 * @param {boolean} adminShop
 * @returns {mc.RawText}
 */
const formatText = (type, playerName, itemId, price, adminShop) => {
  return {
    rawtext: [
      { text: `§a§l${adminShop ? "Admin Shop" : playerName.slice(0, 12)}§r` },
      { text: `\n` },
      { text: type },
      { text: `\n` },
      { text: Utility.getItemname(new mc.ItemStack(itemId)).slice(0, 12) },
      { text: `\n` },
      { text: `${Utility.formatMoney(price)} each` }
    ]
  }
}

/**
 * @param {mc.Block} chest 
 * @param {string} itemId 
 * @returns {number}
 */
const calculateItemInChest = (chest, itemId) => {
  const chestContainer = chest.getComponent("minecraft:inventory").container
  let amount = 0
  for (let slot = 0; slot < chestContainer.size; slot++) {
    const item = chestContainer.getItem(slot)
    if (item && item.typeId == itemId) amount += item.amount
  }

  return amount
}

/**
 * 
 * @param {mc.Player | mc.Block} p 
 * @param {mc.ItemStack} targetItem 
 */
const itemCanGet = (p, targetItem) => {
  const container = p.getComponent("inventory").container
  if (container == undefined) return 0
  let canGet = container.emptySlotsCount * targetItem.maxAmount
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot)
    if (!item) continue
    if (item.isStackableWith(targetItem) && item.amount < targetItem.maxAmount) {
      canGet += item.maxAmount - item.amount
    }
  }

  return canGet
}

world.beforeEvents.playerInteractWithBlock.subscribe(async (data) => {
  const { block, player, itemStack } = data
  if (block.getComponent("minecraft:sign")) {
    if (ChestShop.GetShopBySign(block) == undefined) {
      if (!data.isFirstEvent) return
      if (block.getComponent("minecraft:sign").getText() !== "CREATESHOP") return
      data.cancel = true
      await null;
      if (!itemStack) return player.sendMessage("§cHold item that you wish to use!")
      const chest = getChestAround(block)
      if (!chest) return player.sendMessage("§cCannot find chest!")
      const shopTypes = []
      if (Ranks.getChestShopPermission(player, "chestshop.create.selling") || player.isAdmin())
        shopTypes.push("Selling")
      if (Ranks.getChestShopPermission(player, "chestshop.create.buying") || player.isAdmin())
        shopTypes.push("Buying")

      if (shopTypes.length == 0) return
      const createChestShopUI = new ModalFormData()
        .title("Chest Shop")
        .dropdown("Shop Type", shopTypes)
        .textField("Price for each item", "Input price here")

      if (player.isAdmin()) {
        createChestShopUI
          .divider()
          .label("If turned on, shop will have unlimitied stock.")
          .toggle("Admin Shop", { defaultValue: false })
      }

      ForceOpen(player, createChestShopUI).then(res => {
        if (!res.canceled) {
          res.formValues.forEach((v, i) => console.log(i, v))
          let [type, price, adminShop] = res.formValues
          type = shopTypes[type]
          if (price == "") return player.sendMessage("§cYou must complete the form!")
          price = Number(price)
          if (!Number.isSafeInteger(price) || price < 1) return player.sendMessage("§cYou must input a valid number in price!")

          ChestShop.createChestShop(player, block, chest, { itemId: itemStack.typeId, type, price, adminShop })
          block.getComponent("minecraft:sign").setText(formatText(type, player.name, itemStack.typeId, price, adminShop))
          block.getComponent("minecraft:sign").setWaxed(true)
          block.getComponent("minecraft:sign").setTextDyeColor()
          player.sendMessage("§aShop created successfully.")
        }
      })
    } else {
      data.cancel = true
      await null;
      const chestData = ChestShop.GetShopBySign(block)
      if (player.isSneaking) {
        if (player.name != chestData.playerName) return
      } else {
        if (chestData.type) return ChestShop[`${chestData.type}Function`](player, block, chestData)
        // if (chestData.type == "Selling") return ChestShop.SellingFunction(player, block, chestData)
        // if (chestData.type == "Buying") return ChestShop.BuyingFunction(player, block, chestData)
      }
    }
  }
  if (ChestShop.GetShopByChest(block) != undefined) {
    const chestData = ChestShop.GetShopByChest(block)
    if (player.name != chestData.playerName) data.cancel = true
  }
})

const deleteShop = (player, block, chestData) => {
  const deleteShopUI = new ui.MessageFormData()
    .title("Delete Chest Shop?")
    .body("Are you sure want to delete the chest shop?")
    .button2("§l§cDELETE")
    .button1("§l§aCANCEL")

  ForceOpen(player, deleteShopUI).then((res) => {
    if (res.selection === 1) {
      ChestShop.deleteChestShop(chestData.dataId)
      const { x, y, z } = block.location
      block.dimension.runCommand(`setblock ${x} ${y} ${z} minecraft:air destroy`)
      player.sendMessage("§aSuccessfully deleted chest shop.")
    }
  })
}

const editShop = (player, block, chestData) => {
  const shopTypes = ["Selling", "Buying"]
  const editShopUI = new ModalFormData()
    .title("Chest Shop")
    .dropdown("Shop Type", shopTypes, { defaultValueIndex: shopTypes.findIndex((t) => t == chestData.type) })
    .textField("Price for each item", "Input price here", { defaultValue: `${chestData.price}` })

  ForceOpen(player, editShopUI).then(res => {
    if (!res.canceled) {
      let [type, price] = res.formValues
      type = shopTypes[type]
      if (price == "") return player.sendMessage("§cYou must complete the form!")
      price = Number(price)
      if (!Number.isSafeInteger(price) || price < 1) return player.sendMessage("§cYou must input a valid number in price!")

      chestData.type = type
      chestData.price = price

      ChestShop.editChestShop(chestData.dataId, chestData)
      block.getComponent("minecraft:sign").setText(formatText(chestData.type, chestData.playerName, chestData.itemId, chestData.price, chestData.adminShop))
      block.getComponent("minecraft:sign").setWaxed(true)
      block.getComponent("minecraft:sign").setTextDyeColor()
      player.sendMessage("§aShop created successfully.")
    }
  })
}

world.beforeEvents.playerBreakBlock.subscribe(async (data) => {
  const { block, player } = data
  if (ChestShop.GetShopByChest(block) != undefined) data.cancel = true
  if (ChestShop.GetShopBySign(block) != undefined) {
    data.cancel = true
    await null;
    const chestData = ChestShop.GetShopBySign(block)
    block.getComponent("minecraft:sign").setText(formatText(chestData.type, chestData.playerName, chestData.itemId, chestData.price, chestData.adminShop))
    block.getComponent("minecraft:sign").setWaxed(true)
    block.getComponent("minecraft:sign").setTextDyeColor()
    if (player.name != chestData.playerName && !player.isAdmin()) return

    const chestUI = new ActionFormData()
      .title("Chest Shop")
      .body("Select actions")
      .button("Edit Shop")
      .button("Delete Shop")

    ForceOpen(player, chestUI).then((res) => {
      if (!res.canceled) {
        switch (res.selection) {
          case 0:
            return editShop(player, block, chestData)
          case 1:
            return deleteShop(player, block, chestData)
        }
      }
    })
  }
})

const separateAmount = (amount, maxAmount) => {
  const divide = Math.floor(amount / maxAmount);
  const left = amount % maxAmount;

  const result = new Array(divide).fill(maxAmount);
  if (left !== 0) {
    result.push(left);
  }

  return result;
}

/**
 * @param {mc.Player} player 
 * @param {mc.Block} block 
 * @param {{
 * signLocation: mc.Vector3, 
* chestLocation: mc.Vector3,  
* dimensionId: string, 
* playerName: string, 
* itemId: string, 
* type: string, 
* price: number,
* adminShop: boolean,
* dataId: string
* }} chestData 
 * @returns 
 */
ChestShop.SellingFunction = (player, block, chestData) => {
  if (!Ranks.getChestShopPermission(player, "chestshop.buying") && !player.isAdmin())
    return player.sendMessage("§cYou don't have permission to use this feature.")
  const availableItems = chestData.adminShop ? 999 : calculateItemInChest(block.dimension.getBlock(chestData.chestLocation), chestData.itemId)
  if (availableItems <= 0) return player.sendMessage("§cNo item available in chest.")
  const canGet = availableItems > itemCanGet(player, new mc.ItemStack(chestData.itemId)) ? itemCanGet(player, new mc.ItemStack(chestData.itemId)) : availableItems
  if (canGet <= 0) return player.sendMessage({ translate: "mce.player.inventory.full" })
  const inputAmountForm = new ui.ModalFormData()
    .title(`${Utility.getItemname(new mc.ItemStack(chestData.itemId))} Shop`)
    .label(`You are about to purchase:\nItem ID: ${chestData.itemId}\nPrice: ${Utility.formatMoney(chestData.price)} each`)
    .divider()
    .textField(`Input amount (Max ${canGet}):`, "Input number here", { defaultValue: "1" })

  ForceOpen(player, inputAmountForm).then((res) => {
    if (!res.canceled) {
      let [amount] = res.formValues;
      amount = Number(amount)
      if (Number.isNaN(amount) || amount > canGet || amount < 1) return player.sendMessage("§cInput valid amount!")
      const price = amount * chestData.price

      let confirmBuyForm = new ui.MessageFormData()
        .title({ translate: "mce.ui.purchaseconfirmation.title" })
        .body({ translate: "mce.ui.purchaseconfirmation.description", with: [Utility.getItemname(new mc.ItemStack(chestData.itemId)), Utility.formatMoney(price)] })
        .button2({ translate: "mce.ui.purchaseconfirmation.accept" })
        .button1({ translate: "mce.ui.purchaseconfirmation.cancel" })

      ForceOpen(player, confirmBuyForm).then((res) => {
        if (res.selection === 1) {
          let playerMoney = player.getMoney()
          if (price > playerMoney) return player.sendMessage({ translate: "mce.command.insufficientfunds" })
          const chest = block.dimension.getBlock(chestData.chestLocation)
          const chestContainer = chest.getComponent("inventory").container
          const playerContainer = player.getInvetory()
          let itemsLeft = amount

          if (chestData.adminShop) {
            const itemStack = new mc.ItemStack(chestData.itemId)
            for (const amount of separateAmount(itemsLeft, itemStack.maxAmount)) {
              try {
                itemStack.amount = amount
                playerContainer.addItem(itemStack)
                itemsLeft -= amount
              } catch (e) { }
            }
          } else {
            for (let slot = 0; slot < chestContainer.size; slot++) {
              if (itemsLeft <= 0) break
              const slotData = chestContainer.getSlot(slot)
              if (!slotData.getItem() || slotData.typeId != chestData.itemId) continue
              if (slotData.amount > itemsLeft) {
                const itemClone = slotData.getItem()
                slotData.amount -= itemsLeft
                itemClone.amount = itemsLeft
                playerContainer.addItem(itemClone)
                itemsLeft = 0
              } else {
                playerContainer.addItem(slotData.getItem())
                itemsLeft -= slotData.amount
                slotData.setItem()
              }
            }
          }

          const totalPrice = (amount - itemsLeft) * chestData.price
          player.setMoney(playerMoney - totalPrice)
          if (!chestData.adminShop) Server.Money.setMoney(chestData.playerName, Server.Money.getMoney(chestData.playerName) + totalPrice)
          player.sendMessage({ translate: "mce.command.shop.purchase.successfully", with: [`${amount - itemsLeft}`, Utility.getItemname(new mc.ItemStack(chestData.itemId)), Utility.formatMoney(totalPrice)] })
        }
      })
    }
  })
}

/**
 * @param {mc.Player} player 
 * @param {mc.Block} block 
 * @param {{
 * signLocation: mc.Vector3, 
* chestLocation: mc.Vector3,  
* dimensionId: string, 
* playerName: string, 
* itemId: string, 
* type: string, 
* price: number,
* adminShop: boolean,
* dataId: string
* }} chestData 
 * @returns 
 */
ChestShop.BuyingFunction = (player, block, chestData) => {
  if (!Ranks.getChestShopPermission(player, "chestshop.selling") && !player.isAdmin())
    return player.sendMessage("§cYou don't have permission to use this feature.")
  const selectedSlotIndex = player.selectedSlotIndex
  const itemSlot = player.getInvetory().getSlot(selectedSlotIndex)
  if (itemSlot.hasItem() == false || itemSlot.typeId != chestData.itemId) return player.sendMessage("§cHold a valid item")
  const ownerMoney = Server.Money.getMoney(chestData.playerName)
  const canBuy = chestData.adminShop ? 999 : Math.floor(ownerMoney / chestData.price)
  let canGet = chestData.adminShop ? 999 : itemCanGet(block.dimension.getBlock(chestData.chestLocation), new mc.ItemStack(chestData.itemId))
  if (canBuy < canGet) canGet = canBuy
  if (canGet <= 0) return player.sendMessage({ translate: "mce.chest.inventory.full" })
  const maxAmount = Math.min(itemSlot.maxAmount, canGet > itemSlot.amount ? itemSlot.amount : canGet)

  const inputAmountForm = new ui.ModalFormData()
    .title(`${Utility.getItemname(new mc.ItemStack(chestData.itemId))} Shop`)
    .label(`You are about to sell:\nItem ID: ${chestData.itemId}\nPrice: ${Utility.formatMoney(chestData.price)} each`)
    .divider()
    .textField(`Input amount (Max ${maxAmount}):`, "Input number here", { defaultValue: "1" })

  ForceOpen(player, inputAmountForm).then((res) => {
    if (!res.canceled) {
      let [amount] = res.formValues;
      amount = Number(amount)
      if (Number.isNaN(amount) || amount > maxAmount || amount < 1) return player.sendMessage("§cInput valid amount!")
      const price = amount * chestData.price

      let confirmBuyForm = new ui.MessageFormData()
        .title("Sell Confirmation")
        .body(`Are you sure want to sell x${amount} ${Utility.getItemname(new mc.ItemStack(chestData.itemId))} for §e${Utility.formatMoney(price)}§r?`)
        .button2("Accept")
        .button1("Cancel")

      ForceOpen(player, confirmBuyForm).then((res) => {
        if (res.selection === 1) {
          if (itemSlot.hasItem() == false || itemSlot.typeId != chestData.itemId) return player.sendMessage("§cHold a valid item")
          const playerMoney = player.getMoney()
          const ownerMoney = Server.Money.getMoney(chestData.playerName)
          const chest = block.dimension.getBlock(chestData.chestLocation)
          const chestContainer = chest.getComponent("inventory").container
          const playerContainer = player.getInvetory()
          if (amount >= itemSlot.amount) {
            playerContainer.setItem(selectedSlotIndex)
          } else {
            itemSlot.amount -= amount
          }
          chestContainer.addItem(new mc.ItemStack(chestData.itemId, amount))

          player.setMoney(playerMoney + price)
          if (!chestData.adminShop) Server.Money.setMoney(chestData.playerName, ownerMoney - price)
          player.sendMessage({ translate: "mce.command.sell.successfully", with: [`${amount}`, Utility.getItemname(new mc.ItemStack(chestData.itemId)), Utility.formatMoney(price)] })
        }
      })
    }
  })
}

export default ChestShop