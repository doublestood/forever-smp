import * as mc from "@minecraft/server"
import * as mc_ui from "@minecraft/server-ui"
import Config from "./Configuration"

import CommandBuilder from "./Modules/CommandBuilder"
import { Log, SystemLog } from "./Modules/Log"
import { Database } from "./Modules/Database"
import getTPS from "./Modules/TickPerSecond"
import Setting from "./Modules/Setting"
import Class from "./Modules/Class"
import ItemDatabase from "./Modules/ItemDatabase"
import Money from "./Modules/Money"
import Restful from "./Modules/Restful"
import EventEmitter from "./Modules/EventEmitter"
import Ranks from "./Modules/Ranks"
import FloatingText from "./Modules/FloatingText"
import ChestShop from "./Modules/ChestShop"
import { ForceOpen } from "./Modules/Forms"
import Shop from "./Modules/Data/Shop"
import Sell from "./Modules/Data/Sell"

import commandHandler from "./commandHandler"
import eventHandler from "./eventHandler"
import dev from "./Modules/devModule"
import * as system from "./Modules/system"
import Placeholder from "./Modules/Placeholder"

const Version = "2.17.0"

const log = console.log
console.log = (...args) => {
  return log(`[Minecraft Essentials v${Version}]`, ...args)
}

const warn = console.warn
console.warn = (...args) => {
  return warn(`[Minecraft Essentials v${Version}]`, ...args)
}
const error = console.error
console.error = (...args) => {
  return error(`[Minecraft Essentials v${Version} | ERROR]`, ...args)
}

class ServerClass {
  constructor() {
    this.Minecraft = mc
    this.Version = Version
    this.System = mc.system
    this.PlayerOnline = {}
    this.HomeDB = new Database("homeDB")
    this.WarpDB = new Database("warpDB")
    this.BackDB = new Database("backDB")
    this.BanDB = new Database("banDB")
    this.ReportDB = new Database("reportDB")
    this.SystemLog = SystemLog
    this.ChestShop = ChestShop
    this.Setting = Setting
    this.Money = Money
    this.TPS = getTPS
    this.world = mc.world
    this.Log = Log
    this.Ranks = Ranks
    this.FloatingText = FloatingText

    this.isLoaded = false
    this.timeStarted = Date.now()
    this.Commands = new CommandBuilder("mce")

    this.CustomCommand = new CommandBuilder("mce_customcommand") // Used for adding custom command

    Restful.listen("mce-getDB", (data) => {
      if (!data.databaseName) return { error: "InvalidDatabase" }
      const databaseVar = this[data.databaseName]
      if (typeof databaseVar != "object") return { error: "InvalidDatabase" }
      const database = {}
      databaseVar.forEach((key, value) => database[key] = value)
      return { database }
    })

    this.#initData()
    this.BetterScoreboard = { installed: false, version: null }
    system.update(this)
  }

  #initData() {
    Restful.listen("mce-installed", (data) => {
      return { installed: true, version: Version }
    })
    // Home
    Restful.listen("mce-getHome", ({ playerName, homeName }) => {
      if (!playerName || !homeName) return { error: "InvalidParams" }
      if (!this.HomeDB.has(`${playerName}-${homeName}`)) return { error: "NotFound" }
      return { home: this.HomeDB.get(`${playerName}-${homeName}`) }
    })

    Restful.listen("mce-setHome", ({ playerName, homeName, homeData }) => {
      if (!playerName || !homeName || !homeData) return { error: "InvalidParams" }
      if (this.HomeDB.has(`${playerName}-${homeName}`)) return { error: "AlreadyExists" }
      this.HomeDB.set(`${playerName}-${homeName}`, homeData)
      return { error: null }
    })

    Restful.listen("mce-delHome", ({ playerName, homeName }) => {
      if (!playerName || !homeName) return { error: "InvalidParams" }
      if (!this.HomeDB.has(`${playerName}-${homeName}`)) return { error: "NotFound" }
      this.HomeDB.delete(`${playerName}-${homeName}`)
      return { error: null }
    })

    Restful.listen("mce-getAllHome", () => {
      const Homes = {}
      this.HomeDB.forEach((key, homeData) => {
        const playerName = key.split("-")[0]
        const homeName = key.substring(playerName.length + 1)
        if (!Homes[playerName]) Homes[playerName] = {}
        Homes[playerName][homeName] = homeData
      })
      return { homes: Homes }
    })

    this.HomeDB.onSet.subscribe(data => {
      const playerName = data.key.split("-")[0]
      const homeName = data.key.substring(playerName.length + 1)
      EventEmitter.emit("mce-onHomeCreated", { playerName, homeName, homeData: data.value })
    })

    // Warp
    Restful.listen("mce-getWarp", ({ warpName }) => {
      if (!warpName) return { error: "InvalidParams" }
      if (!this.WarpDB.has(warpName)) return { error: "NotFound" }
      return { home: this.WarpDB.get(warpName) }
    })

    Restful.listen("mce-setWarp", ({ warpName, warpData }) => {
      if (!warpName || !warpData) return { error: "InvalidParams" }
      if (this.WarpDB.has(warpName)) return { error: "AlreadyExists" }
      this.WarpDB.set(warpName, warpData)
      return { error: null }
    })

    Restful.listen("mce-delWarp", ({ warpName }) => {
      if (!warpName) return { error: "InvalidParams" }
      if (!this.WarpDB.has(warpName)) return { error: "NotFound" }
      this.WarpDB.delete(warpName)
      return { error: null }
    })

    Restful.listen("mce-getAllWarp", () => {
      const Warps = {}
      this.WarpDB.forEach((warpName, warpData) => {
        Warps[warpName] = warpData
      })
      return { warps: Warps }
    })

    this.WarpDB.onSet.subscribe(data => {
      EventEmitter.emit("mce-onWarpCreated", { warpName: data.key, warpData: data.value })
    })

    // Scriptevent
    mc.system.afterEvents.scriptEventReceive.subscribe(({ id, message }) => {
      if (id == "mce:number_custom_items") {
        if (message == "") return Setting.remove("NumberOf_1_16_100_Items")
        const amount = Number(message)
        if (!Number.isSafeInteger(amount) || amount < 0) return
        Setting.set("NumberOf_1_16_100_Items", amount)
      }
    })
  }

  /**
   * Get Player by Name
   * @param {string} targetName 
   * @returns {mc.Player}
   */
  getPlayer(targetName) {
    let player = this.world.getAllPlayers().find(player => player?.isValid && player.name == targetName)
    if (player) return player
    let playerList = this.world.getAllPlayers()
      .filter(player => player?.isValid)
      .filter(player => player.name.startsWith(targetName))
      .sort((p1, p2) => p1.name.length - p2.name.length)
    return playerList[0]
  }


  /**
   * Get Dimension by String
   * @param {string} dimensionId 
   * @returns {mc.Dimension}
   */
  getDimension(dimensionId) {
    return this.world.getDimension(dimensionId)
  }

  /**
   * Get Inventory from Entity
   * @param {mc.Entity} entity 
   * @returns {mc.Container}
   */
  getInventory(entity) {
    return entity.getComponent("minecraft:inventory").container
  }

  /**
   * Run Command
   * @param {string} command 
   * @param {string} dimension 
   * @returns {mc.CommandResult}
   */
  async runCommand(command, dimension) {
    let res = this.getDimension(dimension ?? "minecraft:overworld").runCommand(command)
    return res
  }

  /**
   * Get Command Prefix
   * @returns {string}
   */
  getPrefix() {
    return this.Setting.get("commandPrefix") ?? Config.commandPrefix
  }

  /**
   * Delay Function
   * @param {number} ms 
   */
  async sleep(ms) {
    return new Promise((resolve) => {
      mc.system.runTimeout(resolve, (ms / 1000) * 20)
    })
  }

  /**
   * Teleport Player
   * @param {mc.Player} player 
   * @param {{x: number, y: number, z: number}} vector 
   * @param {mc.TeleportOptions} options
   */
  async teleportPlayer(player, vector, options) {
    await player.teleport(vector, options)
    Log(`[Teleport] ${player.name} teleported to ${Math.round(vector.x)} ${Math.round(vector.y)} ${Math.round(vector.z)}`)
  }

  /**
   * Send Server Message
   * @param {string} message
   */
  async sendMessage(message) {
    return await this.world.sendMessage(message)
  }

  async waitLoaded() {
    return new Promise((resolve) => {
      let systemId = mc.system.runInterval(() => {
        let ent = this.world.getAllPlayers()
        if (ent.length > 0) {
          this.isLoaded = true
          mc.system.clearRun(systemId)
          resolve()
        }
      }, 10)
    })
  }
}

const Server = new ServerClass()
const loadMCE = async () => {
  dev(Server)
  await commandHandler(Server)
  await eventHandler(Server)

  Server.world.getAllPlayers().forEach((player) => {
    Server.PlayerOnline[player.name] = Date.now()
  })

  Restful.request("betterscoreboard-installed").then((data) => {
    if (data?.installed) Server.BetterScoreboard = { installed: true, version: data.version }
  })
}
loadMCE()

mc.world.afterEvents.playerSpawn.subscribe(data => {
  if (!data.player || !data.player.isValid) return
  let message = Server.Setting.get("joinMessage") ?? Config.playerJoinMessage
  if (message.toLowerCase() == "none") return
  message = Placeholder.Place(message, mc.world, data.player)
  if (data.initialSpawn) data.player.sendMessage(message)
})

mc.system.beforeEvents.watchdogTerminate.subscribe(data => {
  data.cancel = true
  SystemLog(`Watchdog Terminate: ${data.terminateReason}`)
})

export default Server

// Make your command here
const { CustomCommand } = Server

CustomCommand.beforeCommandUse.subscribe(data => {
  let cmd = data.command
  let player = data.player
  if (
    !cmd ||
    (cmd.permission && !player.checkPermission(cmd.permission))
  ) {
    data.cancel = true
    return player.sendMessage({ translate: "mce.command.unknown", with: [data.inputCommand] })
  }
})

CustomCommand.afterCommandUse.subscribe(data => {
  if (data.error) {
    data.player.sendMessage(`§c${data.error}${data.error?.stack ?? ""}`)
  }
})