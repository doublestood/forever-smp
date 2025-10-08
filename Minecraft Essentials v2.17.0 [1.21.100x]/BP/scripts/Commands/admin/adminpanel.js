import {
  ActionFormData,
  ModalFormData
} from "@minecraft/server-ui"
import Utility from "../../Modules/Utility"
import { ForceOpen } from "../../Modules/Forms"
import { Player } from "@minecraft/server"
import { CheckInventory } from "./inventorysee"
import * as MCE from "../../Modules/MinecraftEssentials"

/**
 * @param {import("../../main").default} Server 
 */
const adminpanel = (Server) => {
  Server.Commands.register({
    name: "adminpanel",
    description: "mce.command.adminpanel.description",
    usage: "adminpanel",
    aliases: ["ap"],
    permission: "adminpanel",
    category: "Admin"
  }, async (data, player, args) => {
    switch (args[0]?.toLowerCase()) {
      case "player":
        let targetPlayer = Server.getPlayer(args[1])
        if (!targetPlayer) break
        player.sendMessage({ translate: "mce.ui.closechat" })
        return panel_Player(player, targetPlayer)

      case "settings":
        player.sendMessage({ translate: "mce.ui.closechat" })
        return panel_Settings(player)

      default:
        player.sendMessage({ translate: "mce.ui.closechat" })
        return panel_UI(player)
    }
  })

  /**
   * @param {Player} player 
   */
  const panel_UI = async (player) => {
    let tps = Math.floor(Server.TPS())
    if (tps > 20) tps = 20
    let serverTime = ""
    const DateNow = Date.now()
    const SecondPlayed = Math.ceil((DateNow - Server.timeStarted) / 1000);
    if (SecondPlayed >= 86400) {
      let day = Math.floor(SecondPlayed / 86400)
      serverTime += ` §e${day} §adays,`
    }
    if (SecondPlayed >= 3600) {
      let hour = Math.floor(SecondPlayed / 3600)
      serverTime += ` §e${hour % 24} §ahours,`
    }
    if (SecondPlayed >= 60) {
      let minute = Math.floor(SecondPlayed / 60)
      serverTime += ` §e${minute % 60} §aminutes,`
    }
    let second = SecondPlayed
    serverTime += ` §e${second % 60} §aseconds`
    let panelForm = new ActionFormData()
      .title("§l§eAdmin Panel")
      .body(`§aUsername : §e${player.name}\n§aServer Online :§e${serverTime}\n§aPlayers Online : §e${Server.world.getAllPlayers().length}\n§aTPS : §e${tps}`)
      .button("§l§aPlayers")
      .button("§l§0Settings")
      .button("§l§cBanned Players")

    let res = await ForceOpen(player, panelForm)
    if (!res.canceled) {
      switch (res.selection) {
        case 0:
          let players = Server.world.getAllPlayers().map(p => p.name)
          if (players.length <= 0) return player.sendMessage("§cNo players detected")
          let playerPanel = new ActionFormData()
            .title("§l§ePlayers Panel")
            .body(`§aPlayers Online : §e${players.length}`)
          players.forEach(p => {
            playerPanel.button(`§l§e${p}`)
          })
          playerPanel.button("§l§c<== BACK")

          res = await ForceOpen(player, playerPanel)
          if (!res.canceled) {
            if (!players[res.selection]) return panel_UI(player)
            let targetPlayer = Server.getPlayer(players[res.selection])
            if (!targetPlayer) player.sendMessage("§cPlayer not found!")
            return panel_Player(player, targetPlayer)
          }
          break;

        case 1:
          return panel_Settings(player)

        case 2:
          return panel_BannedPlayer(player)

        default:
          break;
      }
    }
  }

  /**
   * @param {Player} player 
   * @param {Player} targetPlayer 
   */
  const panel_Player = async (player, targetPlayer) => {
    let playerPanel = new ActionFormData()
      .title(`§l§e${targetPlayer.name} Panel`)
      .body(`§aId : §e${targetPlayer.id}
§aAdmin : §e${targetPlayer.isAdmin() ? "Yes" : "No"}
§aGamemode : §e${targetPlayer.getGameMode()}
§aMoney : §e${Utility.formatMoney(targetPlayer.getMoney())}
§aOwned Homes : §e${Server.HomeDB.keys().filter(h => h.startsWith(targetPlayer.name)).length}
§aPosition : §e${Object.values(targetPlayer.location).map(Math.floor).join(", ")}
§aDimension : §e${targetPlayer.dimension.id.split(":")[1].split('_').map(v => v[0].toUpperCase() + v.slice(1).toLowerCase()).join(" ")}`)
      .button("§l§aSet Money")
      .button("§l§2Teleport")
      .button(`§l${targetPlayer.hasTag("tpadisable") ? "§aEnable" : "§cDisable"} TPA`)
      .button(targetPlayer.isMuted() ? "§l§aUnmute" : "§l§cMute")
      .button("§l§0List Homes")
      .button("§l§eKick")
      .button("§l§cBan")
      .button("§l§6Check Inventory")
      .button("§l§eCheck Lands")
    playerPanel.button("§l§c<== BACK")

    let res = await ForceOpen(player, playerPanel)
    if (!res.canceled) {
      if (Server.getPlayer(targetPlayer.name) == undefined) return player.sendMessage("§cNo targets matched selector")
      switch (res.selection) {
        case 0:
          if (!player.checkPermission("economy")) return player.sendMessage("§cYou don't have permission to set money!")
          let moneyPanel = new ModalFormData()
            .title(`§l§eSet ${targetPlayer.name}'s Money`)
            .textField("Input Amount :", "Input Amount Here")

          res = await ForceOpen(player, moneyPanel)
          if (!res.canceled) {
            let amount = Number(res.formValues[0])
            if (!Number.isInteger(amount)) return player.sendMessage("§cInput a number.")
            await Server.Money.setMoney(targetPlayer.name, amount)
            player.sendMessage(`§aSuccessfully set ${targetPlayer.name}'s money to §e${Utility.formatMoney(amount)}`)
          } else {
            return panel_Player(player, targetPlayer)
          }
          break;

        case 1:
          await Server.teleportPlayer(player, targetPlayer.location, { dimension: targetPlayer.dimension })
          player.sendMessage("§aSuccessfully Teleported.")
          break;

        case 2:
          if (targetPlayer.hasTag("tpadisable")) {
            await targetPlayer.removeTag("tpadisable")
          } else {
            await targetPlayer.addTag("tpadisable")
          }
          return panel_Player(player, targetPlayer)

        case 3:
          if (targetPlayer.isMuted()) {
            if (!player.checkPermission("mute")) return player.sendMessage("§cYou don't have permission to unmute player!")
            await targetPlayer.unmute()
          } else {
            if (!player.checkPermission("mute")) return player.sendMessage("§cYou don't have permission to mute player!")
            await targetPlayer.mute()
          }
          return panel_Player(player, targetPlayer)

        case 4:
          return panel_PlayerHomes(player, targetPlayer)

        case 5:
          if (!player.checkPermission("kick")) return player.sendMessage("§cYou don't have permission to kick player!")
          let kickPanel = new ModalFormData()
            .title(`§l§4Kick ${targetPlayer.name}`)
            .textField("Input Reason :", "Input Reason Here")

          res = await ForceOpen(player, kickPanel)
          if (!targetPlayer) return player.sendMessage("§cNo targets matched selector")
          if (!res.canceled) {
            let reason = res.formValues[0]
            let result = await targetPlayer.kick(`\n§c§lYou're have been kicked\nReason : §e${reason} \n§cBy : §e${player.name}`)
            if (result.successCount == 0) return player.sendMessage(`§cSomething error when kicked ${targetPlayer.name} from the game.`)
            return player.sendMessage(`§aSuccessfully kicked ${targetPlayer.name}`)
          } else {
            return panel_Player(player, targetPlayer)
          }

        case 6:
          if (!player.checkPermission("ban")) return player.sendMessage("§cYou don't have permission to ban player!")
          let banPanel = new ModalFormData()
            .title(`§l§4Ban ${targetPlayer.name}`)
            .textField("Input Reason :", "Input Reason Here")

          res = await ForceOpen(player, banPanel)
          if (!targetPlayer) return player.sendMessage("§cNo targets matched selector")
          if (!res.canceled) {
            let reason = res.formValues[0]
            await Server.BanDB.set(targetPlayer.name, {
              reason: reason,
              by: player.name
            })
            let result = await targetPlayer.kick(`\n§c§lYou're have been banned\nReason : §e${reason} \n§cBy : §e${player.name}`)
            if (result.successCount == 0) return player.sendMessage(`§cSomething error when banned ${targetPlayer.name} from the game.`)
            return player.sendMessage(`§aSuccessfully banned ${targetPlayer.name}`)
          } else {
            return panel_Player(player, targetPlayer)
          }

        case 7:
          if (!player.checkPermission("invsee")) return player.sendMessage("§cYou don't have permission to check inventory!")
          return CheckInventory(player, targetPlayer)

        case 8:
          if (!player.isAdmin()) return player.sendMessage("§cYou don't have permission to check lands!")
          return player.runCommand(`scriptevent cc:runCommand land players "${targetPlayer.name}"`)

        default:
          return panel_UI(player);
      }
    }
  }

  /**
   * @param {Player} player 
   * @param {Player} targetPlayer 
   */
  const panel_PlayerHomes = async (player, targetPlayer) => {
    let Homes = Server.HomeDB.keys().filter(h => h.startsWith(targetPlayer.name))
    if (Homes.length <= 0) {
      let playerPanel = new ActionFormData()
        .title(`§l§e${targetPlayer.name}'s Homes Panel`)
        .body(`§c${targetPlayer.name} doesn't have home!`)
        .button("§l§c<== BACK")

      let res = await ForceOpen(player, playerPanel)
      if (!res.canceled) {
        return panel_Player(player, targetPlayer)
      }
    }
    let playerPanel = new ActionFormData()
      .title(`§l§e${targetPlayer.name}'s Homes Panel`)
      .body(`§aOwned Homes : §e${Homes.length}`)
    Homes.forEach(homeName => {
      let home = Server.HomeDB.get(homeName)
      if (!home) playerPanel.button("§cHome not found")
      playerPanel.button(`§l§a${homeName.substring(`${targetPlayer.name}-`.length)}
  §e${Math.round(home.x)} | ${Math.round(home.y)} | ${Math.round(home.z)}`)
    })

    let res = await ForceOpen(player, playerPanel)
    if (!res.canceled) {
      let HomeName = Homes[res.selection]
      let Home = Server.HomeDB.get(HomeName)
      if (!Home) {
        let homePanel = new ActionFormData()
          .title(`§l§e${targetPlayer.name}'s Homes Panel`)
          .body("§cHome not found!")
          .button("§l§c<== BACK")

        res = await ForceOpen(player, homePanel)
        if (!res.canceled) {
          return panel_PlayerHomes(player, targetPlayer)
        }
      } else {
        let homePanel = new ActionFormData()
          .title(`§l§e${targetPlayer.name}'s Homes Panel`)
          .body(`§aName : §e${HomeName.substring(`${targetPlayer.name}-`.length)}
  §aPosition : §e${Math.round(Home.x)} | ${Math.round(Home.y)} | ${Math.round(Home.z)}
  §aDimension : §e${Home.dimension}`)
          .button("§l§aTeleport")
          .button("§l§4Delete")
          .button("§l§c<== BACK")

        res = await ForceOpen(player, homePanel)
        if (!res.canceled) {
          switch (res.selection) {
            case 0:
              await Server.teleportPlayer(player, { x: Home.x, y: Home.y, z: Home.z }, { dimension: Server.getDimension(Home.dimension) })
              return player.sendMessage("§aSuccessfully Teleported.")

            case 1:
              await Server.HomeDB.delete(HomeName)
              return panel_PlayerHomes(player, targetPlayer)

            case 2:
              return panel_PlayerHomes(player, targetPlayer)

            default:
              break;
          }
        }
      }
    }
  }

  /**
   * @param {Player} player 
   */
  const panel_Settings = async (player) => {
    let settingName = Object.keys(Server.Setting.List)
    let settingPanel = new ModalFormData()
      .title("§l§eSettings Panel")
    settingName.forEach((name, i) => {
      const settingData = Server.Setting.List[name]

      /** @type {import("@minecraft/server").RawMessage} */
      const rawtext = { rawtext: [{ text: `${name}\n` }, { translate: settingData[1] }] }

      if (i == 0) {
        settingPanel.label("Welcome to setting panel, you can see/edit setting here.\n\n")
        settingPanel.divider()
      }

      switch (settingData[0]) {
        case Server.Setting.Type.CUSTOMSTR:
          settingPanel.textField(rawtext, "Input text here", { defaultValue: Server.Setting.get(name) ?? undefined })
          break;
        case Server.Setting.Type.CUSTOMNUM:
          settingPanel.textField(rawtext, "Input number here", { defaultValue: Server.Setting.get(name)?.toString() ?? undefined })
          break;
        case Server.Setting.Type.TRUEFALSE:
          settingPanel.toggle(rawtext, { defaultValue: Server.Setting.get(name) ?? undefined })
          break;
      }
      settingPanel.divider()
    })
    settingPanel.submitButton("Save settings")

    let res = await ForceOpen(player, settingPanel)
    if (!res.canceled) {
      settingName.forEach((name, i) => {
        const settingData = Server.Setting.List[name]
        let value = res.formValues[i]

        switch (settingData[0]) {
          case Server.Setting.Type.CUSTOMSTR:
            Server.Setting.set(name, value)
            break;
          case Server.Setting.Type.CUSTOMNUM:
            value = Number(value)
            if (Number.isNaN(value))
              return player.sendMessage({ rawtext: [{ text: `§c${name} | ` }, { translate: "mce.command.setting.inputnumber" }] })

            if (value < 0) {
              const notAllowed = [
                "maxMoney", "homeLimit"
              ]
              if (notAllowed.includes(name))
                return player.sendMessage({ rawtext: [{ text: `§c${name} | ` }, { translate: "mce.command.setting.number.inputmorethanone" }] })
            }
            if (!Number.isFinite(value)) {
              const notAllowed = [
                "starterMoney"
              ]

              if (notAllowed.includes(name))
                return player.sendMessage({ rawtext: [{ text: `§c${name} | ` }, { translate: "mce.command.setting.number.infinity" }] })
            }

            Server.Setting.set(name, value)
            break;
          case Server.Setting.Type.TRUEFALSE:
            Server.Setting.set(name, value)
            break;
        }

      })

      player.sendMessage("§aSuccessfully Saved.")
    }
  }
  /**
   * @param {Player} player 
   */
  const panel_BannedPlayer = async (player) => {
    let bannedPlayers = Server.BanDB.keys()
    let bannedPanel = new ActionFormData()
      .title("§l§4Banned Panel")
      .body(`§aTotal Players Banned : §e${bannedPlayers.length}`)
    bannedPlayers.forEach(name => {
      bannedPanel.button(`§l§4${name}`)
    })
    bannedPanel.button("§l§c<== BACK")

    let res = await ForceOpen(player, bannedPanel)
    if (!res.canceled) {
      if (res.selection == bannedPlayers.length) return panel_UI(player)
      let playerName = bannedPlayers[res.selection]
      let bannedData = Server.BanDB.get(playerName)
      if (bannedData == undefined) return panel_BannedPlayer(player)
      let bannedPanel = new ActionFormData()
        .title("§l§4Banned Panel")
        .body(`§aReason : §e${bannedData.reason}\n§aBy : §e${bannedData.by}${bannedData.duration ? `\n§aDuration : §e${Utility.formatTextFutureDate(bannedData.duration)}` : ""}`)
        .button("§l§aUnban")
        .button("§l§c<== BACK")

      res = await ForceOpen(player, bannedPanel)
      if (!res.canceled) {
        switch (res.selection) {
          case 0:
            if (!player.checkPermission("ban")) return player.sendMessage("§cYou don't have permission to unban!")
            await Server.BanDB.delete(playerName)
            player.sendMessage(`§aSuccessfully unbanned ${playerName}`)
            break;

          case 1:
            return panel_BannedPlayer(player)

          default:
            break;
        }
      }
    }
  }
}

export default adminpanel