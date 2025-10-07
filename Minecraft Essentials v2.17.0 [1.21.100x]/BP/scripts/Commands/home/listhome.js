const listhome = (Server) => {
  const HomeDB = Server.HomeDB

  Server.Commands.register({
    name: "listhome",
    description: "mce.command.listhome.description",
    usage: "listhome",
    aliases: ["homelist"],
    category: "Home"
  }, async (data, player, args) => {
    let message = []
    message.push({ translate: "mce.command.listhome.header" })
    HomeDB.forEach((key, value) => {
      if (key.startsWith(player.name)) {
        let home = value
        let hname = key.substring(`${player.name}-`.length)
        message.push({ text: `\n§e  -§a ${hname}§e ${Math.round(home.x)}, ${Math.round(home.y)}, ${Math.round(home.z)} | ${home.dimension}` })
      }
    })
    if (message.length > 1) {
      player.sendMessage(message)
    }
    else {
      player.sendMessage({ translate: "mce.command.listhome.nohome" })
    }
  })
}

export default listhome