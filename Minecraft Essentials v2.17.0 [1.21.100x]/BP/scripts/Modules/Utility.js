import * as mc from "@minecraft/server"
import Config from "../Configuration"
import Server from "../main"
const Utility = {}

const ExtractResult = {
  name: "",
  string: ""
}
/**
 * Extract Name from String
 * @param {string} string 
 * @param {number} index 
 * @returns {ExtractResult}
 */
Utility.ExtractNameFromString = async (string, index) => {
  return new Promise((resolve, reject) => {
    let splitText = string.split(" ")
    let result = {
      name: "",
      string: ""
    }
    if (splitText[index].startsWith(`"`)) {
      result.name += splitText[index]
      let trimed = 1
      if (!splitText[index].endsWith(`"`)) {
        for (let i = index + 1; i <= splitText.length - 1; i++) {
          result.name += " " + splitText[i]
          trimed += 1
          if (splitText[i].endsWith(`"`)) break;
        }
      }
      if (!result.name.endsWith(`"`)) { resolve() }
      result.name = result.name.replaceAll(`"`, "")
      splitText.splice(index, trimed)
      result.string = splitText.join(" ")
    } else {
      result.name = splitText[index]
      splitText.splice(index, 1)
      result.string = splitText.join(" ")
    }
    resolve(result)
  })
}

/**
 * Get Item name from ItemStack
 * @param {mc.ItemStack} item 
 * @returns {string}
 */
Utility.getItemname = (item) => {
  return item.nameTag ? "§o" + item.nameTag : item.typeId.split(":")[1].split('_').map(v => v[0].toUpperCase() + v.slice(1).toLowerCase()).join(" ")
}

/**
 * Capitalized String
 * @param {string} string 
 * @returns {string}
 */
Utility.capitalized = (string) => {
  return string.split('_').map(v => v[0].toUpperCase() + v.slice(1).toLowerCase()).join(" ")
}

/**
 * Format Money
 * @param {number} money 
 * @param {boolean} withPrefix 
 * @returns {string}
 */
Utility.formatMoney = (money, withPrefix = true) => {
  const currencyPrefix = Server.Setting.get("currencyPrefix") ?? Config.currencyPrefix
  return `${withPrefix ? currencyPrefix : ""}${money.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`
}

// Author: GlitchyTurtle32 <https://github.com/GlitchyTurtle>
// Project: https://github.com/JaylyDev/ScriptAPI
/**
 * @param {number} num
 */
Utility.toRomanNumeral = (num) => {
  var lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }, roman = '', i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

Utility.compareString = (a, b) => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

/**
 * Generate Random String
 * @param {number} length
 * @returns {string}
 */
Utility.generateRandomString = (length) => {
  if (!length) length = Math.floor(Math.random() * (10 - 8 + 1)) + 8;
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }

  return id
}

/**
 * Enchat to Text
 * @param {mc.Enchantment} enchant 
 * @returns {string}
 */
Utility.enchantToText = (enchant) => {
  let level = Utility.toRomanNumeral(enchant.level)
  let type = enchant.type.id

  let text = ""
  switch (type) {
    case "binding":
      text += "§cCurse of Binding"
      break

    case "vanishing":
      text += "§cCurse of Vanishing"
      break

    default:
      text += `§7${Utility.capitalized(type)}`
      break
  }
  text += ` ${level}`
  return text
}

/**
 * Random number
 * @param {Number} min 
 * @param {Number} max 
 * @returns {Number}
 */
Utility.random = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Convert Time format from String to Miliseconds
 * @param {string} text
 * @example Utiliy.convertTextToMilliseconds("1d12h30m30s")
 * @returns {number}
 */
Utility.convertTextToMilliseconds = (text) => {
  const timeFactors = {
    'y': 365 * 24 * 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'h': 60 * 60 * 1000,
    'm': 60 * 1000,
    's': 1000
  };

  const pattern = /(\d+)([dhms])/g;
  let match;
  let totalMilliseconds = 0;

  while ((match = pattern.exec(text)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];

    if (timeFactors.hasOwnProperty(unit)) {
      totalMilliseconds += value * timeFactors[unit];
    }
  }

  return totalMilliseconds;
}

/**
 * @param {number} time
 * @returns {string}
 */
Utility.formatTextFutureDate = (time) => {
  const DateNow = Date.now()
  const DateTarget = time
  const CalculatedDate = Math.ceil((DateTarget - DateNow) / 1000);
  if (CalculatedDate < 1) return `§e0 §aseconds`
  let message = ""
  if (CalculatedDate >= 86400) {
    let day = Math.floor(CalculatedDate / 86400)
    message += `§e${day} §adays, `
  }
  if (CalculatedDate >= 3600) {
    let hour = Math.floor(CalculatedDate / 3600)
    message += `§e${hour % 24} §ahours, `
  }
  if (CalculatedDate >= 60) {
    let minute = Math.floor(CalculatedDate / 60)
    message += `§e${minute % 60} §aminutes, `
  }
  let second = CalculatedDate
  message += `§e${second % 60} §aseconds`
  return message
}

/**
 * Calculate all number in array
 * @param {number[]} array 
 * @returns {number}
 */
Utility.MathSum = (array) => {
  let total = 0
  for (const number of array) total += number; 

  return total
}

/**
 * Calculate all number in array
 * @param {number[]} array 
 * @returns {number}
 */
Utility.CalculateAverage = (array) => {
  return Utility.MathSum(array) / array.length
}



/**
 * Formats the input text with the given color codes, applying one color per word.
 * @param {string} text - The text to be colored.
 * @param {string} colorFormat - The color format string.
 * @returns {string} - The formatted text with colors.
 */
Utility.formatColor = (text, colorFormat) => {
  const colorCodes = colorFormat.match(/§./g);
  if (!colorCodes) return text; // Return text as is if no color codes found

  const words = text.split(' ');
  let formattedText = '';
  let colorIndex = 0;

  for (let i = 0; i < words.length; i++) {
      formattedText += colorCodes[colorIndex] + words[i];
      if (i < words.length - 1) {
          formattedText += ' '; // Add space between words
      }
      colorIndex = (colorIndex + 1) % colorCodes.length; // Cycle through color codes
  }

  return formattedText;
}

export default Utility