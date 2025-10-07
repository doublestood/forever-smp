import { GameMode } from "@minecraft/server"

/**
 * @param {import("../../main").default} Server 
 */
const gamemodes = (Server) => {
  Server.Commands.register({
    name: "gmc",
    description: "Change player gamemode to Creative.",
    usage: "gmc <player_name?>",
    category: "Gamemodes",
    permission: "gamemode_creative",
    settingname: "gamemodes"
  }, async (data, player, args) => {
    let targetPlayer = args[0] != undefined ? (Server.getPlayer(args[0]) ?? player) : player

    targetPlayer.setGameMode(GameMode.Creative)
    player.sendMessage("§aSuccessfully set gamemode to creative.")
  })

  Server.Commands.register({
    name: "gms",
    description: "Change player gamemode to Survival.",
    usage: "gms <player_name?>",
    category: "Gamemodes",
    permission: "gamemode_survival",
    settingname: "gamemodes"
  }, async (data, player, args) => {
    let targetPlayer = args[0] != undefined ? (Server.getPlayer(args[0]) ?? player) : player

    targetPlayer.setGameMode(GameMode.Survival)
    player.sendMessage("§aSuccessfully set gamemode to survival.")
  })

  Server.Commands.register({
    name: "gmsp",
    description: "Change player gamemode to Spectator.",
    usage: "gmsp <player_name?>",
    category: "Gamemodes",
    permission: "gamemode_spectator",
    settingname: "gamemodes"
  }, async (data, player, args) => {
    let targetPlayer = args[0] != undefined ? (Server.getPlayer(args[0]) ?? player) : player
    
    targetPlayer.setGameMode(GameMode.Spectator)
    player.sendMessage("§aSuccessfully set gamemode to spectator.")
  })

  Server.Commands.register({
    name: "gma",
    description: "Change player gamemode to Adventure.",
    usage: "gma <player_name?>",
    category: "Gamemodes",
    permission: "gamemode_adventure",
    settingname: "gamemodes"
  }, async (data, player, args) => {
    let targetPlayer = args[0] != undefined ? (Server.getPlayer(args[0]) ?? player) : player

    targetPlayer.setGameMode(GameMode.Adventure)
    player.sendMessage("§aSuccessfully set gamemode to adventure.")
  })
}

export default gamemodes