import { world } from "@minecraft/server"

/**
 * @param {import("../../main").default} Server
 */
const spawn = (Server) => {
  const WarpDB = Server.WarpDB

  const getSpawnWarp = () => {
    return WarpDB.keys().find((w) => w.toLowerCase() == "spawn")
  }

  Server.Commands.register({
    name: "spawn",
    description: "mce.command.spawn.description",
    usage: "spawn",
    settingname: "spawn",
    category: "Warp"
  }, async (data, player, args) => {
    const spawnWarp = getSpawnWarp()
    if (spawnWarp != undefined) {
      player.runCommand(`scriptevent mce:runCommand warp "${spawnWarp}"`)
    } else {
      player.sendMessage({ translate: "mce.command.warp.unknown" })
    }
  })

  Server.Setting.set("spawnSystem", getSpawnWarp() != undefined)

  WarpDB.onSet.subscribe(() => {
    Server.Setting.set("spawnSystem", getSpawnWarp() != undefined)
  })

  WarpDB.onDelete.subscribe(() => {
    Server.Setting.set("spawnSystem", getSpawnWarp() != undefined)
  })
}

export default spawn