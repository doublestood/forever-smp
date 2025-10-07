import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import { TPA } from "../../Modules/Forms"
import { tpaRequest } from "./tpaccept"
import Utility from "../../Modules/Utility"

const tpa = (Server) => {
  Server.Commands.register({
    name: "tpa",
    description: "mce.command.tpa.description",
    usage: "tpa <player_name>",
    aliases: ["t"],
    category: "TPA"
  }, async (data, player, args) => {
    if (player.hasTag("tpadisable")) return player.sendMessage({ translate: "mce.command.tpa.disabled.byadmin" })
    if (player.noTPA()) return player.sendMessage({ translate: "mce.command.tpa.disabled", with: [Server.getPrefix()] })
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (player.isCombat()) return player.sendMessage({ translate: "mce.player.incombat" })
      if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.tpa.target.self" })
      if (targetPlayer.hasTag("tpadisable") || targetPlayer.noTPA())
        return player.sendMessage({ translate: "mce.command.tpa.target.disabled", with: [targetPlayer.name] })
      if (getCooldown("tpa", player) > 0)
        return player.sendMessage({ translate: "mce.player.command.oncooldown.specific", with: ["tpa", `${getCooldown("tpa", player)}`] })
      let tpaCost = player.getPermission("tpa.cost")
      if (tpaCost > 0 && player.getMoney() < tpaCost && !player.isAdmin())
        return player.sendMessage({ translate: "mce.teleport.insufficientfunds", with: [Utility.formatMoney(tpaCost)] })
      if (!player.isAdmin()) player.setMoney(player.getMoney() - tpaCost)
      let tpaCD = player.getPermission("tpa.cooldown")
      setCooldown("tpa", player, tpaCD)
      const withUI = Server.Setting.get("tpaSystemWithUI") ?? Config.tpaSystemWithUI
      if (withUI) {
        targetPlayer.sendMessage({ translate: "mce.player.gotrequest.tpa", with: [player.name] })
      } else {
        targetPlayer.sendMessage({ translate: "mce.player.gotrequest.tpa.noui", with: [player.name, Server.getPrefix()] })
      }
      tpaRequest.send(player, targetPlayer, targetPlayer.location, targetPlayer.dimension, "tpa")
      player.sendMessage({ translate: "mce.command.tpa.request.send", with: [targetPlayer.name] })
      if (!withUI) return
      let res = await TPA.TPARequestForm(player, targetPlayer)
      if (res.canceled || res.selection == 0) {
        player.sendMessage({ translate: "mce.command.tpa.request.declined", with: [targetPlayer.name] })
      } else {
        if (!tpaRequest.checkRequests(player, targetPlayer, "tpa")) return targetPlayer.sendMessage({ translate: "mce.command.tpa.request.canceled" })
        let tpaCountdown = player.getPermission("tpa.countdown")
        player.sendMessage({ translate: "mce.command.tpa.request.accepted", with: [targetPlayer.name] })
        if (tpaCountdown > 0 && !player.isAdmin()) {
          player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${tpaCountdown}`] })
          let playerPosition = player.location
          let cancel = false
          let canceled = false
          let countdown = tpaCountdown
          for (let i = 0; i < tpaCountdown; i++) {
            if (player.isCombat() || player.location.x != playerPosition.x || player.location.y != playerPosition.y || player.location.z != playerPosition.z) cancel = true
            if (cancel) {
              if (!canceled) player.sendMessage({ translate: "mce.command.canceled" })
              canceled = true
              return;
            }
            player.onScreenDisplay.setActionBar({ translate: "mce.teleport.waitfor.actionbar", with: [`${countdown}`] })
            countdown--
            await Server.sleep(1000)
            player.onScreenDisplay.setActionBar({ translate: "mce.teleport.waitfor.actionbar", with: [`${countdown}`] })
          }
        }
        player.sendMessage({ translate: "mce.teleport.teleporting" })
        await Server.teleportPlayer(player, targetPlayer.location, { dimension: targetPlayer.dimension })
        player.sendMessage({ translate: "mce.teleport.teleported" })
      }
      tpaRequest.cancel(player, targetPlayer)
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default tpa