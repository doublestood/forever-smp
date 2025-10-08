const listwarp = (Server) => {
  const WarpDB = Server.WarpDB

  Server.Commands.register({
    name: "listwarp",
    description: "mce.command.listwarp.description",
    usage: "listwarp",
    settingname: "warp",
    category: "Warp"
  }, async (data, player, args) => {
    let message = []
    message.push({ translate: "mce.command.listwarp.header" })
    WarpDB.forEach((key, value) => {
      let placeName = key
      message.push({ text: `\n§e  -§a ${placeName}` })
    })
    if (message.length > 1) {
      player.sendMessage({ rawtext: message })
    }
    else {
      player.sendMessage({ translate: "mce.command.listwarp.nowarp" })
    }
  })
}

export default listwarp