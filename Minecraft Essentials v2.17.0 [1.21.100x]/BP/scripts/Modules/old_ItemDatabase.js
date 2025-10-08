import * as mc from "@minecraft/server"
import { Database } from "./Database"
import Utility from "./Utility"

const { system } = mc

let nameRegistered = []
const itemData = {
  item: mc.ItemStack.prototype,
  entity: mc.Entity.prototype,
  data: {}
}

class ServerClass {
  constructor() {
    this.Minecraft = mc
    this.world = mc.world

    this.isLoaded = false
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

const inventorySize = 96

/**
 * Get Index by Value in Object
 * @param {object} obj 
 * @param {any} value 
 * @returns {string}
 */
const findIndexByValue = (obj, value) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] === value) {
      return key;
    }
  }
  return undefined
}

export class ItemData {
  #data
  #database

  /**
   * 
   * @param {itemData} data 
   * @param {ItemDatabase} database 
   */
  constructor(data, database) {
    this.#data = data
    this.item = data.item
    this.entity = data.entity
    this.#database = database
  }

  getData() {
    let data = this.#data.data
    return data
  }

  isValid() {
    return this.#database.isValid(this.#data)
  }

  async delete() {
    return await this.#database.remove(this.#data)
  }

  async unStore(keepItem = true) {
    return await this.#database.unStore(this.#data, keepItem)
  }

  async editData(newData = {}) {
    return await this.#database.set(this.#data, this.item, newData)
  }
}

/**
 * Database to Store ItemStack | Made by: Paoeni | Credit to: Paoeni
 */
export default class ItemDatabase {
  #loaded
  #entities
  #itemData
  #name
  #size

  /**
   * Create ItemDatabase
   * @param {string} name
   * @param {number} size
   * @example
   * const Database = new ItemDatabase("Data", 11)
   */
  constructor(name, size = 11) {
    this.#name = name
    this.#size = size
    if (this.#size < 1) throw new TypeError("Database size can't lower than 1")
    this.#loaded = false
    this.#entities = []
    this.#itemData = {}
    if (nameRegistered.includes(this.#name))
      throw new Error("You can't have 2 of the same databases")
    if (this.#name.includes('"'))
      throw new TypeError(`Database names can't include "!`)
    if (this.#name.length > 13 || this.#name.length === 0)
      throw new Error(`Database names can't be more than 13 characters long, and it can't be nothing!`);

    nameRegistered.push(this.#name)
    this.#init()
  }

  async #init() {
    await Server.waitLoaded()
    await Server.runCommand(`tickingarea add circle 8 0 8 4 "PaoDatabase" true`)
    let get = 0
    Server.getDimension("minecraft:overworld").getEntities()
      .filter(e => e.typeId === "pao:database" && e.nameTag.split("_")[0] == this.#name)
      .sort((a, b) => {
        let aTag = a.getTags().find(t => t.startsWith("spawntime:"))?.substring("spawntime:".length) ?? 0
        let bTag = b.getTags().find(t => t.startsWith("spawntime:"))?.substring("spawntime:".length) ?? 0

        let aTime = Number(aTag)
        let bTime = Number(bTag)

        return aTime - bTime ?? 1
      })
      .forEach((entity) => {
        if (get >= this.#size) return;
        this.#entities.push(entity)
        let entityInventory = Server.getInventory(entity)
        for (let i = 0; i < inventorySize; i++) {
          let item = entityInventory.getItem(i)
          if (!item) continue;
          let slot = i + (get * inventorySize)
          let data = this.#readData(item) ?? {}
          this.#itemData[slot] = {
            item: item,
            entity: entity,
            data: data
          }
          // console.warn("Loaded " + slot + " " + entity.nameTag)
        }
        get = get + 1
      })
    if (this.#entities.length <= 0) {
      const run = system.runInterval(() => {
        if (this.#entities.length > 0) {
          system.clearRun(run)
        } else {
          let entity = Server.getDimension("minecraft:overworld").spawnEntity("pao:database", { x: 8, y: 0, z: 8 })
          system.run(() => {
            entity.nameTag = this.#name + "_" + this.#entities.length
            entity.addTag(`spawntime:${Date.now()}`)
          })
          this.#entities.push(entity)
        }
      })
    }
    this.#loaded = true
  }

  get #fullInvetory() {
    return this.#entities.length * 96
  }

  #getItem(slot) {
    return this.#itemData[slot]
  }

  #emptySlot() {
    let emptySlot = []
    for (let i = 0; i < this.#fullInvetory; i++) {
      let item = this.#getItem(i)
      if (!item) emptySlot.push(i)
    }

    return emptySlot
  }

  /**
   * 
   * @param {*} slot 
   * @param {mc.ItemStack} item 
   * @param {} data 
   * @returns 
   */
  #setItem(slot, item, data = {}) {
    let entityIndex = Math.floor(slot / 96)
    let entitySlot = slot % 96
    let entity = this.#entities[entityIndex]
    item = this.#writeData(item, data)
    Server.getInventory(entity).setItem(entitySlot, item)
    this.#itemData[slot] = {
      item: item,
      entity: entity,
      data: data
    }
    return this.#getItem(slot)
  }

  #deleteItem(slot) {
    let entityIndex = Math.floor(slot / 96)
    let entitySlot = slot % 96
    let entity = this.#entities[entityIndex]
    let entityInventory = Server.getInventory(entity)
    entityInventory.setItem(entitySlot)
    if (entityInventory.emptySlotsCount >= inventorySize && this.#entities.length > 1) {
      this.#entities.splice(entityIndex, 1)
      entity.triggerEvent("minecraft:despawn")
    }
    delete this.#itemData[slot]
  }

  #readData(item) {
    let data = {}
    for (var d of item.getLore()) {
      if (d.startsWith("pao")) {
        let key = d.substring("pao".length).split("_")[0]
        let value = d.substring(d.split("_")[0].length + 1)

        data[key] = JSON.parse(value)
      }
    }
    
    return data
  }

  #writeData(item, data) {
    let lore = [...item.getLore()]
    for (var d in data) {
      let dataString = `pao${d}_${JSON.stringify(data[d])}`
      if (dataString.length > 50) throw new Error("Data line can't greater than 50")
      lore.push(dataString)
    }
    if (lore.length > 20) throw new Error("Data size can't greater than 20")
    item.setLore(lore)
    return item
  }

  #removeData(item) {
    let lore = item.getLore()
    let n = 0
    lore.forEach(d => {
      if (d.startsWith("pao") && d.split("_")[1]) n += 1 
    })

    lore = lore.slice(0, -n)
    item.setLore(lore)
    return item
  }

  get loaded() {
    return this.#loaded
  }

  get length() {
    return Object.keys(this.#itemData).length
  }

  get items() {
    return this.#itemData
  }

  /**
   * Store item to Database
   * @param {mc.ItemStack} item 
   * @param {Object | undefined} data
   */
  add(item, data = {}) {
    if (!this.loaded) throw new ReferenceError("Database is not loaded");
    return new Promise((resolve, reject) => {
      try {
        item = item.clone()
        let emptySlot = this.#emptySlot()
        if (emptySlot.length <= 0) {
          if (this.#entities.length >= this.#size) throw new Error("Database is full!")
          let entity = Server.getDimension("minecraft:overworld").spawnEntity("pao:database", { x: 8, y: 0, z: 8 })
          system.run(() => {
            entity.nameTag = this.#name + "_" + this.#entities.length
            entity.addTag(`spawntime:${Date.now()}`)
          })
          this.#entities.push(entity)
        }
        emptySlot = this.#emptySlot()
        let slot = emptySlot[0]
        this.#setItem(slot, item, data)
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })
  }

  /**
  * Remove Item from Database
  * @param {itemData} data 
  */
  async remove(data) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    return new Promise(async (resolve) => {
      let indexData = findIndexByValue(this.#itemData, data)
      if (indexData == undefined) throw new Error("Item not found!")
      this.#deleteItem(Number(indexData))
      resolve()
    })
  }

  /**
   * Set Item from Database
   * @param {itemData} oldData 
   * @param {mc.ItemStack} item 
   * @param {Object} data 
   */
  async set(oldData, item, data = {}) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    return new Promise(async (resolve) => {
      let indexData = findIndexByValue(this.#itemData, oldData)
      if (indexData == undefined) throw new Error("Item not found!")
      item = this.#writeData(this.#getItem(indexData).item, data)
      this.#setItem(indexData, item, data)
      resolve()
    })
  }

  /**
   * UnStore Item from Database
   * @param {itemData} data 
   * @param {booelan} keepItem 
   * @return {mc.ItemStack}
   */
  async unStore(data, keepItem = true) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    return new Promise(async (resolve) => {
      let indexData = findIndexByValue(this.#itemData, data)
      if (indexData == undefined) throw new Error("Item not found!")
      const item = this.#getItem(indexData).item
      let cloneItem = item.clone()
      cloneItem = this.#removeData(cloneItem)
      if (!keepItem) {
        this.#deleteItem(Number(indexData))
      }
      resolve(cloneItem)
    })
  }

  /**
  * Check Item from Database
  * @param {itemData} data 
  */
  isValid(data) {
    let indexData = findIndexByValue(this.#itemData, data)
    if (indexData == undefined) return false
    return true
  }

  /**
   * Clear all Data
   */
  async clear() {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    return new Promise(async (resolve) => {
      this.#itemData = {}
      this.#entities.forEach(entity => {
        entity.triggerEvent("minecraft:despawn")
      })
      this.#entities = []

      let entity = Server.getDimension("minecraft:overworld").spawnEntity("pao:database", { x: 8, y: 0, z: 8 })
      system.run(() => {
        entity.nameTag = this.#name + "_" + this.#entities.length
        entity.addTag(`spawntime:${Date.now()}`)
      })
      this.#entities.push(entity)
      resolve()
    })
  }

  /**
   * Get All Item from Database
   * @param {(data: ItemData) => void} callback
   */
  forEach(callback) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    for (const slot in this.#itemData) {
      const item = new ItemData(this.#getItem(slot), this)
      callback(item)
    }
  }
}