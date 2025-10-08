import Sell from "../../Modules/Data/Sell"
import Utility from "../../Modules/Utility"
import { SellSetting } from "../../Modules/Forms"
import { SellPreset } from "../../Modules/Preset/Sell"
import { ItemStack, ItemTypes } from "@minecraft/server"

const sellsetting = (Server) => {
  Server.Commands.register({
    name: "sellsetting",
    description: "mce.command.sellsetting.description",
    usage: "sellsetting <add/edit/remove>",
    permission: "sellsetting",
    category: "Admin"
  }, async (data, player, args) => {
    switch (args[0]?.toLowerCase()) {
      case "add":
        var selectedItem = player.getInvetory().getItem(player.selectedSlotIndex)
        if (selectedItem == undefined) return player.sendMessage({ translate: "mce.command.sellsetting.holditem" })
        if (Sell.isValid(selectedItem.typeId)) return player.sendMessage({ translate: "mce.command.sellsetting.itemexists" })
        player.sendMessage({ translate: "mce.ui.closechat" })
        var res = await SellSetting.addItem(player)
        if (!res.canceled) {
          let [name, price] = res.formValues
          if (name == "" || price == "") return player.sendMessage({ translate: "mce.command.sellsetting.formincomplete" })
          if (Sell.isValid(selectedItem.typeId)) return player.sendMessage({ translate: "mce.command.sellsetting.itemexists" })
          price = Number(price)
          if (!Number.isInteger(price)) return player.sendMessage({ translate: "mce.command.sellsetting.priceinvalid" })
  
          let itemData = {
            itemid: selectedItem.typeId,
            displayname: name,
            price: price
          }
  
          await Sell.addItem(selectedItem.typeId, itemData)
          return player.sendMessage({ translate: "mce.command.sellsetting.itemadded" })
        }
        break
  
      case "edit":
        var items = await Sell.getItems()
        if (items.length <= 0) return player.sendMessage({ translate: "mce.command.sellsetting.noitems" })
        player.sendMessage({ translate: "mce.ui.closechat" })
        var selectItem = await SellSetting.selectItem(player, items)
        if (selectItem == undefined) return
        if (!Sell.isValid(selectItem.id)) return player.sendMessage(({ translate: "mce.command.sellsetting.itemnotfound" }))
        var itemData = Sell.getData(selectItem.id)
        var res = await SellSetting.editItem(player, itemData)
        if (!res.canceled) {
          if (!Sell.isValid(selectItem.id)) return player.sendMessage(({ translate: "mce.command.sellsetting.itemnotfound" }))
          let [name, price] = res.formValues
          if (name == "") name = itemData.displayname
          if (price == "") name = itemData.price
          price = Number(price)
          if (!Number.isInteger(price)) return player.sendMessage({ translate: "mce.command.sellsetting.priceinvalid" })
  
          itemData["displayname"] = name
          itemData["price"] = price
  
          await Sell.editItem(selectItem.id, itemData)
          return player.sendMessage({ translate: "mce.command.sellsetting.itemedited" })
        }
        break
  
      case "remove":
        var items = await Sell.getItems()
        if (items.length <= 0) return player.sendMessage({ translate: "mce.command.sellsetting.noitems" })
        player.sendMessage({ translate: "mce.ui.closechat" })
        var selectItem = await SellSetting.selectItem(player, items)
        if (selectItem == undefined) return
        if (!Sell.isValid(selectItem.id)) return player.sendMessage(({ translate: "mce.command.sellsetting.itemnotfound" }))
  
        await Sell.removeItem(selectItem.id)
        return player.sendMessage({ translate: "mce.command.sellsetting.itemremoved" })
        break
  
      case "preset":
        player.sendMessage({ translate: "mce.command.sellsetting.preset.starting" })
        try {
          for (const itemData of SellPreset) {
            try {
              if (ItemTypes.get(itemData.item) == undefined) continue
              let item = itemData.item
              let itemStack = new ItemStack(item)
              let displayname = itemData.displayname ?? Utility.getItemname(itemStack)
              let price = itemData.price
  
              await Sell.addItem(item, {
                itemid: item,
                displayname: displayname,
                price: price
              })
            } catch (err) { player.sendMessage({ translate: "mce.command.sellsetting.preset.erroraddingitem", with: [itemData.item, err] }) }
            await Server.sleep(20)
          }
          player.sendMessage({ translate: "mce.command.sellsetting.successfulpreset" })
        } catch (err) {
          return player.sendMessage(`§c[Error] ${err} | ${err.stack}`)
        }
        break
      default:
        return player.sendMessage({ translate: "mce.command.sellsetting.inputoperation", with: [Server.getPrefix()] })
    }
  })
}

export default sellsetting