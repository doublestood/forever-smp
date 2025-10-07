import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"

/**
 * @param {import("../../main").default} Server 
 */
const createranks = (Server) => {
  Server.Commands.register({
    name: "createranks",
    description: "Create ranks",
    usage: "createranks",
    permission: "ranks",
    category: "Ranks"
  }, async (data, player, args) => {
    const RanksUI = new ModalFormData()
      .title("Add Ranks")
      .textField("Input Rank Tag", "Example: rank:Owner")
      .textField("Input Display Text", "Example: §cOwner")

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, RanksUI).then(res => {
      if (!res.canceled) {
        let [rankTag, displayName] = res.formValues
        if (rankTag == "" || displayName == "") return player.sendMessage("§cYou have to complete the forms!")

        Server.Ranks.createRank(rankTag, { displayName })
        return player.sendMessage("§aSuccessfully created rank!")
      }
    })
  })
}

export default createranks