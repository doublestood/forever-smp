import Shop from "../../Modules/Data/Shop"
import Utility from "../../Modules/Utility"
import { ShopSetting } from "../../Modules/Forms"
import Config from "../../Configuration"
import { ShopPreset } from "../../Modules/Preset/Shop"
import { EnchantmentType, ItemStack, ItemTypes } from "@minecraft/server"

const shopsetting = (Server) => {
  let isMakingPreset = false
  Server.Commands.register({
    name: "shopsetting",
    description: "mce.command.shopsetting.description",
    usage: "shopsetting <item/group> <add/edit/remove>",
    permission: "shopsetting",
    category: "Admin"
  }, async (data, player, args) => {
    switch (args[0]?.toLowerCase()) {
      case "group":
        switch (args[1]?.toLowerCase()) {
          case "add":
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length >= Shop.maxGroup) return player.sendMessage({ translate: "mce.command.shopsetting.groupmaxed" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var res = await ShopSetting.addGroup(player, groups)
            if (!res.canceled) {
              var [name, icon, enchantedIcon] = res.formValues
              if (name == "" || icon == "") return player.sendMessage({ translate: "mce.command.shopsetting.formincomplete" })
              if (await Shop.hasGroup(name)) return player.sendMessage({ translate: "mce.command.shopsetting.groupexists" })

              Shop.addGroup(name, {
                displayname: name,
                icon: icon,
                enchantedIcon: enchantedIcon
              })
              return player.sendMessage({ translate: "mce.command.shopsetting.groupadded", with: [name] })
            }
            break

          case "remove":
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.nogroups" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var group = await ShopSetting.selectGroup(player, groups)
            if (!group) return
            if (!(await Shop.hasGroup(group))) return player.sendMessage({ translate: "mce.command.shopsetting.groupnotfound" })

            await Shop.removeGroup(group)
            Shop.forEach(async (itemData) => {
              if (itemData.data.category == group) await Shop.removeItem(itemData)
            })
            return player.sendMessage({ translate: "mce.command.shopsetting.groupremoved", with: [group] })

          case "edit":
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.nogroups" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var groupName = await ShopSetting.selectGroup(player, groups)
            if (!groupName) return
            group = Shop.getGroups()[groupName]
            if (!group) return player.sendMessage({ translate: "mce.command.shopsetting.groupnotfound" })
            var editType = await ShopSetting.selectEditGroupType(player)
            if (editType == 0) {
              var res = await ShopSetting.editGroup(player, group)
              if (!res.canceled) {
                var [icon, enchantedIcon] = res.formValues
                if (icon == "") return player.sendMessage({ translate: "mce.command.shopsetting.formincomplete" })

                group.displayname = groupName
                group.icon = icon
                group.enchantedIcon = enchantedIcon
                Shop.setGroup(groupName, group)

                return player.sendMessage({ translate: "mce.command.shopsetting.groupedited", with: [groupName] })
              }
            } else if (editType == 1) {
              var res = await ShopSetting.selectGroupSlot(player)
              if (!res.canceled) {
                const slot = res.selection
                if (Shop.getEmptyIndex().includes(slot)) {
                  group.index = slot
                  Shop.setGroup(groupName, group)

                  return player.sendMessage({ translate: "mce.command.shopsetting.groupedited", with: [groupName] })
                } else {
                  return player.sendMessage("§cSlot is unavailable.")
                }
              }
            }
            break

          default:
            return player.sendMessage({ translate: "mce.command.shopsetting.group.inputoperation" })
        }
        break

      case "item":
        switch (args[1]?.toLowerCase()) {

          case "add":
            var selectedItem = player.getInvetory().getItem(player.selectedSlotIndex)
            if (selectedItem == undefined) return player.sendMessage({ translate: "mce.command.shopsetting.holditem" })
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.creategroupfirst" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var group = await ShopSetting.selectGroup(player, groups)
            if (!group) return
            var res = await ShopSetting.addItem(player, selectedItem)
            if (!res.canceled) {
              var [price, name, icon, amount, oneTimePurchase] = res.formValues
              if (price == "") return player.sendMessage({ translate: "mce.command.shopsetting.formincomplete" })
              price = Number(price)
              if (!Number.isSafeInteger(price) || price < 0) return player.sendMessage({ translate: "mce.command.shopsetting.priceinvalid" })
              // if (price <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.pricelessthanone" })
              if (name == "") name = Utility.getItemname(selectedItem)
              if (icon == "") icon = selectedItem.typeId

              try {
                // for (let i = 0; i < 96; i++) {
                Shop.addItem(selectedItem, {
                  displayname: name,
                  price: price,
                  icon: icon,
                  amount: amount,
                  category: group,
                  // oneTimePurchase: oneTimePurchase
                })
                // }

                return player.sendMessage({ translate: "mce.command.shopsetting.itemadded" })
              } catch (err) {
                player.sendMessage({ translate: "mce.command.shopsetting.erroraddingitem" })
                if (err.message) player.sendMessage(err.message)
              }
            }
            break

          case "edit":
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.creategroupfirst" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var group = await ShopSetting.selectGroup(player, groups)
            if (!group) return
            var items = await Shop.getItems()
            items = items.filter(i => i.data.category == group)
            var selectedItem = await ShopSetting.selectItem(player, items)
            if (selectedItem == undefined) return;
            var res = await ShopSetting.editItem(player, selectedItem)
            if (!res.canceled) {
              if (!(await Shop.isValid(selectedItem))) return player.sendMessage({ translate: "mce.command.shopsetting.itemnotfound" })
              var [price, name, icon, amount, oneTimePurchase] = res.formValues
              if (name == "") name = selectedItem.data.displayname
              if (price == "") price = selectedItem.data.price
              if (icon == "") icon = selectedItem.data.icon
              price = Number(price)
              if (!Number.isSafeInteger(price) || price < 0) return player.sendMessage({ translate: "mce.command.shopsetting.priceinvalid" })

              await Shop.editItem(selectedItem, {
                displayname: name,
                price: price,
                icon: icon,
                amount: amount,
                category: selectedItem.data.category,
                // oneTimePurchase: oneTimePurchase
              })

              return player.sendMessage({ translate: "mce.command.shopsetting.itemedited" })
            }
            break

          case "remove":
            var groups = await Shop.getGroups()
            if (Object.keys(groups).length <= 0) return player.sendMessage({ translate: "mce.command.shopsetting.creategroupfirst" })
            player.sendMessage({ translate: "mce.ui.closechat" })
            var group = await ShopSetting.selectGroup(player, groups)
            if (!group) return
            var items = await Shop.getItems()
            items = items.filter(i => i.data.category == group)
            var selectedItem = await ShopSetting.selectItem(player, items)
            if (selectedItem == undefined) return;
            if (!(await Shop.isValid(selectedItem))) return player.sendMessage({ translate: "mce.command.shopsetting.itemnotfound" })

            await Shop.removeItem(selectedItem)
            return player.sendMessage({ translate: "mce.command.shopsetting.itemremoved" })

          default:
            return player.sendMessage({ translate: "mce.command.shopsetting.item.inputoperation" })
        }
        break

      case "preset":
        if (isMakingPreset) break
        isMakingPreset = true
        player.sendMessage({ translate: "mce.command.shopsetting.preset.starting" })
        try {
          for (const group of Object.keys(ShopPreset)) {
            let name = group.split("|")[0]
            let icon = group.split("|")[1]
            let enchantedIcon = group.split("|")[2] ?? false
            try {
              Shop.addGroup(name, {
                displayname: name,
                icon: icon,
                enchantedIcon: enchantedIcon
              })
            } catch (err) { player.sendMessage({ translate: "mce.command.shopsetting.erroraddinggroup", with: [name, err] }) }
            player.sendMessage({ translate: "mce.command.shopsetting.creatingshop", with: [name] })
            for (const dataPreset of ShopPreset[group]) {
              try {
                // console.log(group, dataPreset.item)
                if (ItemTypes.get(dataPreset.item) == undefined) continue
                let item = new ItemStack(dataPreset.item)
                let displayname = dataPreset.displayname ?? Utility.getItemname(item)
                let icon = dataPreset.icon ?? item.typeId
                if (dataPreset.enchantments) {
                  let enchantment = item.getComponent("minecraft:enchantable")
                  for (const dataEnchant of dataPreset.enchantments) {
                    enchantment.addEnchantment({ type: new EnchantmentType(dataEnchant.name), level: dataEnchant.level })
                  }
                }
                Shop.addItem(item, {
                  displayname: displayname,
                  price: dataPreset.price,
                  icon: icon,
                  category: name
                })
              } catch (err) { player.sendMessage({ translate: "mce.command.shopsetting.preset.erroraddingitem", with: [dataPreset.item, err.stack] }); console.error(err) }
              await Server.sleep(10)
            }
            await Server.sleep(500)
          }
          player.sendMessage({ translate: "mce.command.shopsetting.successfulpreset" })
        } catch (err) {
          console.error(err)
          return player.sendMessage(`§c[Error] ${err} | ${err.stack}`)
        }
        isMakingPreset = false
        break

      default:
        return player.sendMessage({ translate: "mce.command.shopsetting.inputoperation", with: [Server.getPrefix()] })
    }
  })
}

export default shopsetting