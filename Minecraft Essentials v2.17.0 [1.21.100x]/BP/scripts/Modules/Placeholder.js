import { Player, World, world } from "@minecraft/server"
import Config from "../Configuration"
import getTPS from "./TickPerSecond"
import Server from "../main"

const capitalize = (string) => {
  let str = string.split(" ")
  let result = []
  for (const s of str) {
    result.push(s[0].toUpperCase() + s.slice(1))
  }

  return result.join(" ")
}

const toRomanNumeral = (num) => {
  var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = '', i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

const Placeholder = {
  /**
  * @param {any} data
  * @returns {string}
  */
  Get: (data) => {
    const DateNow = new Date()
    DateNow.setTime(Date.now() + (Config.Timezone * 3600000))

    let availablePlaceholders = {}

    if (data instanceof World) {
      const placeholders = {
        TotalPlayer: Array.from(data.getPlayers()).length,
        Year: DateNow.getFullYear(),
        Month: DateNow.getMonth() + 1,
        Date: DateNow.getDate(),
        Hours: DateNow.getHours(),
        Minutes: DateNow.getMinutes(),
        Seconds: DateNow.getSeconds(),
        LocaleDate: DateNow.toLocaleDateString(),
        LocaleTime: DateNow.toLocaleTimeString(),
        WorldDay: data.getDay(),
        TimeOfDay: data.getTimeOfDay(),
        TPS: Math.floor(getTPS()),
        Prefix: Server.getPrefix()
      }

      availablePlaceholders = { ...availablePlaceholders, ...placeholders }
    }

    if (data instanceof Player) {
      let PlayerRanks = Server.Ranks.getRanks(data).filter(r => r != Server.Ranks.DefaultRankTag && !Server.Ranks.getRank(r).hideRanks)
      if (PlayerRanks.length <= 0) PlayerRanks.push(Server.Ranks.DefaultRankTag)
      PlayerRanks = PlayerRanks.map((rank) => Server.Ranks.getRank(rank).displayName)
      .join(Config.Ranks.rankSeparator)

      const placeholders = {
        PlayerName: data.name,
        PlayerNameTag: data.nameTag,
        PlayerRanks,
        PlayerHealth: Math.round(data.getComponent("minecraft:health").currentValue),
        PlayerLevel: data.level,
        PlayerXP: data.getTotalXp(),
        PlayerPosX: Math.floor(data.location.x),
        PlayerPosY: Math.floor(data.location.y),
        PlayerPosZ: Math.floor(data.location.z),
        PlayerGamemode: capitalize(data.getGameMode()),
        PlayerDimension: capitalize(data.dimension.id.split(":")[1].replace("_", " ")),
        PlayerPlatform: data.clientSystemInfo.platformType
      }

      availablePlaceholders = { ...availablePlaceholders, ...placeholders }
    }


    return availablePlaceholders
  },
  /**
   * @param {string} text
   * @param {World | null} world
   * @param {Player | null} player
   * @returns {string}
   */
  Place: (text, world = world, player, additional = {}) => {
    let newText = text
    let availablePlaceholders = {...additional}

    const DateNow = new Date()
    DateNow.setTime(Date.now() + (Config.Timezone * 3600000))

    /* WORLD PLACEHOLDERS */
    if (world instanceof World) availablePlaceholders = { ...availablePlaceholders, ...Placeholder.Get(world) }

    /* PLAYER PLACEHOLDERS */
    if (player instanceof Player) availablePlaceholders = { ...availablePlaceholders, ...Placeholder.Get(player) }

    /* PLACING HOLDERS */
    for (const placeholder in availablePlaceholders) {
      newText = newText.replaceAll(`{${placeholder}}`, availablePlaceholders[placeholder])
    }

    /* BASIC FUNCTION */
    let FormatMoneyRegex = /FormatMoney\((.*?)\)/g;
    let FormatMoneyResult = [...newText.matchAll(FormatMoneyRegex)];
    FormatMoneyResult.forEach(point => {
      let resultText = point[0]
      let target = Number(point[1]) ?? 0
      let money = target.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')

      newText = newText.replace(resultText, money)
    })

    let RomanNumeralRegex = /RomanNumeral\((.*?)\)/g;
    let RomanNumeralResult = [...newText.matchAll(RomanNumeralRegex)];
    RomanNumeralResult.forEach(point => {
      let resultText = point[0]
      let target = Number(point[1]) ?? 0

      newText = newText.replace(resultText, toRomanNumeral(target))
    })

    return newText.split("(NEWLINE)").join("\n")
  }
}

export default Placeholder