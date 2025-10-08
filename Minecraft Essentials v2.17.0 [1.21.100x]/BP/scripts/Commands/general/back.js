import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import Utility from "../../Modules/Utility"

/**
 * @param {import("../../main").default} Server
 */
const back = (Server) => {
  const BackDB = Server.BackDB

  Server.Commands.register({
    name: "back",
    description: "mce.command.back.description",
    usage: "back",
    category: "General"
  }, async (data, player, args) => {
    const backData = BackDB.get(player.name)
    if (backData != undefined) {
      if (player.isCombat()) return player.sendMessage({ translate: "mce.player.incombat" })
      if (getCooldown("back", player) > 0)
        return player.sendMessage({ translate: "mce.player.command.oncooldown.specific", with: ["back", `${getCooldown("back", player)}`] })
      let backCost = player.getPermission("back.cost")
      if (backCost > 0 && player.getMoney() < backCost && !player.isAdmin())
        return player.sendMessage({ translate: "mce.teleport.insufficientfunds", with: [Utility.formatMoney(backCost)] })
      if (!player.isAdmin()) player.setMoney(player.getMoney() - backCost)
      let backCD = player.getPermission("back.cooldown")
      setCooldown("back", player, backCD)
      let backCountdown = player.getPermission("back.countdown")
      if (backCountdown > 0 && !player.isAdmin()) {
        player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${backCountdown}`] })
        let playerPosition = player.location
        let cancel = false
        let canceled = false
        let countdown = backCountdown
        for (let i = 0; i < backCountdown; i++) {
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
      await Server.teleportPlayer(player, backData, { dimension: Server.getDimension(backData.dimension) })
      player.sendMessage({ translate: "mce.teleport.teleported" })
    } else {
      player.sendMessage({ translate: "mce.command.back.unknown" })
    }
  })
}

export default back