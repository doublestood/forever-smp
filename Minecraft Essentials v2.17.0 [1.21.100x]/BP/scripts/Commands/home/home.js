import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import Utility from "../../Modules/Utility"

const home = (Server) => {
  const HomeDB = Server.HomeDB

  Server.Commands.register({
    name: "home",
    description: "mce.command.home.description",
    usage: "home <home_name>",
    aliases: ["h"],
    category: "Home"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.home.inputname" })
    let name = args.slice(0).join(" ")
    let playerHome = HomeDB.get(`${player.name}-${name}`)
    if (playerHome != undefined) {
      if (player.isCombat()) return player.sendMessage({ translate: "mce.player.incombat" })
      if (getCooldown("home", player) > 0)
        return player.sendMessage({ translate: "mce.player.command.oncooldown.specific", with: ["home", `${getCooldown("home", player)}`] })
      let homeCost = player.getPermission("home.cost")
      if (homeCost > 0 && player.getMoney() < homeCost && !player.isAdmin())
        return player.sendMessage({ translate: "mce.teleport.insufficientfunds", with: [Utility.formatMoney(homeCost)] })
      if (!player.isAdmin()) player.setMoney(player.getMoney() - homeCost)
      let homeCD = player.getPermission("home.cooldown")
      setCooldown("home", player, homeCD)
      let homeCountdown = player.getPermission("home.countdown")
      if (homeCountdown > 0 && !player.isAdmin()) {
        player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${homeCountdown}`] })
        let playerPosition = player.location
        let cancel = false
        let canceled = false
        let countdown = homeCountdown
        for (let i = 0; i < homeCountdown; i++) {
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
      await Server.teleportPlayer(player, playerHome, { dimension: Server.getDimension(playerHome.dimension) })
      player.sendMessage({ translate: "mce.teleport.teleported" })
    } else {
      player.sendMessage({ translate: "mce.command.home.unknown" })
    }
  })
}

export default home