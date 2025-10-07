import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import ChestFormData from "./ChestForms";
import Sell from "./Data/Sell";
import Shop, { StructureItem } from "./Data/Shop";
import Utility from "./Utility";

/**
 * 
 * @param {mc.Player} player 
 * @param {ui.ActionFormData | ui.MessageFormData | ui.ModalFormData} form 
 * @returns {Promise<ui.ActionFormResponse | ui.MessageFormResponse | ui.ModalFormResponse>}
 */
const ForceOpen = async (player, form, timeout = 1200) => {
  let startTick = mc.system.currentTick
  while ((mc.system.currentTick - startTick) < timeout) {
    const response = await form.show(player)
    if (response.cancelationReason !== "UserBusy")
      return response
  }
  return undefined
}

// -- [TPA FORM] -- \\
const TPA = {}

/**
 * TPA Request Form
 * @param {mc.Player} player 
 * @param {mc.Player} targetPlayer 
 * @returns {ui.MessageFormResponse}
 */
TPA.TPARequestForm = async (player, targetPlayer) => {
  const tpaForm = new ui.MessageFormData()
    .title("TPA Request")
    .body(`${player.name} has requested to teleport to you.`)
    .button2("§l§aACCEPT")
    .button1("§l§cDECLINE")

  return await ForceOpen(targetPlayer, tpaForm, Infinity)
}

/**
 * TPA Request Form
 * @param {mc.Player} player 
 * @param {mc.Player} targetPlayer 
 * @returns {ui.MessageFormResponse}
 */
TPA.TPAHereRequestForm = async (player, targetPlayer) => {
  const tpaForm = new ui.MessageFormData()
    .title("TPAHERE Request")
    .body(`${player.name} has requested you teleport to them.`)
    .button2("§l§aACCEPT")
    .button1("§l§cDECLINE")

  return await ForceOpen(targetPlayer, tpaForm, Infinity)
}

// -- [SHOP SETTING] -- \\
const ShopSetting = {}
const SortType = {
  1: ["name", "Item Name"],
  2: ["price", "Price"]
}

/**
 * Select Group Form
 * @param {mc.Player} player 
 * @param {string[]} groups 
 * @returns 
 */
ShopSetting.selectGroup = async (player, groups) => {
  const selectGroupForm = new ChestFormData()
    .title("Select Groups")

  let slot = {}
  Object.entries(groups).forEach(([groupName, group]) => {
    let itemLength = Shop.getAmountByData({ category: group.displayname })
    selectGroupForm.button(group.index, group.displayname + `§r (§e${itemLength}§r)`, [], group.icon, 1, group.enchantedIcon ?? false)

    slot[group.index] = groupName
  })

  let res = await ForceOpen(player, selectGroupForm)
  if (!res) return undefined
  if (!res.canceled) {
    let group = slot[res.selection]
    return group
  }

  return undefined
}

/**
 * Select Group Form
 * @param {mc.Player} player 
 * @returns {number}
 */
ShopSetting.selectEditGroupType = async (player) => {
  const selectEditGroupTypeForm = new ui.ActionFormData()
    .title("Select Edit Group Type")
    .body("Select an edit type")
    .button("Basic Edit")
    .button("Icon Position Edit")

  let res = await ForceOpen(player, selectEditGroupTypeForm)
  if (!res.canceled) {
    return res.selection
  }
}

/**
 * Select Group Form
 * @param {mc.Player} player 
 * @returns {number}
 */
ShopSetting.selectGroupSlot = async (player) => {
  const groups = Shop.getGroups()
  const slotIndex = Array.from({ length: Shop.maxGroup }, (_, i) => i)
  const availableSlotIndex = Shop.getEmptyIndex()
  const usedSlotIndex = slotIndex.filter((v) => availableSlotIndex.indexOf(v) < 0)

  const selectGroupSlotForm = new ChestFormData()
    .title("Select Group Slot")

  availableSlotIndex.forEach((slot) => {
    selectGroupSlotForm.button(slot, "§aAvailable Slot", ["", `Slot: ${slot}`, "Click to select"], "textures/blocks/glass_green")
  })

  usedSlotIndex.forEach((slot) => {
    selectGroupSlotForm.button(slot, "§cUnavailable Slot", ["", `Slot: ${slot}`, "Unable to select"], "textures/blocks/glass_red")
  })

  return await ForceOpen(player, selectGroupSlotForm)
}

/**
 * Add Group Form
 * @param {mc.Player} player 
 * @return {ui.ModalFormResponse}
 */
ShopSetting.addGroup = async (player) => {
  const addGroupForm = new ui.ModalFormData()
    .title("Add Group to Shop")
    .textField("Group Name :", "Example: Blocks")
    .textField("Group Icon :", "minecraft:apple or\ntextures/items/apple")
    .toggle("Turn on Enchanted Icon", { defaultValue: false })

  return await ForceOpen(player, addGroupForm)
}

/**
 * Add Group Form
 * @param {mc.Player} player 
 * @return {ui.ModalFormResponse}
 */
ShopSetting.editGroup = async (player, data) => {
  const editGroupForm = new ui.ModalFormData()
    .title("Edit Group")
    .textField("Group Icon :", "minecraft:apple or\ntextures/items/apple", { defaultValue: data.icon })
    .toggle("Turn on Enchanted Icon", { defaultValue: data.enchantedIcon })

  return await ForceOpen(player, editGroupForm)
}

/**
 * Select Item Form
 * @param {mc.Player} player 
 * @param {StructureItem[]} items 
 * @param {number} page
 * @returns {StructureItem}
 */
ShopSetting.selectItem = async (player, items, page = 1, sort = 1) => {
  items = items.sort((a, b) =>
    SortType[sort][0] == "name" ?
      Utility.compareString(a.data.displayname, b.data.displayname) :
      a.data[SortType[sort][0]] - b.data[SortType[sort][0]])
  const nextSort = sort == Object.keys(SortType).length ? 1 : sort + 1
  const pages = Math.ceil(items.length / 45)
  const selectItemForm = new ChestFormData("shop")
    .title("Select Items")

  selectItemForm.pattern([5, 0], [
    'gg<gxg>gg'
  ], {
    "x": { data: { itemName: `§eSorted by: §c${SortType[sort][1]}`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:mojang_banner_pattern' },
    ">": { data: { itemName: '§aNext Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/right_arrow' },
    "<": { data: { itemName: '§aPrevious Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/left_arrow' },
  })

  let startIndex = (page - 1) * 45
  let endIndex = startIndex + 45
  let pagedItems = items.slice(startIndex, endIndex)
  for (let i = 0; i < 45; i++) {
    if (!pagedItems[i]) continue;
    let item = pagedItems[i].item
    let itemData = pagedItems[i].data
    let itemDesc = []
    let enchantments = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? []
    let enchantedItem = false
    if (enchantments.length > 0) {
      enchantedItem = true
      enchantments.forEach(e => itemDesc.push(Utility.enchantToText(e)))
    }
    itemDesc.push("")
    itemDesc.push(`§7Price: §e${Utility.formatMoney(itemData.price)}`)
    selectItemForm.button(i, itemData.displayname, itemDesc, itemData.icon, 1, enchantedItem)
  }

  let res = await ForceOpen(player, selectItemForm)
  if (!res.canceled) {
    if (res.selection == 47) {
      if (page > 1) return await ShopSetting.selectItem(player, items, page - 1, sort)
    } else if (res.selection == 49) {
      return await ShopSetting.selectItem(player, items, page, nextSort)
    } else if (res.selection == 51) {
      if (page < pages) return await ShopSetting.selectItem(player, items, page + 1, sort)
    } else {
      return pagedItems[res.selection]
    }
    return await ShopSetting.selectItem(player, items, page)
  }
}

/**
 * Add Item Form
 * @param {mc.Player} player 
 * @param {mc.ItemStack} item
 * @returns {ui.ModalFormResponse}
 */
ShopSetting.addItem = async (player, item) => {
  const addItemForm = new ui.ModalFormData()
    .title("Add Item to Shop")
    .textField("Item Price (Required):", "Example : 1000")
    .textField("Item Display Name (Optional):", "Example : Raw Iron")
    .textField("Item Icon (Optional):", "minecraft:apple or\ntextures/items/apple")
    .slider("Item Amount", 1, item.maxAmount, { valueStep: 1, tooltip: "The amount of items that player will get when they buy the item" })
  // .toggle("One Time Purchase", false)

  return await ForceOpen(player, addItemForm)
}

/**
 * Edit Item Form
 * @param {mc.Player} player 
 * @param {StructureItem} item 
 * @returns {ui.ModalFormResponse}
 */
ShopSetting.editItem = async (player, item) => {
  let data = item.data
  const editItemForm = new ui.ModalFormData()
    .title("Edit Item from Shop")
    .textField("Item Price:", "Example : 1000", { defaultValue: `${data.price}` })
    .textField("Item Display Name:", "Example : Raw Iron", { defaultValue: data.displayname })
    .textField("Item Icon:", "minecraft:apple or\ntextures/items/apple", { defaultValue: data.icon })
    .slider("Item Amount", 1, item.itemDB.item.maxAmount, { defaultValue: data.amount, valueStep: 1, tooltip: "The amount of items that player will get when they buy the item" })
  // .toggle("One Time Purchase", data.oneTimePurchase)

  return await ForceOpen(player, editItemForm)
}

// -- [SHOP] -- \\
const ShopForm = {}

/**
 * Select Group Shop Form
 * @param {mc.Player} player 
 * @param {string[]} groups 
 * @param {StructureItem[]} items
 * @returns {string}
 */
ShopForm.selectGroup = async (player, groups, items) => {
  const removeGroupForm = new ChestFormData()
    .title("SHOP")

  let slot = 0
  Object.values(groups).forEach(group => {
    let itemLength = items.filter(item => item.data.category == group.displayname).length
    removeGroupForm.button(slot, group.displayname + `§r (§e${itemLength}§r)`, [], group.icon, 1, group.enchantedIcon ?? false)
    slot += 1
  })

  let res = await ForceOpen(player, removeGroupForm)
  if (!res) return undefined
  if (!res.canceled) {
    let group = Object.keys(groups)[res.selection]
    return group
  }

  return undefined
}

/**
 * Search Item Shop Form
 * @param {mc.Player} player 
 * @param {StructureItem[]} items 
 */
ShopForm.searchItems = (player, items) => {
  console.log(items.map(i => i.data.displayname).join(" "))
  const searchItemsUI = new ui.ModalFormData()
    .title("Search items")
    .textField("Input item name:", "Input here")

  ForceOpen(player, searchItemsUI).then(res => {
    if (!res.canceled) {
      const [search] = res.formValues
      items = items.filter(i => i.data.displayname.toLowerCase().includes(search.toLowerCase()))

      return ShopForm.selectItem(player, items, 1, 1, false)
    }
  })
}

/**
 * Select Item Shop Form
 * @param {mc.Player} player 
 * @param {StructureItem[]} items 
 * @param {number} page
 * @returns {StructureItem}
 */
ShopForm.selectItem = async (player, items, page = 1, sort = 1, search = true) => {
  if (items.length == 0) return player.sendMessage("§cNo items found.")
  items = items.sort((a, b) =>
    SortType[sort][0] == "name" ?
      Utility.compareString(a.data.displayname, b.data.displayname) :
      a.data[SortType[sort][0]] - b.data[SortType[sort][0]])
  const nextSort = sort == Object.keys(SortType).length ? 1 : sort + 1
  let groupName = items[0].data.category
  const pages = Math.ceil(items.length / 45)
  const selectItemForm = new ChestFormData("shop")
    .title(`${groupName} Shop`)

  selectItemForm.pattern([5, 0], [
    'sg<gxg>gg'
  ], {
    "s": search ? { data: { itemName: `§7Search Items`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:spyglass' } : null,
    "x": { data: { itemName: `§eSorted by: §c${SortType[sort][1]}`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:mojang_banner_pattern' },
    ">": { data: { itemName: '§aNext Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/right_arrow' },
    "<": { data: { itemName: '§aPrevious Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/left_arrow' },
  })

  let startIndex = (page - 1) * 45
  let endIndex = startIndex + 45
  let pagedItems = items.slice(startIndex, endIndex)
  for (let i = 0; i < 45; i++) {
    if (!pagedItems[i]) continue;
    let item = pagedItems[i].item
    let itemData = pagedItems[i].data
    let itemDesc = []
    let enchantments = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? []
    let enchantedItem = false
    if (enchantments.length > 0) {
      enchantedItem = true
      enchantments.forEach(e => itemDesc.push(Utility.enchantToText(e)))
    }
    itemDesc.push("")
    itemDesc.push(`§aClick to buy §r(§e${Utility.formatMoney(itemData.price)}§r)`)
    selectItemForm.button(i, itemData.displayname, itemDesc, itemData.icon, 1, enchantedItem)
  }

  let res = await ForceOpen(player, selectItemForm)
  if (!res.canceled) {
    if (res.selection == 45 && search) {
      return ShopForm.searchItems(player, items)
    } else if (res.selection == 47) {
      if (page > 1) return await ShopForm.selectItem(player, items, page - 1, sort)
    } else if (res.selection == 49) {
      return await ShopForm.selectItem(player, items, page, nextSort)
    } else if (res.selection == 51) {
      if (page < pages) return await ShopForm.selectItem(player, items, page + 1, sort)
    } else {
      return pagedItems[res.selection]
    }
    return await ShopForm.selectItem(player, items, page)
  }
}

/**
 * Input Amount Shop Form
 * @param {mc.Player} player 
 * @param {StructureItem} item
 * @returns {number} 
 */
ShopForm.inputAmount = async (player, item) => {
  const inputAmountForm = new ui.ModalFormData()
    .title(`${item.data.displayname} Shop`)
    .slider("Amount", 1, item.item.maxAmount, { valueStep: 1 })
  let res = await ForceOpen(player, inputAmountForm)
  if (!res.canceled) {
    let [amount] = res.formValues;
    return amount
  }
  return undefined
}

/**
 * Confirm Purchase Shop Form
 * @param {mc.Player} player 
 * @param {StructureItem} item 
 * @param {number} price 
 * @returns {boolean}
 */
ShopForm.confirmBuy = async (player, item, price) => {
  let confirmBuyForm = new ui.MessageFormData()
    .title({ translate: "mce.ui.purchaseconfirmation.title" })
    .body({ translate: "mce.ui.purchaseconfirmation.description", with: [item.data.displayname, Utility.formatMoney(price)] })
    .button2({ translate: "mce.ui.purchaseconfirmation.accept" })
    .button1({ translate: "mce.ui.purchaseconfirmation.cancel" })

  let res = await ForceOpen(player, confirmBuyForm)
  if (!res.canceled) {
    if (res.selection === 1) {
      return true
    } else {
      return false
    }
  }

  return false
}

// -- [SELL SETTING] -- \\
const SellSetting = {}

/**
 * Select Item Form
 * @param {mc.Player} player 
 * @param {Sell.StructureDatas[]} items 
 * @returns {string | undefined}
 */
SellSetting.selectItem = async (player, items, page = 1) => {
  items.sort((a, b) => Utility.compareString(a.displayname, b.displayname))
  const pages = Math.ceil(items.length / 45)
  let selectItemForm = new ChestFormData("shop")
    .title(`§l§eItem Sell`)

  selectItemForm.pattern([5, 0], [
    'gg<gxg>gg'
  ], {
    "x": { data: { itemName: `§cClose`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:barrier' },
    ">": { data: { itemName: '§aNext Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/right_arrow' },
    "<": { data: { itemName: '§aPrevious Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/left_arrow' },
  })

  let startIndex = (page - 1) * 45
  let endIndex = startIndex + 45
  let pagedItems = items.slice(startIndex, endIndex)
  for (let i = 0; i < 45; i++) {
    if (!pagedItems[i]) continue;
    let item = pagedItems[i]
    let itemDesc = []
    itemDesc.push("")
    itemDesc.push(`§aClick to buy §r(§e${Utility.formatMoney(item.price)}§r)`)
    selectItemForm.button(i, item.displayname, itemDesc, item.itemid)
  }

  let res = await ForceOpen(player, selectItemForm)
  if (!res.canceled) {
    if (res.selection == 47) {
      if (page > 1) return await SellSetting.selectItem(player, items, page - 1)
    } else if (res.selection == 51) {
      if (page < pages) return await SellSetting.selectItem(player, items, page + 1)
    } else {
      return pagedItems[res.selection]
    }
    return await SellSetting.selectItem(player, items, page)
  }
  return undefined
}

/**
 * Add Item Form
 * @param {mc.Player} player 
 * @returns {ui.ModalFormResponse}
 */
SellSetting.addItem = async (player) => {
  let addItemForm = new ui.ModalFormData()
    .title("Adding Item to Sell")
    .textField("Item Display Name :", "Example : Raw Iron")
    .textField("Item Price :", "Example : 1000")

  return await ForceOpen(player, addItemForm)
}

/**
 * Add Item Form
 * @param {mc.Player} player 
 * @param {Sell.StructureData} data
 * @returns {ui.ModalFormResponse}
 */
SellSetting.editItem = async (player, data) => {
  let addItemForm = new ui.ModalFormData()
    .title("Adding Item to Sell")
    .textField("Item Display Name :", "Example : Raw Iron", { defaultValue: data.displayname })
    .textField("Item Price :", "Example : 1000", { defaultValue: `${data.price}` })

  return await ForceOpen(player, addItemForm)
}

// -- [RESET DATA] -- \\
const ResetData = {}

/**
 * Select Data Form
 * @param {mc.Player} player 
 * @param {string[]} datalist 
 */
ResetData.selectData = async (player, datalist) => {
  const selectDataForm = new ui.ModalFormData()
    .title("§c§lRESET DATA")
    .dropdown("Choose data that you want to reset :", datalist)

  let res = await ForceOpen(player, selectDataForm)
  if (!res.canceled) {
    let [selected] = res.formValues
    return datalist[selected]
  }

  return undefined
}

/**
 * Confirm Reset Form
 * @param {mc.Player} player 
 * @param {string} dataname 
 * @returns {boolean}
 */
ResetData.confirmReset = async (player, dataname) => {
  const resetUI = new ui.MessageFormData()
    .title("§c§lRESET DATA")
    .body(`Are you sure want to reset §e${dataname}§r? You can't undo this.`)
    .button2("§c§lYES")
    .button1("§a§lNO")

  let res = await ForceOpen(player, resetUI)
  if (!res.canceled) {
    if (res.selection === 1) {
      return true
    } else {
      return false
    }
  }

  return false
}

// -- [SELL] -- \\
const SellForm = {}

/**
 * Select Item Form
 * @param {mc.Player} player 
 * @param {Sell.StructureDatas[]} items 
 * @returns {Sell.StructureDatas}
 */
SellForm.selectItem = async (player, items, page = 1, search = true) => {
  items.sort((a, b) => Utility.compareString(a.displayname, b.displayname))
  const pages = Math.ceil(items.length / 45)
  let selectItemForm = new ChestFormData("shop")
    .title(`§l§eItem Sell`)

  selectItemForm.pattern([5, 0], [
    'sg<gxg>gg'
  ], {
    "s": search ? { data: { itemName: `§7Search Items`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:spyglass' } : null,
    "x": { data: { itemName: `§cClose`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:barrier' },
    ">": { data: { itemName: '§aNext Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/right_arrow' },
    "<": { data: { itemName: '§aPrevious Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/left_arrow' },
  })

  let startIndex = (page - 1) * 45
  let endIndex = startIndex + 45
  let pagedItems = items.slice(startIndex, endIndex)
  for (let i = 0; i < 45; i++) {
    if (!pagedItems[i]) continue;
    let item = pagedItems[i]
    let itemDesc = []
    itemDesc.push("")
    itemDesc.push(`§aClick to buy §r(§e${Utility.formatMoney(item.price)}§r)`)
    selectItemForm.button(i, item.displayname, itemDesc, item.itemid)
  }

  let res = await ForceOpen(player, selectItemForm)
  if (!res.canceled) {
    if (res.selection == 45) {
      if (search) return SellForm.searchItems(player, items)
    } else if (res.selection == 47) {
      if (page > 1) return await SellForm.selectItem(player, items, page - 1)
    } else if (res.selection == 51) {
      if (page < pages) return await SellForm.selectItem(player, items, page + 1)
    } else {
      return pagedItems[res.selection]
    }
    return await SellForm.selectItem(player, items, page)
  }
  return undefined
}

/**
   * Search Item Sell Form
   * @param {mc.Player} player 
   * @param {Sell.StructureDatas[][]} items 
   */
SellForm.searchItems = (player, items) => {
  const searchItemsUI = new ui.ModalFormData()
    .title("Search items")
    .textField("Input item name:", "Input here")

  ForceOpen(player, searchItemsUI).then(res => {
    if (!res.canceled) {
      const [search] = res.formValues
      items = items.filter(i => i.displayname.toLowerCase().includes(search.toLowerCase()))

      return SellForm.selectItem(player, items, 1, false)
    }
  })
}

/**
 * Input Amount Form
 * @param {mc.Player} player 
 * @param {Sell.StructureDatas} item 
 * @param {number} amount 
 */
SellForm.inputAmount = async (player, item, amount) => {
  let inputAmountForm = new ui.ModalFormData()
    .title(`${item.displayname} Sell`)
    .slider(`§eItem Name: §r${item.displayname}
§ePrice: §r${Utility.formatMoney(item.price)}
§eYou have: §r${amount} item(s)

Input Amount`, 1, amount, { valueStep: 1 })

  let res = await ForceOpen(player, inputAmountForm)
  if (!res.canceled) {
    let [amount] = res.formValues
    return amount
  }
  return undefined
}

export { ForceOpen, TPA, ShopSetting, SellSetting, ResetData }