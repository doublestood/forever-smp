import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import Server from "../main"
import { getScore, setScore } from "./Scoreboard"
import Combat from "../Modules/Combat"
import Config from "../Configuration"
import Land from "./Land"
import Ranks from "./Ranks"

const Class = () => { }

// PLAYER
Object.assign(mc.Player.prototype, {
  /**
   * Check if Player is admin
   * @returns {boolean}
   */
  isAdmin() {
    if (Config.AdminList.includes(this.name)) return true
    return this.checkTag("admin") != undefined
  },
  /**
   * Check if Player turn Off TPA
   * @returns {boolean}
   */
  noTPA() {
    let tag = this.getTags().find(t => t.startsWith("tpasetting"))
    if (tag == undefined) {
      return false
    }
    let set = tag.substring("tpasetting:".length).toLowerCase()
    if (set == "off") return true
    return false
  },

  /**
   * Get Player Inventory
   * @returns {mc.Container}
   */
  getInvetory() {
    return Server.getInventory(this)
  },

  /**
   * Get Item amount in Inventory
   * @param {string} typeId 
   * @returns {number}
   */
  getItemAmount(typeId) {
    let amount = 0
    let inventory = this.getInvetory()
    for (let i = 0; i < inventory.size; i++) {
      let item = inventory.getItem(i)
      if (!item) continue
      if (item.typeId == typeId) amount += item.amount
    }

    return amount
  },

  /**
   * @param {string} message
   * @returns {Promise<mc.CommandResult>}
   */
  async kick(message) {
    return await Server.runCommand(`kick "${this.name}" ${message ?? ""}`)
  },

  /**
   * Check if Player is muted
   * @returns {boolean}
   */
  isMuted() {
    return this.hasTag("muted")
  },

  /**
   * Mute player
   * @returns {boolean}
   */
  mute() {
    if (!this.isMuted()) return this.addTag("muted")
  },

  /**
   * Unmute player
   * @returns {boolean}
   */
  unmute() {
    if (this.isMuted()) return this.removeTag("muted")
  },

  /**
   * Set Score from Objective
   * @param {string} objectiveId 
   * @param {number} score 
   * @returns 
   */
  setScore(objectiveId, score) {
    return setScore(this, objectiveId, score)
  },

  /**
   * Set Score from Objective
   * @param {string} objectiveId 
   * @returns 
   */
  getScore(objectiveId) {
    return getScore(this, objectiveId)
  },
  /**
   * Get Player's Money
   * @returns {number}
   */
  getMoney() {
    return Server.Money.getMoney(this.name)
  },

  /**
   * Set Player's Money
   * @param {number} amount 
   */
  async setMoney(amount) {
    await Server.Money.setMoney(this.name, amount)
  },

  /**
   * Get Player's Equipment Inventory
   * @returns {mc.EntityEquipmentInventoryComponent}
   */
  getEquipmentInventory() {
    return this.getComponent("minecraft:equippable")
  },

  /**
   * Check if player in Combat
   * @returns {boolean}
   */
  isCombat() {
    return Combat.isCombat(this.name)
  },

  /**
   * Check if player has Tag
   * @param {string} tag 
   * @returns {string | undefined}
   */
  checkTag(tag) {
    return this.getTags().find(t => t.toLowerCase() == tag)
  },

  /**
   * Check if Player have permission
   * @param {string} permission 
   */
  checkPermission(permission) {
    return this.isAdmin() || this.checkTag(`admin:${permission}`) != undefined || Ranks.getAdminPermission(this, `admin.${permission}`)
  },

  /**
   * Get Permission
   * @param {string} permission 
   * @returns {number | any}
   */
  getPermission(permission) {
    return Ranks.getPermission(this, permission) ?? 0
  },

  getClaimBlock() {
    return Land.getClaimBlock(this)
  },

  setClaimBlock(amount) {
    return Land.setClaimBlock(this, amount)
  },
})

// MODALFORMDATA
const originalShow_modalFormData = ui.ModalFormData.prototype.show
Object.assign(ui.ModalFormData.prototype, {
  async show(player) {
    /** @type {ui.ModalFormResponse} */
    const result = await originalShow_modalFormData.call(this, player)
    if (result.formValues) Object.defineProperty(result, 'formValues', {
      value: result.formValues.filter((value) => value != undefined),
      writable: true
    });
    
    return result
  }
})

mc.World.prototype.getAllPlayers_OLD = Object.freeze(mc.World.prototype.getAllPlayers)
mc.World.prototype.getAllPlayers = () => {
  return mc.world.getAllPlayers_OLD().filter(p => p)
}

export default Class