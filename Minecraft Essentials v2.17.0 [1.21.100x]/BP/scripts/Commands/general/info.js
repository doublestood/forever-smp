import { system, world } from "@minecraft/server"
import Config from "../../Configuration"
/**
 * @param {import("../../main").default} Server
 */
const info = (Server) => {
  Server.Commands.register({
    name: "info",
    description: "mce.command.info.description",
    usage: "info",
    category: "General"
  }, async (data, player, args) => {
    player.sendMessage({ translate: Server.Setting.get("serverInfo").split("(NEWLINE)").join("\n") })
  })
}

export default info