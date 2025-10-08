import { MessageFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import FloatingText from "../../Modules/FloatingText"

/**
 * @param {import("../../main").default} Server 
 */
const floatingtext_clear = (Server) => {
  Server.Commands.register({
    name: "floatingtext-clear",
    description: "Clear all Floating Text",
    usage: "floatingtext-clear",
    permission: "floatingtext",
    aliases: ["ft-clear"],
    category: "Floating Text"
  }, async (data, player, args) => {
    const resetUI = new MessageFormData()
      .title("§c§lRESET FLOATING TEXT")
      .body(`Are you sure want to clear §eFLOATING TEXT§r? You can't undo this.`)
      .button2("§c§lYES")
      .button1("§a§lNO")

    player.sendMessage("§eClose Chat to Show UI!")
    let res = await ForceOpen(player, resetUI)
    if (!res.canceled) {
      if (res.selection === 1) {
        FloatingText.clear()
        return player.sendMessage("§aSuccessfully cleared all floating text.")
      } else {
        return player.sendMessage("§cCanceled.")
      }
    }
  })
}

export default floatingtext_clear