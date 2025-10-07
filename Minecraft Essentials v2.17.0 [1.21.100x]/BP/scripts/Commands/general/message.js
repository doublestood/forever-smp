import Utility from "../../Modules/Utility"

/**
 * @param {import("../main").default} Server
 */
const message = (Server) => {
  let MessageHistory = {}

  Server.Commands.register({
    name: "message",
    description: "mce.command.message.description",
    usage: "message <player_name> <messsage>",
    aliases: ["msg"],
    category: "General"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.inputplayer" })
    let targetPlayer = await Server.getPlayer(args[0])
    if (!args[1]) return player.sendMessage({ translate: "mce.command.message.inputmessages" })
    let message = args.slice(1).join(" ")
    if (targetPlayer != undefined) {
      if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.message.target.self" })
      await targetPlayer.sendMessage({ translate: "mce.command.message.send.target", with: [player.name, message] })
      await player.sendMessage({ translate: "mce.command.message.send.self", with: [targetPlayer.name, message] })

      MessageHistory[targetPlayer.name] = player.name
    } else {
      return player.sendMessage({ translate: "mce.command.target.unknown" })
    }
  })

  Server.Commands.register({
    name: "reply",
    description: "mce.command.reply.description",
    aliases: ["r"],
    usage: "reply <message>",
    settingname: "message",
    category: "General"
  },
    async (data, player, args) => {
      if (!MessageHistory[player.name]) return player.sendMessage({ translate: "mce.command.reply.unknown" })
      if (!args[0]) return player.sendMessage({ translate: "mce.command.message.inputmessages" })
      let targetPlayer = await Server.getPlayer(MessageHistory[player.name])
      let message = args.slice(0).join(" ")
      if (targetPlayer != undefined) {
        if (targetPlayer == player) return player.sendMessage({ translate: "mce.command.message.target.self" })
        await targetPlayer.sendMessage({ translate: "mce.command.message.send.target", with: [player.name, message] })
        await player.sendMessage({ translate: "mce.command.message.send.self", with: [targetPlayer.name, message] })

        MessageHistory[targetPlayer.name] = player.name
      } else {
        return player.sendMessage({ translate: "mce.command.target.unknown" })
      }
    }
  )
}

export default message