import Sell from "../../Modules/Data/Sell"
import Utility from "../../Modules/Utility"
import { ForceOpen } from "../../Modules/Forms"
import { ItemStack, Player } from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import ChestFormData from "../../Modules/ChestForms"

/**
 * 
 * @param {import("../../main").default} Server 
 */
const sell = (Server) => {
  Server.Commands.register({
    name: "sell",
    description: "mce.command.sell.description",
    usage: "sell <hand/all?>",
    category: "Money"
  }, async (data, player, args) => {
    let items = await Sell.getItems()
    if (items.length <= 0) return player.sendMessage({ translate: "mce.command.sell.noitems" })
    switch (args[0]?.toLowerCase()) {
      case "hand":
        var selectedSlot = player.selectedSlotIndex
        var selectedItem = player.getInvetory().getItem(selectedSlot)
        if (selectedItem == undefined) return player.sendMessage({ translate: "mce.command.sell.holditem" })
        var itemData = items.find(i => i.itemid == selectedItem.typeId)
        if (itemData == undefined) return player.sendMessage({ translate: "mce.command.sell.item.nosellable" })
        var sold = selectedItem.amount
        if ((player.getMoney() + (itemData.price * sold)) >= Server.Money.getMaxMoney()) return player.sendMessage("§cYour money is going to max!")
        player.getInvetory().setItem(selectedSlot)

        var price = itemData.price * sold
        await player.setMoney(player.getMoney() + price)
        player.sendMessage({ translate: "mce.command.sell.successfully", with: [`${sold}`, itemData.displayname, Utility.formatMoney(price)] })
        break

      case "all":
        const confirmUI = new ui.MessageFormData()
          .title("§c§lSELL ALL CONFIRMATION")
          .body(`Are you sure want to sell all your items?`)
          .button2("§a§lYES")
          .button1("§c§lNO")

        player.sendMessage({ translate: "mce.ui.closechat" })
        ForceOpen(player, confirmUI).then(res => {
          if (!res.canceled) {
            if (res.selection === 1) {
              var inventory = player.getInvetory()
              var sold = 0
              var getMoney = 0
              var maxMoney = false
              for (let i = 0; i < inventory.size; i++) {
                if ((player.getMoney() + getMoney) >= Server.Money.getMaxMoney()) { maxMoney = true; break }
                let item = inventory.getItem(i)
                if (item == undefined) continue
                let itemData = items.find(i => i.itemid == item.typeId)
                if (itemData == undefined) continue
                var amount = item.amount
                inventory.setItem(i)
                sold += amount
                getMoney += amount * itemData.price
              }

              if (sold <= 0 && maxMoney) return player.sendMessage("§cYour money is going to max!")
              if (sold <= 0) return player.sendMessage({ translate: "mce.command.sellall.noitems" })
              player.setMoney(player.getMoney() + getMoney)
              return player.sendMessage({ translate: "mce.command.sellall.successfully", with: [`${sold}`, Utility.formatMoney(getMoney)] })
            } else {
              return player.sendMessage("§cCanceled.")
            }
          }
        })
        break

      default:
        player.sendMessage({ translate: "mce.ui.closechat" })
        return SellForm.selectItem(player, items)
    }
  })

  const SellForm = {}
  /**
   * 
   * @param {Player} player 
   * @param {string} itemId 
   */
  const findItem = (player, itemId) => {
    const inventory = player.getComponent("minecraft:inventory").container
    for (let slot = 0; slot < inventory.size; slot++) {
      if (inventory.getItem(slot)?.typeId == itemId) return true
    }

    return false
  }

  /**
 * Select Item Form
 * @param {Player} player 
 * @param {Sell.StructureDatas[]} items 
 * @returns {Sell.StructureDatas}
 */
  SellForm.selectItem = async (player, items, page = 1, search = true) => {
    items.sort((a, b) => Utility.compareString(a.displayname, b.displayname))
    const onlyShowOwnedItems = player.getDynamicProperty("Sell_onlyShowOwnedItems") ?? false
    if (onlyShowOwnedItems) items = items.filter(({ itemid }) => findItem(player, itemid))

    const pages = Math.ceil(items.length / 45)
    let selectItemForm = new ChestFormData("shop")
      .title(`§l§eItem Sell`)

    selectItemForm.pattern([5, 0], [
      'sg<gxg>go'
    ], {
      "s": search ? { data: { itemName: `§7Search Items`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:spyglass' } : null,
      "x": { data: { itemName: `§cClose`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: 'minecraft:barrier' },
      ">": { data: { itemName: '§aNext Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/right_arrow' },
      "<": { data: { itemName: '§aPrevious Page', itemDesc: ["", `§8Pages: ${page} / ${pages}`], enchanted: false, stackAmount: 1 }, iconPath: 'textures/icons/left_arrow' },
      "o": { data: { itemName: `§eShow only owned items: ${onlyShowOwnedItems ? "§aOn" : "§cOff"}`, itemDesc: [], enchanted: false, stackAmount: 1 }, iconPath: `textures/items/${onlyShowOwnedItems ? "ender_eye" : "ender_pearl"}` }
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
        if (page > 1) return SellForm.selectItem(player, items, page - 1)
      } else if (res.selection == 51) {
        if (page < pages) return SellForm.selectItem(player, items, page + 1)
      } else if (res.selection == 53) {
        player.setDynamicProperty("Sell_onlyShowOwnedItems", !onlyShowOwnedItems)
        if (onlyShowOwnedItems == true) items = Sell.getItems()
        SellForm.selectItem(player, items, page)
      } else {
        let selectItem = pagedItems[res.selection]
        
        let itemAmount = player.getItemAmount(selectItem.itemid)
        if (itemAmount <= 0) return player.sendMessage({ translate: "mce.command.sell.insufficientitems" })
        var amount = await SellForm.inputAmount(player, selectItem, itemAmount)
        if ((player.getMoney() + (selectItem.price * amount)) >= Server.Money.getMaxMoney()) return player.sendMessage("§cYour money is going to max!")
        if (!amount) return
        var inventory = player.getInvetory()

        var sold = 0
        for (let slot = 0; slot < inventory.size; slot++) {
          if (!inventory.getItem(slot) || inventory.getItem(slot).typeId != selectItem.itemid) continue;
          if (sold >= amount) break;
          var itemSelected = inventory.getItem(slot)
          for (let i = itemSelected.amount - 1; i >= 0; i--) {
            if (sold >= amount) break;
            if (i <= 0) {
              inventory.setItem(slot)
            } else {
              itemSelected.amount = i
              inventory.setItem(slot, itemSelected)
            }
            sold = sold + 1
          }
        }

        var price = selectItem.price * sold
        await player.setMoney(player.getMoney() + price)
        player.sendMessage({ translate: "mce.command.sell.successfully", with: [`${sold}`, selectItem.displayname, Utility.formatMoney(price)] })
      }
      // return SellForm.selectItem(player, items, page)
    }
    return undefined
  }

  /**
     * Search Item Sell Form
     * @param {Player} player 
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
   * @param {Player} player 
   * @param {Sell.StructureDatas} item 
   * @param {number} amount 
   */
  SellForm.inputAmount = async (player, item, amount) => {
    let inputAmountForm = new ui.ModalFormData()
      .title(`${item.displayname} Sell`)
      .slider(`§eItem Name: §r${item.displayname}
§ePrice: §r${Utility.formatMoney(item.price)}
§eYou have: §r${amount} item(s)

Input Amount`, 1, amount, {valueStep: 1})

    let res = await ForceOpen(player, inputAmountForm)
    if (!res.canceled) {
      let [amount] = res.formValues
      return amount
    }
    return undefined
  }
}

export default sell