import Config from "../Configuration"
import Utility from "../Modules/Utility"

/**
 * @param {import("../main").default} Server
 */
const playerSpawn = (Server) => {
  const BanDB = Server.BanDB

  Server.Minecraft.world.afterEvents.playerSpawn.subscribe((data) => {
    let player = data.player
    if (!player || !player.isValid) return
    if (data.initialSpawn) {
      if (BanDB.has(player.name) || Config.BanPlayer.find(p => p.name == player.name)) {
        let banData = BanDB.get(player.name) ?? Config.BanPlayer.find(p => p.name == player.name)
        if (!banData.duration) return player.kick(`\n§c§lYou're have been banned\nReason : §e${banData.reason} \n§cBy : §e${banData.by ?? "System"}`)
        if (Date.now() > banData.duration) {
          BanDB.delete(player.name)
        } else {
          return player.kick(`\n§c§lYou're have been banned\nReason : §e${banData.reason} \n§cBy : §e${banData.by ?? "System"} \n§cDuration : §e${Utility.formatTextFutureDate(banData.duration)}`)
        }
      }
      Server.PlayerOnline[player.name] = Date.now()
    } else {
      if ((Server.Setting.get("backSystem") ?? true) == false) return
      player.sendMessage({ translate: "mce.player.justdied", with: [Server.getPrefix()] })
    }
  })
}

export default playerSpawn