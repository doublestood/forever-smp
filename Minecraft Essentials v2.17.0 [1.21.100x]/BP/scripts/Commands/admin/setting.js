/**
 * @param {import("../../main").default} Server
 */
const setting = (Server) => {
  const Setting = Server.Setting
  Server.Commands.register({
    name: "setting",
    description: "mce.command.setting.description",
    usage: "setting <list | settingname> <value>",
    permission: "setting",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.setting.list", with: [Server.getPrefix()] })
    if (args[0].toLowerCase() == "list") {
      let message = []
      message.push({ translate: "mce.command.setting.list.header" })
      Object.keys(Setting.List).forEach(name => {
        message.push({ text: `\n §e - §a${name} §e| ` })
        let valueType = Setting.List[name][0]
        let desc = Setting.List[name][1]
        message.push({ text: `${name} ` })
        if (valueType == Setting.Type.TRUEFALSE) {
          message.push({ text: `<value: true/false>` })
        } else if (valueType == Setting.Type.CUSTOMNUM) {
          message.push({ text: `<value: number>` })
        } else if (valueType == Setting.Type.CUSTOMSTR) {
          message.push({ text: `<value: string>` })
        } else {
          message.push({ text: `<value>` })
        }
        message.push({ text: ` (` })
        message.push({ translate: desc })
        message.push({ translate: `)` })
      })
      return player.sendMessage(message)
    }
    let selectedName = Object.keys(Setting.List).find(s => s.toLowerCase() == args[0].toLowerCase())
    if (selectedName == undefined) return player.sendMessage({ translate: "mce.command.setting.list", with: [Server.getPrefix()] })
    let selectedType = Setting.List[selectedName][0]
    if (!args[1]) return player.sendMessage({ translate: "mce.command.setting.inputvalue" })
    let value = args[1]
    switch (selectedType) {
      case Setting.Type.TRUEFALSE:
        if (value != "true" && value != "false") return player.sendMessage({ translate: "mce.command.setting.inputboolean" })
        await Setting.set(selectedName, value == "true")
        Server.Log(`[Setting] ${player.name} changed ${selectedName} setting.`)
        player.sendMessage({ translate: "mce.command.setting.set.successfully" })
        break;
      case Setting.Type.CUSTOMSTR:
        if (selectedName == "commandPrefix" && value.startsWith("/")) return player.sendMessage({ translate: "mce.command.setting.commandPrefix.slash" })
        await Setting.set(selectedName, args.slice(1).join(" "))
        Server.Log(`[Setting] ${player.name} changed ${selectedName} setting.`)
        player.sendMessage({ translate: "mce.command.setting.set.successfully" })
        break;
      case Setting.Type.CUSTOMNUM:
        value = Number(value)
        if (Number.isNaN(value))
          return player.sendMessage({ rawtext: [{ text: `§c${selectedName} | ` }, { translate: "mce.command.setting.inputnumber" }] })

        if (value < 0) {
          const notAllowed = [
            "maxMoney", "homeLimit"
          ]
          if (notAllowed.includes(selectedName))
            return player.sendMessage({ rawtext: [{ text: `§c${selectedName} | ` }, { translate: "mce.command.setting.number.inputmorethanone" }] })
        }
        if (!Number.isFinite(value)) {
          const notAllowed = [
            "starterMoney"
          ]

          if (notAllowed.includes(selectedName))
            return player.sendMessage({ rawtext: [{ text: `§c${selectedName} | ` }, { translate: "mce.command.setting.number.infinity" }] })
        }
        await Setting.set(selectedName, value)
        Server.Log(`[Setting] ${player.name} changed ${selectedName} setting.`)
        player.sendMessage({ translate: "mce.command.setting.set.successfully" })
        break;
      default:
        player.sendMessage({ translate: "mce.command.setting.value.unknown" })
    }
  })
}

export default setting