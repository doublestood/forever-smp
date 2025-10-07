import Config from "../Configuration";
import { Database } from "./Database";
import EventEmitter from "./EventEmitter";
import Restful from "./Restful";

const SettingDatabase = new Database("settingDB")
const Old_ConfigurationDatabase = new Database("oldConfigurationDB")

const SettingType = {
  TRUEFALSE: 0,
  CUSTOMSTR: 1,
  CUSTOMNUM: 2
}

let SettingList = {
  "moneySystem": [SettingType.TRUEFALSE, "mce.command.setting.moneySystem.description"],
  "homeSystem": [SettingType.TRUEFALSE, "mce.command.setting.homeSystem.description"],
  "tpaSystem": [SettingType.TRUEFALSE, "mce.command.setting.tpaSystem.description"],
  "warpSystem": [SettingType.TRUEFALSE, "mce.command.setting.warpSystem.description"],
  "backSystem": [SettingType.TRUEFALSE, "mce.command.setting.backSystem.description"],
  "rtpSystem": [SettingType.TRUEFALSE, "mce.command.setting.rtpSystem.description"],
  "shopSystem": [SettingType.TRUEFALSE, "mce.command.setting.shopSystem.description"],
  "sellSystem": [SettingType.TRUEFALSE, "mce.command.setting.sellSystem.description"],
  "auctionSystem": [SettingType.TRUEFALSE, "mce.command.setting.auctionSystem.description"],
  "withdrawSystem": [SettingType.TRUEFALSE, "mce.command.setting.withdrawSystem.description"],
  "messageSystem": [SettingType.TRUEFALSE, "mce.command.setting.messageSystem.description"],
  "combatSystem": [SettingType.TRUEFALSE, "mce.command.setting.combatSystem.description"],
  "landSystem": [SettingType.TRUEFALSE, "mce.command.setting.landSystem.description"],
  "starterMoney": [SettingType.CUSTOMNUM, "mce.command.setting.starterMoney.description"],
  "maxMoney": [SettingType.CUSTOMNUM, "mce.command.setting.maxMoney.description"],
  // "homeLimit": [SettingType.CUSTOMNUM, "mce.command.setting.homeLimit.description"],
  // "backCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.backCooldown.description"],
  // "tpaCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.tpaCooldown.description"],
  // "homeCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.homeCooldown.description"],
  // "warpCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.warpCooldown.description"],
  // "rtpCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.rtpCooldown.description"],
  // "chatCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.chatCooldown.description"],
  "commandPrefix": [SettingType.CUSTOMSTR, "mce.command.setting.commandPrefix.description"],
  "currencyPrefix": [SettingType.CUSTOMSTR, "mce.command.setting.currencyPrefix.description"],
  "earnMoneyfromMobs": [SettingType.TRUEFALSE, "mce.command.setting.earnMoneyfromMobs.description"],
  // "backCountdown": [SettingType.CUSTOMNUM, "mce.command.setting.backCountdown.description"],
  // "tpaCountdown": [SettingType.CUSTOMNUM, "mce.command.setting.tpaCountdown.description"],
  // "homeCountdown": [SettingType.CUSTOMNUM, "mce.command.setting.homeCountdown.description"],
  // "warpCountdown": [SettingType.CUSTOMNUM, "mce.command.setting.warpCountdown.description"],
  // "rtpCountdown": [SettingType.CUSTOMNUM, "mce.command.setting.rtpCountdown.description"],
  // "commandCooldown": [SettingType.CUSTOMNUM, "mce.command.setting.commandCooldown.description"],
  "RTPRange": [SettingType.CUSTOMNUM, "mce.command.setting.RTPRange.description"],
  "tpaSystemWithUI": [SettingType.TRUEFALSE, "mce.command.setting.tpaSystemWithUI.description"],
  // "backCost": [SettingType.CUSTOMNUM, "mce.command.setting.backCost.description"],
  // "tpaCost": [SettingType.CUSTOMNUM, "mce.command.setting.tpaCost.description"],
  // "homeCost": [SettingType.CUSTOMNUM, "mce.command.setting.homeCost.description"],
  // "warpCost": [SettingType.CUSTOMNUM, "mce.command.setting.warpCost.description"],
  // "rtpCost": [SettingType.CUSTOMNUM, "mce.command.setting.rtpCost.description"],
  "serverInfo": [SettingType.CUSTOMSTR, "mce.command.setting.serverInfo.description"],
  "joinMessage": [SettingType.CUSTOMSTR, "mce.command.setting.joinMessage.description"],
  "showRankOnMessage": [SettingType.TRUEFALSE, "mce.command.setting.showRankOnMessage.description"],
  "showRankOnNameTag": [SettingType.TRUEFALSE, "mce.command.setting.showRankOnNameTag.description"],
  "notifyEarnMoneyInChat": [SettingType.TRUEFALSE, "mce.command.setting.notifyEarnMoneyInChat.description"],
}

Restful.listen("mce-registerSetting", (data) => {
  const { settingName, valueType, settingDescription } = data
  if (!settingName || !valueType || !settingDescription) return { error: "InvalidParameter" }
  let value = SettingType[valueType]
  if (value == undefined) return { error: "InvalidValueType" }
  SettingList[settingName] = [value, settingDescription]
  return { error: false }
})

/**
 * MCE Setting
 */
class Setting {
  constructor() {
    this.SettingData = new Map()
    this.Type = SettingType
    this.List = SettingList
    SettingDatabase.forEach((settingName, value) => this.SettingData.set(settingName, value))

    Restful.listen("mce-getSetting", (data) => {
      const { settingName } = data
      if (!SettingList[settingName]) return { error: "InvalidSetting" }
      return {
        value: this.get(settingName) ?? Config[settingName]
      }
    })

    Restful.listen("mce-setSetting", (data) => {
      const { settingName, value } = data
      const setting = SettingList[settingName]
      if (!setting) return { error: "InvalidSetting" }
      const valueType = setting[0]
      
      if (valueType == 0 && typeof value != "boolean") return { error: "InvalidValueType" }
      if (valueType == 1 && typeof value != "string") return { error: "InvalidValueType" }
      if (valueType == 2 && typeof value != "number") return { error: "InvalidValueType" }
      this.set(settingName, value)
      return {
        error: false
      }
    })

    Restful.listen("mce-getAllSetting", (data) => {
      let settings = []
      SettingDatabase.forEach((settingName, value) => settings.push({ settingName, value }))
      return { settings }
    })

    // Checking Old Data
    for (const [key, value] of Object.entries(Config)) {
      if (typeof value === "object") continue
      const oldConfig = Old_ConfigurationDatabase.get(key)
      if (value == undefined || oldConfig == undefined) continue
      if (oldConfig != value) {
        this.set(key, value)
      }
      // console.warn(key, typeof key)
      // console.warn(value, typeof value)
      if (value != undefined) Old_ConfigurationDatabase.set(key, value)
    }
  }

  /**
   * Get Setting
   * @param {string} settingName 
   * @returns {any}
   */
  get(settingName) {
    return this.SettingData.get(settingName) ?? Config[settingName]
  }

  /**
   * Set Setting
   * @param {string} settingName 
   * @param {any} value 
   */
  set(settingName, value) {
    SettingDatabase.set(settingName, value)
    this.SettingData.set(settingName, value)
    EventEmitter.emit("mce-settingChanged", { settingName, value })
  }

  remove(settingName) {
    SettingDatabase.delete(settingName)
    this.SettingData.delete(settingName)
    EventEmitter.emit("mce-settingChanged", { settingName, value: this.get(settingName) })
  }

  async resetAll() {
    await this.SettingData.clear()
    await SettingDatabase.clear()
  }
}

export default new Setting()