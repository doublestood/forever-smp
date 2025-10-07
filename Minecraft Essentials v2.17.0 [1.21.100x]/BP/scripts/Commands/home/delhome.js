const delhome = (Server) => {
  const HomeDB = Server.HomeDB

  Server.Commands.register({
    name: "delhome",
    description: "mce.command.delhome.description",
    usage: "delhome <home_name>",
    category: "Home"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.home.inputname" })
    let name = args.slice(0).join(" ")
    let playerHome = HomeDB.keys().find(h => h == `${player.name}-${name}`)
    if (playerHome != undefined) {
      await HomeDB.delete(playerHome)
      player.sendMessage({ translate: "mce.command.delhome.successfully", with: [name] })
    } else {
      player.sendMessage({ translate: "mce.command.home.unknown" })
    }
  })
}

export default delhome