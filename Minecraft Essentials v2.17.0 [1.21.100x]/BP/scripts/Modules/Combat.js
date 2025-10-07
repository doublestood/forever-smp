import * as mc from "@minecraft/server"
import Config from "../Configuration"

const CombatLog = {}

const Combat = {}

/**
 * Set Combat Log
 * @param {mc.Player} player 
 * @param {mc.Player} enemy 
 */
Combat.setCombat = (player, enemy) => {
  CombatLog[player.name] = {
    time: Date.now() + (Config.combatConfig.combatTime * 1000),
    enemy: enemy.name
  }
}

/**
 * Check if Player is Combat
 * @param {string} playerName
 */
Combat.isCombat = (playerName) => {
  if (!CombatLog[playerName]) return false
  if (Date.now() > CombatLog[playerName].time) return false
  return true
}

/**
 * Get Player Enemy
 * @param {string} playerName
 * @returns {string | undefined}
 */
Combat.getCombat = (playerName) => {
  return CombatLog[playerName]?.enemy
}

export default Combat