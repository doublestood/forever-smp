import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import FloatingText, { basicPlaceHolderList, scoreboardPlaceHolderList } from "../../Modules/FloatingText"
import { Player } from "@minecraft/server"

/**
 * @param {import("../../main").default} Server 
 */
const floatingtext_edit = (Server) => {
  Server.Commands.register({
    name: "floatingtext-edit",
    description: "Edit Floating Text",
    usage: "floatingtext-edit",
    permission: "floatingtext",
    aliases: ["ft-edit"],
    category: "Floating Text"
  }, async (data, player, args) => {
    let floatingTextIds = FloatingText.getAllId()
    if (floatingTextIds.length <= 0) return player.sendMessage("§cNo floating text have been created")

    const FloatingTextRemove_UI = new ModalFormData()
      .title("Edit Floating Text")
      .dropdown("Select Id:", floatingTextIds)

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, FloatingTextRemove_UI).then(res => {
      if (!res.canceled) {
        let [id] = res.formValues

        let floatId = floatingTextIds[id]
        return EditMenu(player, floatId)
      }
    })
  })

  Server.world.afterEvents.playerInteractWithEntity.subscribe(({ player, target }) => {
    if (!player.checkPermission("floatingtext")) return
    if (target.typeId !== "pao:floating_text" || !target.getTags().find(t => t.startsWith("fl_id:"))) return
    const floatId = target.getTags().find(t => t.startsWith("fl_id:")).split(":")[1]
    return EditMenu(player, floatId)
  })

  /**
   * @param {Player} player 
   * @param {string} floatId 
   */
  const EditMenu = (player, floatId) => {
    const EditMenu_UI = new ActionFormData()
      .title("Edit Floating Text")
      .body("Select actions")
      .button("Edit text")
      .button("Teleport to me")

    ForceOpen(player, EditMenu_UI).then(res => {
      if (!res.canceled) {
        switch (res.selection) {
          case 0:
            return editFloatingText(player, floatId)

          case 1:
            player.dimension.getEntities({ type: "pao:floating_text", tags: [`fl_id:${floatId}`] })
              .forEach((e) => e.setDynamicProperty("fixedLocation", player.location))
        }
      }
    })
  }

  /**
   * @param {Player} player 
   * @param {string} floatId 
   */
  const editFloatingText = (player, floatId) => {
    const floatData = FloatingText.get(floatId)
    if (floatData.type == "text") {
      const FloatingTextAdd_UI = new ModalFormData()
        .title("Edit Floating Text")
        .textField(`Available Placeholder:\n${Object.keys(basicPlaceHolderList).map(p => `${p}: ${basicPlaceHolderList[p]}`).join("\n\n")}
      \nInput Text:`, "Input here", { defaultValue: floatData.text })

      player.sendMessage("§eClose Chat to Show UI!")
      ForceOpen(player, FloatingTextAdd_UI).then(res => {
        if (!res.canceled) {
          let [text] = res.formValues
          if (text == "") text = floatData.text
          floatData["text"] = text
          FloatingText.edit(floatId, floatData)
          return player.sendMessage("§aSuccessfully edited floating text!")
        }
      })
    } else if (floatData.type == "scoreboard") {
      let sort = ["Ascending", "Descending"]
      const FloatingTextAdd_UI = new ModalFormData()
        .title("Edit Floating Text")
        .textField(`Available Placeholder:\n${Object.keys(scoreboardPlaceHolderList).map(p => `${p}: ${scoreboardPlaceHolderList[p]}`).join("\n\n")}
          \nInput Title:`, "Input here", { defaultValue: floatData.title })
        .textField(`Input Format Text:`, "Input here", { defaultValue: floatData.format })
        .dropdown("Sort:", sort, { defaultValueIndex: sort.findIndex(s => s.toLowerCase() == floatData.sort) })
        .slider("Max List", 1, 50, { defaultValue: floatData.max, valueStep: 1 })
        .textField(`Input Objective Id:`, "Input here", { defaultValue: floatData.scoreboard })

      player.sendMessage("§eClose Chat to Show UI!")
      ForceOpen(player, FloatingTextAdd_UI).then(res => {
        if (!res.canceled) {
          let [title, format, sortType, maxList, objectiveId] = res.formValues
          if (title == "") title = floatData.title
          if (format == "") format = floatData.format
          if (objectiveId == "") objectiveId = floatData.scoreboard

          floatData.title = title
          floatData.format = format
          floatData.sort = sort[sortType].toLowerCase()
          floatData.max = maxList
          floatData.scoreboard = objectiveId

          FloatingText.edit(floatId, floatData)
          return player.sendMessage("§aSuccessfully edited floating text!")
        }
      })
    }
  }
}

export default floatingtext_edit