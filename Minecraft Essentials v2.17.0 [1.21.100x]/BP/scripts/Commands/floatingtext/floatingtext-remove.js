import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import FloatingText, { basicPlaceHolderList } from "../../Modules/FloatingText"

/**
 * @param {import("../../main").default} Server 
 */
const floatingtext_remove = (Server) => {
  Server.Commands.register({
    name: "floatingtext-remove",
    description: "Remove Floating Text",
    usage: "floatingtext-remove",
    permission: "floatingtext",
    aliases: ["ft-remove"],
    category: "Floating Text"
  }, async (data, player, args) => {
    let floatingTextIds = FloatingText.getAllId()
    if (floatingTextIds.length <= 0) return player.sendMessage("§cNo floating text have been created")
    
    const FloatingTextRemove_UI = new ModalFormData()
      .title("Remove Floating Text")
      .dropdown("Select Id:", floatingTextIds)

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, FloatingTextRemove_UI).then(res => {
      if (!res.canceled) {
        let [id] = res.formValues

        FloatingText.removeText(floatingTextIds[id])
        return player.sendMessage("§aSuccessfully removed floating text!")
      }
    })
  })
}

export default floatingtext_remove