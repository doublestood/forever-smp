import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import Config from "../../Configuration"
import { Player } from "@minecraft/server"

/**
 * @param {import("../../main").default} Server 
 */
const editranks = (Server) => {
  Server.Commands.register({
    name: "editranks",
    description: "Edit ranks",
    usage: "editranks",
    permission: "ranks",
    category: "Ranks"
  }, async (data, player, args) => {
    const Ranks = Server.Ranks.getRanks()//.filter(r => r != Server.Ranks.DefaultRankTag)
    if (Ranks.length <= 0) return player.sendMessage("§cNo ranks have been created.")
    const RanksUI = new ModalFormData()
      .title("Edit Ranks")
      .dropdown("Select Ranks", Ranks)

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, RanksUI).then(res => {
      if (!res.canceled) {
        const rank = Ranks[res.formValues[0]]
        let rankData = Server.Ranks.getRank(rank)

        const SelectUI = new ActionFormData()
          .title("Edit Rank")
          .body("Select actions")
          .button("Basic Setting")
          .button("Basic Permission")
          .button("Admin Permission")
          .button("Land Permission")
          .button("Chest Shop Permission")

        ForceOpen(player, SelectUI).then((res) => {
          if (!res.canceled) {
            switch (res.selection) {
              case 0:
                return BasicSetting(player, rank, rankData)
              case 1:
                return BasicPermission(player, rank, rankData)
              case 2:
                return AdminPermission(player, rank, rankData)
              case 3:
                return LandPermission(player, rank, rankData)
              case 4:
                return ChestShopPermission(player, rank, rankData)
              default: break;
            }
          }
        })
      }
    })
  })

  /**
   * 
   * @param {Player} player 
   * @param {string}  rankId
   * @param {{displayName: string, order: number | null, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
   */
  const BasicSetting = (player, rankId, rankData) => {
    const BasicSettingUI = new ModalFormData()
      .title("Edit Rank")
      .textField("Ranks Display Text:", "Input here", { defaultValue: rankData.displayName })
      .textField("Ranks Order:", "Input number here", { defaultValue: `${rankData.order}` })
      .textField("Ranks Name Color:", "Example: §b", { default: rankData.colorName, tooltip: "Use §" })
      .textField("Ranks Message Color:", "Example: §b", { defaultValue: rankData.colorText, tooltip: "Use §" })
      .toggle("Hide Ranks", { defaultValue: rankData.hideRanks ?? false })

    ForceOpen(player, BasicSettingUI).then((res) => {
      if (!res.canceled) {
        let [displayName, order, colorName, colorText, hideRanks] = res.formValues
        if (rankId == Server.Ranks.DefaultRankTag) order = "9999"
        if (rankId == Server.Ranks.DefaultRankTag) hideRanks = false
        rankData.displayName = displayName
        rankData.order = Number(order) || rankData.order
        rankData.colorName = colorName
        rankData.colorText = colorText
        rankData.hideRanks = hideRanks
        Server.Ranks.editRank(rankId, rankData)
        return player.sendMessage("§aSuccessfully edited rank!")
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @param {string}  rankId
   * @param {{displayName: string, order: number | null, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
   */
  const BasicPermission = (player, rankId, rankData) => {
    const permissionList = Server.Ranks.permissionList
    let firstTextField = "For Permission:\nLeave blank to use default permission\n\n"

    const BasicPermissionUI = new ModalFormData()
      .title("Edit Ranks")
    for (let p of Object.keys(permissionList)) {
      BasicPermissionUI.textField(firstTextField + permissionList[p][0], "Input number here", { defaultValue: `${rankData.permissions[p] ?? ""}` })
      firstTextField = ""
    }

    ForceOpen(player, BasicPermissionUI).then(res => {
      if (!res.canceled) {

        for (let i = 0; i < res.formValues.length; i++) {
          const permissionName = Object.keys(permissionList)[i]
          let permissionValue = res.formValues[i]

          // console.warn(permissionName, permissionValue)
          // console.warn(rankId == Server.Ranks.DefaultRankTag && (permissionValue.trim() == "" || !Number.isSafeInteger(Number(permissionValue)) || Number(permissionValue) < 0))
          if (rankId == Server.Ranks.DefaultRankTag && (permissionValue.trim() == "" || !Number.isSafeInteger(Number(permissionValue)) || Number(permissionValue) < 0))
            permissionValue = `${rankData.permissions[permissionName]}`
          rankData.permissions[permissionName] = permissionValue
        }

        Server.Ranks.editRank(rankId, rankData)
        return player.sendMessage("§aSuccessfully edited rank!")
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @param {string}  rankId
   * @param {{displayName: string, order: number | null, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
   */
  const AdminPermission = (player, rankId, rankData) => {
    const permissionList = Server.Ranks.adminPermissionList
    if (!rankData.adminPermissions) rankData.adminPermissions = {}

    const AdminPermissionUI = new ModalFormData()
      .title("Edit Ranks")
      .label("Allow/Deny player to use admin command")

    for (let p of Object.keys(permissionList)) {
      const currentPermission = rankData.adminPermissions[p]
      let defaultIndex = 1
      if (currentPermission === true) {
        defaultIndex = 0
      } else if (currentPermission === false) {
        defaultIndex = 2
      }
      AdminPermissionUI.divider()
        .dropdown(permissionList[p][0], ["Allow", "No action (Default)", "Deny"], { defaultValueIndex: defaultIndex })
    }

    ForceOpen(player, AdminPermissionUI).then(res => {
      if (!res.canceled) {

        for (let i = 0; i <= res.formValues.length; i++) {
          const permissionName = Object.keys(permissionList)[i]
          let permissionValue = res.formValues[i]

          // console.warn(permissionName, permissionValue)
          if (rankId == Server.Ranks.DefaultRankTag && permissionValue == 1) continue
          if (permissionValue == 0) rankData.adminPermissions[permissionName] = true
          if (permissionValue == 1) delete rankData.adminPermissions[permissionName]
          if (permissionValue == 2) rankData.adminPermissions[permissionName] = false
        }

        Server.Ranks.editRank(rankId, rankData)
        return player.sendMessage("§aSuccessfully edited rank!")
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @param {string}  rankId
   * @param {{displayName: string, order: number | null, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
   */
  const LandPermission = (player, rankId, rankData) => {
    const permissionList = Server.Ranks.landPermissionList
    if (!rankData.landPermissions) rankData.landPermissions = {}

    const AdminPermissionUI = new ModalFormData()
      .title("Edit Ranks")
      .label("Allow/Deny player to use land command")

    for (let p of Object.keys(permissionList)) {
      const currentPermission = rankData.landPermissions[p]
      let defaultIndex = 1
      if (currentPermission === true) {
        defaultIndex = 0
      } else if (currentPermission === false) {
        defaultIndex = 2
      }
      AdminPermissionUI.divider()
        .dropdown(permissionList[p][0], ["Allow", "No action (Default)", "Deny"], { defaultValueIndex: defaultIndex })
    }

    ForceOpen(player, AdminPermissionUI).then(res => {
      if (!res.canceled) {

        for (let i = 0; i < res.formValues.length; i++) {
          const permissionName = Object.keys(permissionList)[i]
          let permissionValue = res.formValues[i]

          // console.warn(permissionName, permissionValue)
          if (rankId == Server.Ranks.DefaultRankTag && permissionValue == 1) continue
          if (permissionValue == 0) rankData.landPermissions[permissionName] = true
          if (permissionValue == 1) delete rankData.landPermissions[permissionName]
          if (permissionValue == 2) rankData.landPermissions[permissionName] = false
        }

        Server.Ranks.editRank(rankId, rankData)
        return player.sendMessage("§aSuccessfully edited rank!")
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @param {string}  rankId
   * @param {{displayName: string, order: number | null, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
   */
  const ChestShopPermission = (player, rankId, rankData) => {
    const permissionList = Server.Ranks.chestShopPermissionList
    if (!rankData.chestShopPermissions) rankData.chestShopPermissions = {}

    const AdminPermissionUI = new ModalFormData()
      .title("Edit Ranks")
      .label("Allow/Deny player to use chest shop feature")

    for (let p of Object.keys(permissionList)) {
      const currentPermission = rankData.chestShopPermissions[p]
      let defaultIndex = 1
      if (currentPermission === true) {
        defaultIndex = 0
      } else if (currentPermission === false) {
        defaultIndex = 2
      }
      AdminPermissionUI.divider()
        .dropdown(permissionList[p][0], ["Allow", "No action (Default)", "Deny"], { defaultValueIndex: defaultIndex, tooltip: permissionList[p][1] })
    }

    ForceOpen(player, AdminPermissionUI).then(res => {
      if (!res.canceled) {

        for (let i = 0; i < res.formValues.length; i++) {
          const permissionName = Object.keys(permissionList)[i]
          let permissionValue = res.formValues[i]

          // console.warn(permissionName, permissionValue)
          if (rankId == Server.Ranks.DefaultRankTag && permissionValue == 1) continue
          if (permissionValue == 0) rankData.chestShopPermissions[permissionName] = true
          if (permissionValue == 1) delete rankData.chestShopPermissions[permissionName]
          if (permissionValue == 2) rankData.chestShopPermissions[permissionName] = false
        }

        Server.Ranks.editRank(rankId, rankData)
        return player.sendMessage("§aSuccessfully edited rank!")
      }
    })
  }
}

export default editranks