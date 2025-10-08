const delwarp = (Server) => {
  const WarpDB = Server.WarpDB

  Server.Commands.register({
    name: "delwarp",
    description: "mce.command.warp.description",
    usage: "delwarp <place_name>",
    permission: "warp",
    settingname: "warp",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.warp.inputname" })
    let name = args.slice(0).join(" ")
    let warp = WarpDB.get(name)
    if (warp == undefined) return player.sendMessage({ translate: "mce.command.warp.unknown" })
    await WarpDB.delete(name)
    player.sendMessage({ translate: "mce.command.delwarp.successfully", with: [name] })
  })
}

export default delwarp