import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import Utility from "../../Modules/Utility"

const warp = (Server) => {
  const WarpDB = Server.WarpDB

  Server.Commands.register({
    name: "warp",
    description: "mce.command.warp.description",
    usage: "warp <place_name>",
    aliases: ["w"],
    settingname: "warp",
    category: "Warp"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.warp.inputname" })
    let name = args.slice(0).join(" ")
    let warp = WarpDB.get(name)
    if (warp != undefined) {
      if (player.isCombat()) return player.sendMessage({ translate: "mce.player.incombat" })
      if (getCooldown("warp", player) > 0)
        return player.sendMessage({ translate: "mce.player.command.oncooldown.specific", with: ["warp", `${getCooldown("warp", player)}`] })
      let warpCost = player.getPermission("warp.cost")
      if (warpCost > 0 && player.getMoney() < warpCost && !player.isAdmin())
        return player.sendMessage({ translate: "mce.teleport.insufficientfunds", with: [Utility.formatMoney(warpCost)] })
      if (!player.isAdmin()) player.setMoney(player.getMoney() - warpCost)
      let warpCD = player.getPermission("warp.cooldown")
      setCooldown("warp", player, warpCD)
      let warpCountdown = player.getPermission("warp.countdown")
      if (warpCountdown > 0 && !player.isAdmin()) {
        player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${warpCountdown}`] })
        let playerPosition = player.location
        let cancel = false
        let canceled = false
        let countdown = warpCountdown
        for (let i = 0; i < warpCountdown; i++) {
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
      await Server.teleportPlayer(player, warp, { dimension: Server.getDimension(warp.dimension) })
      player.sendMessage({ translate: "mce.teleport.teleported" })
    } else {
      player.sendMessage({ translate: "mce.command.warp.unknown" })
    }
  })
}

export default warp