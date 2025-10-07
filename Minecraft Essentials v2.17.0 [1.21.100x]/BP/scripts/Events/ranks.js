import { system, world } from "@minecraft/server"
import Config from "../Configuration"
import Utility from "../Modules/Utility"

/**
 * @param {import("../main").default} Server
 */
const ranks = (Server) => {
  world.beforeEvents.chatSend.subscribe(async (data) => {
    if (data.cancel || (Server.Setting.get("showRankOnMessage") ?? Config.Ranks.displayOnMessage) == false) return
    data.cancel = true

    const player = data.sender
    let ranks = Server.Ranks.getRanks(player).filter(r => r != Server.Ranks.DefaultRankTag && !Server.Ranks.getRank(r).hideRanks)
    if (ranks.length <= 0) ranks.push(Server.Ranks.DefaultRankTag)
    ranks = ranks.map((rank) => Server.Ranks.getRank(rank).displayName)
    .join(Config.Ranks.rankSeparator)

    let message = data.message
    let playerName = player.name
    if (Server.Ranks.getColorText(player)) message = Utility.formatColor(message, Server.Ranks.getColorText(player))
    if (Server.Ranks.getColorName(player)) playerName = Utility.formatColor(playerName, Server.Ranks.getColorName(player))

    let text = Config.Ranks.message.replaceAll("{RANK}", ranks).replaceAll("{PLAYERNAME}", playerName).replaceAll("{MESSAGE}", message)
    system.run(() => player.runCommand(`tellraw @a ${JSON.stringify({ rawtext: [{ text }] })}`))
    // world.sendMessage(text)
  })

  system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
      if (!player || !player.isValid) return
      if ((Server.Setting.get("showRankOnNameTag") ?? Config.Ranks.displayOnNameTag) == true) {
        let ranks = Server.Ranks.getRanks(player).filter(r => r != Server.Ranks.DefaultRankTag && !Server.Ranks.getRank(r).hideRanks)
        if (ranks.length <= 0) ranks.push(Server.Ranks.DefaultRankTag)
        ranks = ranks.map((rank) => Server.Ranks.getRank(rank).displayName)
        .join(Config.Ranks.rankSeparator)

        let playerName = player.name
        if (Server.Ranks.getColorName(player)) playerName = Utility.formatColor(playerName, Server.Ranks.getColorName(player))
        
        player.nameTag = Config.Ranks.nameTag.replaceAll("{RANK}", ranks).replaceAll("{PLAYERNAME}", playerName)
      }
    })
  }, 20)
}

export default ranks