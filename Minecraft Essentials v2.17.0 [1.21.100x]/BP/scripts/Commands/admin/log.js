import {
  MessageFormData
} from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms"
import { ClearLog, Log, LogData } from "../../Modules/Log"

const log = (Server) => {
  Server.Commands.register({
    name: "log",
    description: "mce.command.log.description",
    usage: "log",
    aliases: ["logs"],
    permission: "log",
    category: "Admin"
  }, async (data, player, args) => {
    let logData = [...LogData].reverse()
    logData.splice(0, 1)
    const logText = []
    logData.forEach(l => {
      if (typeof l == "object") {
        logText.push({ text: "§r" })
        logText.push(l)
      } else {
        logText.push({ text: "§r" })
        logText.push({ translate: l })
      }
      logText.push({ text: "\n" })
    })
    // console.warn(JSON.stringify(logText))
    const logForm = new MessageFormData()
      .title({ translate: "mce.ui.logs.title" })
      .body({ rawtext: logText })
      .button2({ translate: "mce.ui.logs.clear" })
      .button1({ translate: "mce.ui.logs.close" })
  
    player.sendMessage({ translate: "mce.ui.closechat" })
    let res = await ForceOpen(player, logForm)
    if (!res.canceled) {
      if (res.selection == 1) {
        ClearLog()
        Log(`[Logs] ${player.name} cleared logs`)
        return player.sendMessage({ translate: "mce.command.logs.clear" })
      }
    }
  })
}

export default log