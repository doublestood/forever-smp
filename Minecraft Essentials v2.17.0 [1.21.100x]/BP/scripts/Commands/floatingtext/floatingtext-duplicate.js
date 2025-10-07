import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import FloatingText, { basicPlaceHolderList } from "../../Modules/FloatingText"

/**
 * @param {import("../../main").default} Server 
 */
const floatingtext_duplicate = (Server) => {
  Server.Commands.register({
    name: "floatingtext-duplicate",
    description: "Duplicate / Clone Floating Text",
    usage: "floatingtext-duplicate",
    permission: "floatingtext",
    aliases: ["ft-duplicate", "ft-clone"],
    category: "Floating Text"
  }, async (data, player, args) => {
    let locations = ["My Location"]
    let blockLocation = player.getBlockFromViewDirection()?.block
    if (blockLocation) locations.push("Block Location")

    let floatingTextIds = FloatingText.getAllId()
    if (floatingTextIds.length <= 0) return player.sendMessage("§cNo floating text have been created")

    const FloatingTextDuplicate_UI = new ModalFormData()
      .title("Duplicate Floating Text")
      .dropdown("Select Id:", floatingTextIds)
      .dropdown("Location on:", locations)

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, FloatingTextDuplicate_UI).then(res => {
      if (!res.canceled) {
        let [id, locationIndex] = res.formValues
        let location = player.location
        if (locationIndex == 1) location = { x: blockLocation.location.x + 0.5, y: blockLocation.location.y, z: blockLocation.location.z + 0.5 }

        let floatingText = player.dimension.spawnEntity("pao:floating_text", location)
        floatingText.nameTag = "Duplicating..."
        floatingText.addTag(`fl_id:${floatingTextIds[id]}`)
        return player.sendMessage("§aSuccessfully duplicated floating text!")
      }
    })
  })
}

export default floatingtext_duplicate