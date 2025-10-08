import Config from "../../Configuration"

const sethome = (Server) => {
  const HomeDB = Server.HomeDB

  Server.Commands.register({
    name: "sethome",
    description: "mce.command.sethome.description",
    usage: "sethome <home_name>",
    category: "Home"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.home.inputname" })
    let homeCount = HomeDB.keys().filter(t => t.startsWith(player.name)).length
    if (!player.hasTag("admin") && homeCount >= player.getPermission("home.limit"))
      return player.sendMessage({ translate: "mce.command.sethome.maxhome" })
    let name = args.slice(0).join(" ")
    let playerHome = HomeDB.keys().find(key => key == `${player.name}-${name}`)
    if (playerHome != undefined) return player.sendMessage({ translate: "mce.command.sethome.alreadyexists" })
    const homeObject = {
      x: player.location.x,
      y: player.location.y,
      z: player.location.z,
      dimension: player.dimension.id
    }
    await HomeDB.set(`${player.name}-${name}`, homeObject)
    player.sendMessage({ translate: "mce.command.sethome.successfully", with: [name] })
  })
}

export default sethome