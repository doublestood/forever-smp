import { Dimension, DimensionTypes, system, world } from "@minecraft/server"
import { Database } from "./Database"
import Config from "../Configuration"
import getTPS from "./TickPerSecond"
import Placeholder from "./Placeholder"

const FloatingText = {}
const FloatingTextDB = new Database("floatingtextDB")

/**
 * Create Basic Text
 * @param {string} id 
 * @param {Dimension} dimension 
 * @param {{x: number, y: number, z: number}} location 
 * @param {string} text 
 */
FloatingText.createBasicText = (id, dimension, location, text) => {
  const entity = dimension.spawnEntity("pao:floating_text", location)
  entity.addTag(`fl_id:${id}`)
  entity.nameTag = "Creating..."
  entity.setDynamicProperty("fixedLocation", location)
  FloatingTextDB.set(`floatText_${id}`, { type: "text", text })
}

/**
 * Create Basic Text
 * @param {string} id 
 * @param {Dimension} dimension 
 * @param {{x: number, y: number, z: number}} location 
 * @param {string} title 
 * @param {string} format 
 * @param {string} sort
 * @param {number} max 
 * @param {string} scoreboard 
 */
FloatingText.createScoreboardText = (id, dimension, location, title, format, sort, max, scoreboard) => {
  const entity = dimension.spawnEntity("pao:floating_text", location)
  entity.addTag(`fl_id:${id}`)
  entity.nameTag = "Creating..."
  FloatingTextDB.set(`floatText_${id}`, { type: "scoreboard", title, format, sort, max, scoreboard })
}

FloatingText.edit = (id, data) => {
  FloatingTextDB.set(`floatText_${id}`, data)
}

/**
 * Remove Floating Text
 * @param {string} id 
 * @param {Dimension} dimension 
 * @param {{x: number, y: number, z: number}} location 
 * @param {string} text 
 */
FloatingText.removeText = (id) => {
  DimensionTypes.getAll().forEach((d) => {
    const dimension = world.getDimension(d.typeId)
    const floatingTextEntities = dimension.getEntities({ type: "pao:floating_text" })
    floatingTextEntities.forEach((entity) => {
      if (entity.hasTag(`fl_id:${id}`)) return entity.remove()
    })
  })
  FloatingTextDB.delete(`floatText_${id}`)
}

FloatingText.clear = () => {
  FloatingTextDB.keys().forEach(k => {
    let id = k.substring("floatText_".length)
    FloatingText.removeText(id)
  })
}

/**
 * @param {string} id 
 * @returns {{type: string}}
 */
FloatingText.get = (id) => {
  return FloatingTextDB.get(`floatText_${id}`)
}

/**
 * Get All Ids
 * @returns {string[]}
 */
FloatingText.getAllId = () => {
  return FloatingTextDB.keys().map(f => f.substring("floatText_".length))
}

/**
 * Check if has Id
 * @param {string} id 
 * @returns {boolean}
 */
FloatingText.hasId = (id) => {
  return FloatingTextDB.has(`floatText_${id}`)
}

// FloatingText.clear()
// FloatingText.createScoreboardText("test",
//   world.getDimension("overworld"),
//   new Vector(25.5, -58.00, -12.5),
//   "--TOP MONEY--",
//   "§7{Index}.§r {PlayerName}§r: FormatMoney({Score})",
//   "descending",
//   10,
//   "Money"
// )

// FloatingText.createBasicText("testbasic",
//   world.getDimension("overworld"),
//   new Vector(21.5, -58.00, -12.5),
//   "Scoreboard Test\nBy: Pao {LocaleDate}"
// )

/**
 * @param {string} text 
 * @param {string} placeholder 
 * @returns {string}
 */
const formatText = (text, placeholder) => {
  let dText = text
  for (const pH in placeholder) {
    dText = dText.replaceAll(`{${pH}}`, placeholder[pH])
  }

  let FormatMoneyRegex = /FormatMoney\((.*?)\)/g;
  let FormatMoneyResult = [...dText.matchAll(FormatMoneyRegex)];
  FormatMoneyResult.forEach(point => {
    let text = point[0]
    let target = Number(point[1]) ?? 0
    let money = target.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')

    dText = dText.replace(text, money)
  })

  let RomanNumeralRegex = /RomanNumeral\((.*?)\)/g;
  let RomanNumeralResult = [...dText.matchAll(RomanNumeralRegex)];
  RomanNumeralResult.forEach(point => {
    let text = point[0]
    let target = Number(point[1]) ?? 0

    dText = dText.replace(text, toRomanNumeral(target))
  })

  dText = dText.split(`(NEWLINE)`).join("\n")
  return dText
}

const runningEntity = {}
system.runInterval(() => {
  const DateNow = new Date()
  DateNow.setTime(Date.now() + (Config.Timezone * 3600000))
  const placeHolder = {}

  world.getAllPlayers().forEach((player) => {
    player.dimension.getEntities({
      location: player.location,
      maxDistance: 32,
      type: "pao:floating_text"
    }).filter((e) => runningEntity[e.id] == undefined)
      .forEach((entity) => {
        runningEntity[entity.id] = true

        if (!entity.getTags().find(t => t.startsWith("fl_id:"))) return
        const entityId = entity.getTags().find(t => t.startsWith("fl_id:")).split(":")[1]
        const floatData = FloatingText.get(entityId)
        if (!floatData) return
        if (floatData.type == "text") {
          let { text: floatText } = floatData
          floatText = Placeholder.Place(floatText, world)

          entity.nameTag = floatText
        } else if (floatData.type == "scoreboard") {
          let { title: floatTitle, format, sort, max: maxCount, scoreboard: scoreboardId } = floatData
          const Scoreboard = world.scoreboard.getObjective(scoreboardId)
          if (!Scoreboard) return entity.nameTag = `§cScoreboard not found.`
          let scores = Scoreboard.getScores().sort((a, b) => {
            if (sort == "ascending") return a.score - b.score
            if (sort == "descending") return b.score - a.score
          })

          const scoreList = []
          const scoreText = []
          for (const { participant, score } of scores) {
            try {
              if (participant.displayName == "commands.scoreboard.players.offlinePlayerName") continue
              const entity = participant?.getEntity()
              if (entity) scoreList.push({ name: entity.nameTag, score, player: entity })
            } catch{}
          }
          for (let i = 0; i < maxCount; i++) {
            const data = scoreList[i]
            if (!data) continue
            placeHolder["Index"] = i + 1
            placeHolder["PlayerName"] = data.name
            placeHolder["Score"] = data.score
            let field = Placeholder.Place(format, world, data.player, placeHolder)

            scoreText.push(field)
          }

          floatTitle = Placeholder.Place(floatTitle, world)
          entity.nameTag = `${floatTitle}\n${scoreText.join("\n")}`
        }
        let location = entity.getDynamicProperty("fixedLocation")
        if (!location) {
          location = entity.location
          entity.setDynamicProperty("fixedLocation", entity.location)
        }

        entity.teleport(location)

        delete runningEntity[entity.id]
      })
  })
})

export default FloatingText
export const functionPlaceHolderList = {
  "FormatMoney(number)": "Format number to Money text",
  "RomanNumeral(number)": "Format number to Roman"
}
export const basicPlaceHolderList = {
  "{TotalPlayer}": "Total Online Player",
  "{Year}": "Get Year in Real Time",
  "{Month}": "Get Month in Real Time",
  "{Date}": "Get Date in Real Time",
  "{Hours}": "Get Hour in Real Time",
  "{Minutes}": "Get Minute in Real Time",
  "{Seconds}": "Get Second in Real Time",
  "{LocaleDate}": "Get Formated Date",
  "{LocaleTime}": "Get Formated Time",
  "{WorldDay}": "Get World Day in Minecraft",
  "{TimeOfDay}": "Get Time of Day in ticks",
  "{TPS}": "Get Tick per Second server",
  "(NEWLINE)": "Create new line",
  ...functionPlaceHolderList
}
export const scoreboardPlaceHolderList = {
  ...basicPlaceHolderList,
  "{Index}": "Scoreboard Index",
  "{PlayerName}": "Player's Name",
  "{PlayerNameTag}": "Player's Name Tag",
  "{PlayerRanks}": "Player's Ranks",
  "{Score}": "Player's Score",
  ...functionPlaceHolderList
}