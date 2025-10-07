import { world } from "@minecraft/server"
import Config from "../../Configuration"

let tpaRequests = []

const tpaccept = (Server) => {
  Server.Commands.register({
    name: "tpaccept",
    description: "mce.command.tpaccept.description",
    usage: "tpaccept <player_name>",
    aliases: ["tpayes"],
    category: "TPA"
  }, async (data, player, args) => {
    const targetRequests = tpaRequests.filter(t => t.targetPlayer.name == player.name)
    if (targetRequests.length <= 0) return player.sendMessage({ translate: "mce.command.tpaccept.request.norequest" })
    let request = targetRequests[targetRequests.length - 1]
    if (args[0]) {
      request = targetRequests.find(t => t.player.name == args[0])
      if (!request) return player.sendMessage({ translate: "mce.command.tpaccept.request.unknown" })
    }
    if (!request) return player.sendMessage({ translate: "mce.command.tpaccept.request.norequest" })
    const targetPlayer = request.targetPlayer
    player = request.player
    if (!targetPlayer.isValid || !player.isValid) return
    let teleportPlayer = request.player
    if (request.type == "tpahere") teleportPlayer = request.targetPlayer

    let tpaCountdown = player.getPermission("tpa.countdown")
    targetPlayer.sendMessage({ translate: "mce.command.tpaccept.request.accepted" })
    player.sendMessage({ translate: "mce.command.tpa.request.accepted", with: [targetPlayer.name] })
    if (tpaCountdown > 0 && !teleportPlayer.isAdmin()) {
      teleportPlayer.sendMessage({ translate: "mce.teleport.waitfor.chat", with: [`${tpaCountdown}`] })
      let playerPosition = teleportPlayer.location
      let cancel = false
      let canceled = false
      let countdown = tpaCountdown
      for (let i = 0; i < tpaCountdown; i++) {
        if (teleportPlayer.isCombat() || teleportPlayer.location.x != playerPosition.x || teleportPlayer.location.y != playerPosition.y || teleportPlayer.location.z != playerPosition.z) cancel = true
        if (cancel) {
          if (!canceled) teleportPlayer.sendMessage({ translate: "mce.command.canceled" })
          canceled = true
          return;
        }
        teleportPlayer.onScreenDisplay.setActionBar({ translate: "mce.teleport.waitfor.actionbar", with: [`${countdown}`] })
        countdown--
        await Server.sleep(1000)
        teleportPlayer.onScreenDisplay.setActionBar({ translate: "mce.teleport.waitfor.actionbar", with: [`${countdown}`] })
      }
    }
    player.sendMessage({ translate: "mce.teleport.teleporting" })
    await Server.teleportPlayer(teleportPlayer, request.location, { dimension: request.dimension })
    player.sendMessage({ translate: "mce.teleport.teleported" })

  })
}

const tpaRequest = {
  send: (player, targetPlayer, location, dimension, type) => {
    let findIndex = tpaRequests.findIndex(t => t.player.name == player.name && t.targetPlayer.name == targetPlayer.name)
    if (findIndex > -1) tpaRequests.splice(findIndex, 1)
    tpaRequests.push({
      player,
      targetPlayer,
      location,
      dimension,
      type,
      time: Date.now()
    })
  },
  checkRequests: (player, targetPlayer, type) => {
    let findIndex = tpaRequests.findIndex(t => t.player.name == player.name && t.targetPlayer.name == targetPlayer.name && t.type == type)
    return findIndex > -1
  },
  cancel: (player, targetPlayer) => {
    let findIndex = tpaRequests.findIndex(t => t.player.name == player.name && t.targetPlayer.name == targetPlayer.name)
    if (findIndex > -1) {
      tpaRequests.splice(findIndex, 1)
      return true
    }
    return false
  },
  cancelAll: (player) => {
    tpaRequests = tpaRequests.filter(t => t.player.name != player.name)
  }
}

world.beforeEvents.playerLeave.subscribe(data => {
  const { player } = data
  let requests = tpaRequests.filter(t => t.player.name == player.name || t.targetPlayer.name == player.name)
  requests.forEach(t => {
    tpaRequests.splice(tpaRequests.indexOf(t), 1)
  })
})

export default tpaccept
export { tpaRequest }