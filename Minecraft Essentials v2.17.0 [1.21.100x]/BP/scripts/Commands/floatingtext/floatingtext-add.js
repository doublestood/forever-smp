import { ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import FloatingText, { basicPlaceHolderList, scoreboardPlaceHolderList } from "../../Modules/FloatingText"
import { world } from "@minecraft/server"

/**
 * @param {import("../../main").default} Server 
 */
const floatingtext_add = (Server) => {
  Server.Commands.register({
    name: "floatingtext-add",
    description: "Add Floating Text",
    usage: "floatingtext-add <type: text/scoreboard>",
    permission: "floatingtext",
    aliases: ["ft-add"],
    category: "Floating Text"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage("§cInput floating text type (text/scoreboard).")
    const type = args[0].toLowerCase()
    const blockLocation = player.getBlockFromViewDirection()?.block
    if (type == "text") {
      let location = ["My Location"]
      if (blockLocation) location.push("Block Location")
      const FloatingTextAdd_UI = new ModalFormData()
        .title("Floating Text")
        .textField(`Available Placeholder:\n${Object.keys(basicPlaceHolderList).map(p => `${p}: ${basicPlaceHolderList[p]}`).join("\n\n")}
      \nInput Id:`, "Input here")
        .textField(`Input Text:`, "Input here")
        .dropdown("Location on:", location)

      player.sendMessage("§eClose Chat to Show UI!")
      ForceOpen(player, FloatingTextAdd_UI).then(res => {
        if (!res.canceled) {
          let [id, text, locationType] = res.formValues
          if (id == "" || text == "") return player.sendMessage({ translate: "mce.command.shopsetting.formincomplete" })
          let location = player.location
          if (locationType == 1) location = { x: blockLocation.location.x + 0.5, y: blockLocation.location.y, z: blockLocation.location.z + 0.5 }

          FloatingText.createBasicText(id, player.dimension, location, text)
          return player.sendMessage("§aSuccessfully created floating text!")
        }
      })
    } else if (type == "scoreboard") {
      let location = ["My Location"]
      if (blockLocation) location.push("Block Location")
      let sort = ["Ascending", "Descending"]
      const objectiveList = world.scoreboard.getObjectives().map(o => o.id)
      const FloatingTextAdd_UI = new ModalFormData()
        .title("Floating Text")
        .textField(`Available Placeholder:\n${Object.keys(scoreboardPlaceHolderList).map(p => `${p}: ${scoreboardPlaceHolderList[p]}`).join("\n\n")}
      \nInput Id:`, "Input here")
        .textField(`Input Title:`, "Input here")
        .textField(`Input Format Text:`, "Input here", {defaultValue: "§7{Index}.§r {PlayerName}§r: {Score}"})
        .dropdown("Sort:", sort)
        .slider("Max List", 1, 50, {defaultValue: 10, valueStep: 1})
        .dropdown("Select Objective", objectiveList)
        // .textField(`Input Objective Id:`, "Input here")
        .dropdown("Location on:", location)

      player.sendMessage("§eClose Chat to Show UI!")
      ForceOpen(player, FloatingTextAdd_UI).then(res => {
        if (!res.canceled) {
          let [id, title, format, sortType, maxList, objectiveIndex, locationType] = res.formValues
          const objectiveId = objectiveList[objectiveIndex]
          if (id == "" || title == "" || format == "" || objectiveId == "")
            return player.sendMessage({ translate: "mce.command.shopsetting.formincomplete" })
          let location = player.location
          if (locationType == 1) location = { x: blockLocation.location.x + 0.5, y: blockLocation.location.y, z: blockLocation.location.z + 0.5 }

          FloatingText.createScoreboardText(id,
            player.dimension,
            location,
            title,
            format,
            sort[sortType].toLowerCase(),
            maxList,
            objectiveId
          )
          return player.sendMessage("§aSuccessfully created floating text!")
        }
      })
    } else {
      return player.sendMessage("§cInput floating text type (text/scoreboard).")
    }
  })
}

export default floatingtext_add