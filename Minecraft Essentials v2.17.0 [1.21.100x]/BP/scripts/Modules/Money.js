import Server from "../main"
import { Database } from "./Database"
import Config from "../Configuration"
import { world, system } from "@minecraft/server"
import * as Scoreboard from "./Scoreboard"
import Restful from "./Restful"
import { BlockTypes, ItemStack, ItemTypes } from '@minecraft/server';
import EventEmitter from "./EventEmitter"

const { MoneyObjective } = Config
const MoneyStructure = {
  playerName: String.prototype,
  playerMoney: Number.prototype
}

class MoneySystem {
  #isLoaded

  constructor() {
    this.#isLoaded = false
    this.#init()
  }

  async #init() {
    // await Server.waitLoaded()
    this.MoneyDatabase = new Database("moneyDB")
    if (!Scoreboard.checkObjective(MoneyObjective)) await world.scoreboard.addObjective(MoneyObjective)
    this.#isLoaded = true

    world.afterEvents.playerSpawn.subscribe(data => {
      let player = data.player
      if (!player || !player.isValid) return
      if (data.initialSpawn) {
        let playerMoney = this.MoneyDatabase.get(player.name)
        if (playerMoney == undefined) playerMoney = this.getStarterMoney()
        this.setMoney(player.name, playerMoney)
        this.MoneyDatabase.set(player.name, playerMoney)
      }
    })

    world.beforeEvents.playerLeave.subscribe(({ player }) => {
      console.log(`${player.name} is leaving, saving money...`)
      const playerMoney = world.scoreboard.getObjective(MoneyObjective).getScore(player)
      this.MoneyDatabase.set(player.name, playerMoney)
      console.log(`${player.name}'s money is saved!`)
    })

    Scoreboard.onChanged.subscribe(MoneyObjective, (player, score) => {
      if (!player || !player.isValid) return
      this.MoneyDatabase.set(player.name, score)
      EventEmitter.emit("mce-playerMoneyChanged", { playerName: player.name, amount: score })
    })

    Restful.listen("mce-getMoney", (data) => {
      return {
        playerMoney: this.getMoney(data.playerName)
      }
    })

    Restful.listen("mce-setMoney", (data) => {
      this.setMoney(data.playerName, data.amount)
    })

    Restful.listen("mce-getAllMoney", (data) => {
      return {
        AllMoney: this.getAllMoney()
      }
    })
  }

  get MoneyObjective() {
    return MoneyObjective
  }
  /**
   * Get Starter Money
   * @returns {number}
   */
  getStarterMoney() {
    return Server.Setting.get("starterMoney") ?? Config.starterMoney
  }

  /**
   * Get Max Money
   * @returns {number}
   */
  getMaxMoney() {
    return Server.Setting.get("maxMoney") ?? Config.maxMoney
  }

  /**
   * Get Player's Money
   * @param {string} playerName
   * @returns {number}
   */
  getMoney(playerName) {
    let player = Server.getPlayer(playerName)
    let playerMoney = undefined
    if (player != undefined) {
      playerMoney = world.scoreboard.getObjective(MoneyObjective).getScore(player)
    } else {
      playerMoney = this.MoneyDatabase.get(playerName)
    }
    if (playerMoney == undefined) this.setMoney(playerName, this.getStarterMoney())
    return playerMoney ?? this.getStarterMoney()
  }

  /**
   * Set Player's Money
   * @param {string} playerName 
   * @param {number} money 
   */
  setMoney(playerName, money) {
    let player = Server.getPlayer(playerName)
    if (player != undefined) {
      player.setScore(MoneyObjective, money)
    }
    this.MoneyDatabase.set(playerName, money)
  }

  /**
   * @returns {MoneyStructure[]}
   */
  getAllMoney() {
    let Data = []
    this.MoneyDatabase.forEach((key, value) => {
      Data.push({
        playerName: key,
        playerMoney: value
      })
    })
    return Data
  }

  async resetData() {
    await this.MoneyDatabase.clear()
    await world.scoreboard.removeObjective(MoneyObjective)
    await world.scoreboard.addObjective(MoneyObjective)
    for (const player of world.getAllPlayers()) {
      player.setMoney(this.getStarterMoney())
    }
  }
}

const Money = new MoneySystem()
export default Money