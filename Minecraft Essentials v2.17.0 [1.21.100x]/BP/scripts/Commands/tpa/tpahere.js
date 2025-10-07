import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import { TPA } from "../../Modules/Forms"
import { tpaRequest } from "./tpaccept"
import Utility from "../../Modules/Utility"

const tpahere = (Server) => {
  Server.Commands.register({
    name: "tpahere",
    description: "mce.command.tpahere.description",
    usage: "tpahere <player_name>",
    aliases: ["th"],
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
        targetPlayer.sendMessage({ translate: "mce.player.gotrequest.tpahere", with: [player.name] })
      } else {
        targetPlayer.sendMessage({ translate: "mce.player.gotrequest.tpahere.noui", with: [player.name, Server.getPrefix()] })
      }
      tpaRequest.send(player, targetPlayer, player.location, player.dimension, "tpahere")
      player.sendMessage({ translate: "mce.command.tpa.request.send", with: [targetPlayer.name] })
      if (!withUI) return
      const res = await TPA.TPAHereRequestForm(player, targetPlayer)
      if (res.canceled || res.selection == 0) {
        player.sendMessage({ translate: "mce.command.tpa.request.declined", with: [targetPlayer.name] })
      } else {
        if (!tpaRequest.checkRequests(player, targetPlayer, "tpahere")) return targetPlayer.sendMessage({ translate: "mce.command.tpa.request.canceled" })
        let tpaCountdown = player.getPermission("tpa.countdown")
        let teleportVector3 = player.location
        player.sendMessage({ translate: "mce.command.tpa.request.accepted", with: [targetPlayer.name] })
        if (tpaCountdown > 0 && !player.isAdmin()) {
          player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${tpaCountdown}`] })
          let playerPosition = targetPlayer.location
          let cancel = false
          let canceled = false
          let countdown = tpaCountdown
          for (let i = 0; i < tpaCountdown; i++) {
            if (targetPlayer.isCombat() || targetPlayer.location.x != playerPosition.x || targetPlayer.location.y != playerPosition.y || targetPlayer.location.z != playerPosition.z) cancel = true
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
        await Server.teleportPlayer(targetPlayer, teleportVector3, { dimension: player.dimension })
        player.sendMessage({ translate: "mce.teleport.teleported" })
      }
      tpaRequest.cancel(player, targetPlayer)
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })
}

export default tpahere