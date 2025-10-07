import Config from "../../Configuration"
import Utility from "../../Modules/Utility"

/**
 * @param {import("../main").default} Server
 */
const help = (Server) => {
  Server.Commands.register({
    name: "help",
    description: "mce.command.help.description",
    usage: "help <command_name?>",
    category: "General"
  }, async (data, player, args) => {
    if (!args[0]) {
      const commandList = Server.Commands.getAllRegistation()
      let commandCategory = []
      for (const command of commandList) {
        if (!commandCategory.includes(command.category)) commandCategory.push(command.category)
      }
      commandCategory = commandCategory.sort((a, b) => Utility.compareString(a, b))
      let helpMessage = []
      helpMessage.push({ translate: "mce.command.help.commandlist.header" })
      for (const category of commandCategory) {
        // if (category == "Admin" && !player.hasTag("admin")) continue;
        if ((Server.Setting.get(`${category.toLowerCase()}System`) ?? true) == false) continue;
        let commands = commandList
          .filter(c => c.category == category)
          .filter(c => !player.hasTag(`disablecommand:${c.name}`))
          .filter(c => c.permission ? player.checkPermission(c.permission) : true)
          .filter(c => {
            if (c.id == "mce") {
              return (Server.Setting.get(`${c.settingname}System`) ?? Config.Commands[c.category.toLowerCase()][c.settingname] ?? Config.Commands[c.category.toLowerCase()][c.name]) == true
            } else {
              return true
            }
          })
        if (commands.length <= 0) continue;
        helpMessage.push({ text: `\n ` }, { translate: "mce.command.help.commandlist.category", with: [category] })
        for (const command of commands) {
          const commandName = Server.getPrefix() + command.name
          const commandUsage = Server.getPrefix() + command.usage
          helpMessage.push(
            { text: `\n ` },
            { translate: "mce.command.help.commandlist.command", with: { rawtext: [{ text: commandName }, { text: commandUsage }, { translate: command.description }] } })
        }
      }
      player.sendMessage({ rawtext: helpMessage })
    } else {
      const commandName = args[0]
      let command = Server.Commands.getAllRegistation().find(c => c.name == commandName || c.aliases?.includes(commandName))
      if (!command)
        return player.sendMessage({ translate: "mce.command.unknown", with: [commandName] }) 
      if (command.id == "mce" && (Server.Setting.get(`${command.settingname}System`) ?? Config.Commands[command.category.toLowerCase()][command.settingname]) == false)
        return player.sendMessage({ translate: "mce.command.unknown", with: [commandName] }) 
      if (player.hasTag(`disablecommand:${command.name}`))
        return player.sendMessage({ translate: "mce.command.unknown", with: [commandName] }) 
      if (command.admin && !player.hasTag("admin"))
        return player.sendMessage({ translate: "mce.command.unknown", with: [commandName] }) 

      let helpMessage = []
      helpMessage.push({ translate: "mce.command.help.command.name", with: [command.name[0].toUpperCase() + command.name.substring(1)] })
      helpMessage.push({ text: `\n` })
      helpMessage.push({ translate: "mce.command.help.command.usage", with: [`${Server.getPrefix()}${command.usage || command.name}`] })
      helpMessage.push({ text: `\n` })
      helpMessage.push({ translate: "mce.command.help.command.description", with: { rawtext: [{ translate: command.description }] } })
      if (command.aliases) {
        helpMessage.push({ text: `\n` })
        helpMessage.push({ translate: "mce.command.help.command.aliases", with: [command.aliases.join(", ")] })
      }
      return player.sendMessage(helpMessage)
    }
  })
}

export default help