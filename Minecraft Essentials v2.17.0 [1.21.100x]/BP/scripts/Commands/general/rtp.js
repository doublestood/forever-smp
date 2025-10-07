import { Player, system, world } from "@minecraft/server"
import Utility from "../../Modules/Utility"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import Config from "../../Configuration"

/**
 * @param {import("../../main").default} Server
 */
const rtp = (Server) => {
  const playerTeleport = {}

  Server.Commands.register({
    name: "rtp",
    description: "mce.command.rtp.description",
    usage: "tps",
    category: "General"
  }, async (data, player, args) => {
    if (player.isCombat()) return player.sendMessage({ translate: "mce.player.incombat" })
    if (getCooldown("rtp", player) > 0)
      return player.sendMessage({ translate: "mce.player.command.oncooldown.specific", with: ["rtp", `${getCooldown("rtp", player)}`] })
    let rtpCost = player.getPermission("rtp.cost")
    if (rtpCost > 0 && player.getMoney() < rtpCost && !player.isAdmin())
      return player.sendMessage({ translate: "mce.teleport.insufficientfunds", with: [Utility.formatMoney(rtpCost)] })
    if (!player.isAdmin()) player.setMoney(player.getMoney() - rtpCost)
    let rtpCD = player.getPermission("rtp.cooldown")
    setCooldown("rtp", player, rtpCD)
    let rtpCountdown = player.getPermission("rtp.countdown")
    if (rtpCountdown > 0 && !player.isAdmin()) {
      player.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${rtpCountdown}`] })
      let playerPosition = player.location
      let cancel = false
      let canceled = false
      let countdown = rtpCountdown
      for (let i = 0; i < rtpCountdown; i++) {
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
    playerTeleport[player.name] = generateRandomLocation(player)
    player.sendMessage({ translate: "mce.teleport.teleporting" })

    const start = Date.now()
    let running = false
    let interval = system.runInterval(() => {
      if (!player.isValid || !playerTeleport[player.name]) return system.clearRun(interval)
      if (running) return
      running = true
      let location = playerTeleport[player.name]
      player.teleport({ x: location.x, y: player.dimension.heightRange.max, z: location.z })
      let block = player.dimension.getBlock({ x: location.x, y: 0, z: location.z })
      player.onScreenDisplay.setActionBar({ translate: "mce.command.rtp.loadingchunks" })

      if (!block) return running = false

      for (let i = player.dimension.heightRange.max - 2; i >= player.dimension.heightRange.min; i--) {
        player.onScreenDisplay.setActionBar({ translate: "mce.command.rtp.safelocation" })
        let targetBlock = player.dimension.getBlock({ x: location.x, y: i, z: location.z })

        if (targetBlock.isSolid && targetBlock.above(1).isAir && targetBlock.above(2).isAir) {
          player.sendMessage({ translate: "mce.teleport.teleported" })
          player.onScreenDisplay.setActionBar({ translate: "mce.command.rtp.teleported" })
          player.teleport({ x: location.x + 0.5, y: i + 2.5, z: location.z + 0.5 })

          delete playerTeleport[player.name]
          console.log(`RTP done in: ${Date.now() - start}ms`)
          break;
        }

        if (i == player.dimension.heightRange.min) {
          playerTeleport[player.name] = generateRandomLocation(player)
          break
        }
      }

      running = false
    }, 20)
  })

  const generateRandomLocation = (player) => {
    const range = (Server.Setting.get("RTPRange") ?? Config.RTPRange) / 2
    const location = {
      x: Math.floor(player.location.x + Utility.random(-Math.abs(range), Math.abs(range))),
      z: Math.floor(player.location.z + Utility.random(-Math.abs(range), Math.abs(range)))
    }

    return location
  }

  world.afterEvents.playerLeave.subscribe(({ playerName }) => {
    delete playerTeleport[playerName.name]
  })
}

export default rtp

const Credit = "Void(0)"