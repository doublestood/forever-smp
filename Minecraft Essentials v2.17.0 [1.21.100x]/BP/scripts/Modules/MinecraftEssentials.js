import Restful from "./Restful"
import EventEmitter from "./EventEmitter"
import { world } from "@minecraft/server"

const Overworld = world.getDimension("overworld")
const Setting = {}

Setting.register = async (settingName, valueType, settingDescription) => {
  if (!settingName || !valueType || !settingDescription) throw new TypeError("Incorrect params!")
  const data = await Restful.request("mce-registerSetting", { settingDescription, valueType, settingDescription })
  if (data.error) throw new Error(data.error)
  return data
}

Setting.get = async (settingName) => {
  if (!settingName || typeof settingName != "string") throw new TypeError("Incorrect params!")
  const data = await Restful.request("mce-getSetting", { settingName })
  if (data.error) throw new Error(data.error)
  return data.value
}

Setting.set = async (settingName, value) => {
  if (!settingName || !value || typeof settingName != "string") throw new TypeError("Incorrect params!")
  const data = await Restful.request("mce-setSetting", { settingName, value })
  if (data.error) throw new Error(data.error)
  return data
}

Setting.getAll = async () => {
  const data = await Restful.request("mce-getAllSetting")
  return data.settings
}

Setting.onChanged = {}

Setting.onChanged.subscribe = (callback) => {
  return EventEmitter.on("mce-settingChanged", callback)
}

Setting.onChanged.unsubscribe = (listener) => {
  EventEmitter.removeListener(listener)
}

const Log = {}
Log.sendSytemLog = async (message) => {
  if (!message) throw new TypeError("Invalid messages!")
  return await Restful.request("mce-sendSystemLog", { message })
}

Log.sendLog = async (message) => {
  if (!message) throw new TypeError("Invalid messages!")
  return await Restful.request("mce-sendLog", { message })
}

Log.clearLog = async () => {
  if (!message) throw new TypeError("Invalid messages!")
  return await Restful.request("mce-clearLog")
}

const Money = {}
const MoneyData = new Map()

Money.get = async (playerName) => {
  if (!playerName) throw new TypeError("Invalid player name!")
  if (MoneyData.has(playerName)) return MoneyData.get(playerName)
  const data = await Restful.request("mce-getMoney", { playerName })
  MoneyData.set(playerName, data.playerMoney)
  return data.playerMoney
}

Money.set = async (playerName, amount) => {
  if (!playerName) throw new TypeError("Invalid player name!")
  if (!amount) throw new TypeError("Invalid amount!")
  await Restful.request("mce-getMoney", { playerName, amount })
}

Money.getAll = async () => {
  const data = await Restful.request("mce-getAllMoney")
  return data.AllMoney
}

EventEmitter.on("mce-playerMoneyChanged", (data) => {
  MoneyData.set(data.playerName, data.amount)
})

const Database = {}

Database.load = async (databaseName) => {
  const data = await Restful.request("mce-getDB", { databaseName })
  const { database } = data
  const databaseMap = new Map(Object.entries(database))
  return databaseMap
}

const Home = {}

Home.get = async (playerName, homeName) => {
  const data = await Restful.request("mce-getHome", { playerName, homeName })
  return data.home
}

Home.set = async (playerName, homeName, homeData) => {
  return await Restful.request("mce-setHome", { playerName, homeName, homeData })
}

Home.delete = async (playerName, homeName) => {
  return await Restful.request("mce-delHome", { playerName, homeName })
}

Home.getAll = async () => {
  const data = await Restful.request("mce-getAllHome")
  return data.homes
}

Home.onCreated = {}
Home.onCreated.subscribe = (callback) => {
  return EventEmitter.on("mce-onHomeCreated", callback)
}

Home.onCreated.unsubscribe = (listener) => {
  EventEmitter.removeListener(listener)
}

const Warp = {}

Warp.get = async (warpName) => {
  const data = await Restful.request("mce-getWarp", { warpName })
  return data.home
}

Warp.set = async (warpName, warpData) => {
  return await Restful.request("mce-setWarp", { warpName, warpData })
}

Warp.delete = async (warpName) => {
  return await Restful.request("mce-delWarp", { warpName })
}

Warp.getAll = async () => {
  const data = await Restful.request("mce-getAllWarp")
  return data.warps
}

Warp.onCreated = {}
Warp.onCreated.subscribe = (callback) => {
  return EventEmitter.on("mce-onWarpCreated", callback)
}

Warp.onCreated.unsubscribe = (listener) => {
  EventEmitter.removeListener(listener)
}

const runCommand = async (player, command) => {
  return player.runCommand(`scriptevent cc:runCommand ${command}`)
}

export { Setting, Log, Money, Database, Home, Warp, runCommand }