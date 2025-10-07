const tpasetting = (Server) => {
  Server.Commands.register({
    name: "tpasetting",
    description: "mce.command.tpasetting.description",
    usage: "tpasetting <on/off>",
    category: "TPA"
  }, async (data, player, args) => {
    if (!args[0]) {
      if (player.noTPA()) return player.sendMessage({ translate: "mce.command.tpasetting.current.disabled" })
      return player.sendMessage({ translate: "mce.command.tpasetting.current.enabled" })
    }
    args[0] = args[0].toLowerCase()
    if (args[0] != "on" && args[0] != "off") return player.sendMessage({ translate: "mce.command.tpasetting.input.unknown" })
    let prevSet = player.getTags().find(t => t.startsWith("tpasetting"))
    if (prevSet) {
      player.removeTag(prevSet)
    }
    player.addTag("tpasetting:" + args[0])
    player.sendMessage({ translate: "mce.command.tpasetting.changed", with: [args[0]] })
  })
}

export default tpasetting