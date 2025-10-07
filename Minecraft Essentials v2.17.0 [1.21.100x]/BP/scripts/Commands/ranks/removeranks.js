import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"

/**
 * @param {import("../../main").default} Server 
 */
const removeranks = (Server) => {
  Server.Commands.register({
    name: "removeranks",
    description: "Remove Rank from Player",
    usage: "addranks <player_name>",
    permission: "ranks",
    category: "Ranks"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = await Server.getPlayer(args[0])
    if (targetPlayer) {
      const Ranks = Server.Ranks.getRanks(targetPlayer).filter(r => r != "mce:default_rank")
      if (Ranks.length <= 0) return player.sendMessage("§cPlayer have no ranks.")
      const RanksUI = new ModalFormData()
        .title("Remove Ranks")
        .dropdown("Select Ranks", Ranks)

      player.sendMessage("§eClose Chat to Show UI!")
      ForceOpen(player, RanksUI).then(res => {
        if (!res.canceled) {
          const [rank] = res.formValues
          if (!targetPlayer.hasTag(Ranks[rank])) return player.sendMessage("§cPlayer doesn't have that ranks!")
          targetPlayer.removeTag(Ranks[rank])

          player.sendMessage("§aSuccessfully remove ranks!")
        }
      })
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  })
}

export default removeranks