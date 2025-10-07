import Config from "../../Configuration"
import { getCooldown, setCooldown } from "../../Modules/Cooldown"
import { TPA } from "../../Modules/Forms"
import { tpaRequest } from "./tpaccept"
import Utility from "../../Modules/Utility"

const tpacancel = (Server) => {
  Server.Commands.register({
    name: "tpacancel",
    description: "mce.command.tpacancel.description",
    usage: "tpacancel <player_name?>",
    category: "TPA"
  }, async (data, player, args) => {
    if (args[0]) {
      let targetPlayer = await Server.getPlayer(args[0])
      if (targetPlayer != undefined) {
        if (tpaRequest.cancel(player, targetPlayer)) return player.sendMessage({ translate: "mce.command.tpacancel.cancel.successfully" })
        return player.sendMessage({ translate: "mce.command.tpacancel.request.unknown" })
      } else {
        return player.sendMessage({ translate: "mce.command.target.unknown" })
      }
    } else {
      tpaRequest.cancelAll(player)
      player.sendMessage({ translate: "mce.command.tpacancel.cancelall.successfully" })
    }
  })
}

export default tpacancel