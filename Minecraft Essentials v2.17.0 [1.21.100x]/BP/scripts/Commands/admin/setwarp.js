const setwarp = (Server) => {
  const WarpDB = Server.WarpDB

  Server.Commands.register({
    name: "setwarp",
    description: "mce.command.setwarp.description",
    usage: "setwarp <place_name>",
    permission: "warp",
    settingname: "warp",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.warp.inputname" })
    let name = args.slice(0).join(" ")
    let warp = WarpDB.get(name)
    if (warp != undefined) return player.sendMessage({ translate: "mce.command.setwarp.alreadyexists" })
    const placeObject = {
      x: player.location.x,
      y: player.location.y,
      z: player.location.z,
      dimension: player.dimension.id
    }
    await WarpDB.set(name, placeObject)
    player.sendMessage({ translate: "mce.command.setwarp.successfully", with: [name] })
  })
}

export default setwarp