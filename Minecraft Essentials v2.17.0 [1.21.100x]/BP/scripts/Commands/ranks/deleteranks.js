import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"

/**
 * @param {import("../../main").default} Server 
 */
const deleteranks = (Server) => {
  Server.Commands.register({
    name: "deleteranks",
    description: "Delete ranks",
    usage: "deleteranks",
    aliases: ["delranks"],
    permission: "ranks",
    category: "Ranks"
  }, async (data, player, args) => {
    const RanksList = Server.Ranks.getRanks().filter(r => r != "mce:default_rank")
    const RanksUI = new ModalFormData()
      .title("Delete Ranks")
      .dropdown("Select Ranks", RanksList)

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, RanksUI).then(res => {
      if (!res.canceled) {
        let rank = RanksList[res.formValues[0]]

        Server.Ranks.deleteRank(rank)
        return player.sendMessage("§aSuccessfully deleted rank!")
      }
    })
  })
}

export default deleteranks