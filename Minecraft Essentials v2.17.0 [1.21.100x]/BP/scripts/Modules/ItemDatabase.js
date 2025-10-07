import { Container, Entity, ItemStack, ItemTypes, system, world } from "@minecraft/server";
import { Database } from "./Database";
import { Log } from "./Log";
import Utility from "./Utility";
const itemMaxPerEntity = 256
const entityId = "pao:new_database"
const overworld = world.getDimension("minecraft:overworld")
const nameRegistered = []

const waitLoaded = async () => {
  return new Promise((resolve) => {
    let systemId = system.runInterval(() => {
      let ent = world.getAllPlayers()
      if (ent.length > 0) {
        system.clearRun(systemId)
        resolve()
      }
    }, 10)
  })
}

const sleep = async (ms) => {
  return new Promise((resolve) => {
    system.runTimeout(resolve, (ms / 1000) * 20)
  })
}

const findIndexByValue = (obj, value) => {
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && JSON.stringify(obj[key]) === JSON.stringify(value)) {
      return key;
    }
  }
  return undefined
}

export class Item {
  #data
  #database

  /**
   * @param {ItemDatabase} database 
   */
  constructor(data, database) {
    this.#data = data
    this.#database = database
    this.item = data.item
  }

  get data() {
    return this.#data
  }

  isValid() {
    return this.#database.isValid(this.#data)
  }

  delete() {
    return this.#database.remove(this.#data)
  }

  unStore(keepItem = true) {
    return this.#database.unStore(this.#data, keepItem)
  }

  editData(newData = {}) {
    return this.#database.edit(this.#data, newData)
  }
}

class ItemDatabase {
  #name = "";
  #loaded = false;
  // #entity = Entity.prototype;
  #entities = [];
  #itemData = {};
  #database;

  constructor(name) {
    if (nameRegistered.includes(name))
      throw new Error("You can't have 2 of the same databases")
    if (name.includes('"'))
      throw new TypeError(`Database names can't include "!`)
    if (name.length > 13 || name.length === 0)
      throw new Error(`Database names can't be more than 13 characters long, and it can't be nothing!`);

    this.#name = name
    this.#loaded = false
    this.#itemData = {}
    this.#entities = []
    this.#database = new Database(`EntityDatabase_${this.#name}`)

    nameRegistered.push(this.#name)
    this.#init()
  }

  async #waitLoaded() {
    return new Promise((resolve) => {
      let systemId = system.runInterval(() => {
        if (this.#entities.length > 0) {
          system.clearRun(systemId)
          resolve()
        }
      }, 10)
    })
  }

  async waitLoaded() {
    return new Promise((resolve) => {
      let systemId = system.runInterval(() => {
        if (this.#loaded) {
          system.clearRun(systemId)
          resolve()
        }
      }, 10)
    })
  }

  async #init() {
    await waitLoaded()
    overworld.runCommand(`tickingarea add circle 8 0 8 4 "PaoDatabase" true`)
    let t = Date.now()
    let timeNeededtoLoad = []
    let entities = overworld.getEntities()
      .filter(e => {
        if (e.typeId !== entityId) return false
        if (e.nameTag !== `DB_${this.#name}`) return false
        return true
      })
      .sort((a, b) => {
        let aTag = a.getTags().find(t => t.startsWith("spawntime:"))?.substring("spawntime:".length) ?? 0
        let bTag = b.getTags().find(t => t.startsWith("spawntime:"))?.substring("spawntime:".length) ?? 0

        let aTime = Number(aTag)
        let bTime = Number(bTag)

        return aTime - bTime ?? 1
      })
    if (entities.length > 0) {
      let entityCount = 0
      for (const entity of entities) {
        const entityInventory = entity.getComponent("inventory").container
        for (let i = 0; i < itemMaxPerEntity; i++) {
          const tn = Date.now()
          try {
            let item = entityInventory.getItem(i)
            let slot = i + (entityCount * itemMaxPerEntity)
            if (!item) {
              this.#database.delete(`slot_${slot}`)
              continue;
            }
            let storedData = this.#database.get(`slot_${slot}`)
            if (!storedData) {
              console.warn(`[Entity ${entityCount + 1} | Slot ${i}] Has item but dont have data!`)
              entityInventory.setItem(i)
              continue
            }
            storedData["item"] = item

            this.#itemData[slot] = storedData
            // console.warn(slot, item.typeId)
            // await sleep(100)
          } catch (err) {
            console.error(err)
          }
          timeNeededtoLoad.push(Date.now() - tn)
        }
        this.#entities.push(entity)
        entityCount++
      }
    } else {
      const run = system.runInterval(() => {
        if (this.#entities.length > 0) {
          system.clearRun(run)
        } else {
          console.warn(`[Entity Database] Cannot find ${this.#name}, trying to spawn...`)
          let entity = overworld.spawnEntity("pao:new_database", { x: 8, y: 0, z: 8 })
          entity.nameTag = `DB_${this.#name}`
          entity.addTag(`spawntime:${Date.now()}`)
          this.#entities.push(entity)
          console.log(`[Entity Database] ${this.#name} spawned id: ${entity.id}.`)
        }
      })
    }

    await this.#waitLoaded()
    this.#loaded = true
    // this.clear()
    const averageTime = Utility.CalculateAverage(timeNeededtoLoad)
    console.log(`[Entity Database] ${this.#name} loaded in ${Date.now() - t}ms. ${this.length} Items in this database takes average ${(averageTime || 0).toFixed(2)}ms per items.`)
    Log(`[Entity Database] ${this.#name} loaded in ${Date.now() - t}ms. ${this.length} Items in this database takes average ${(averageTime || 0).toFixed(2)}ms per items..`)

    // console.warn(JSON.stringify(this.#itemData))
  }

  #test() {
    // const entityInventory = this.#entity.getComponent("inventory").container //as Container
    // for (let i = 0; i < (entityInventory.size / 2); i++) {
    //   let item = entityInventory.setItem(i, new ItemStack("minecraft:dirt"))
    // }
  }

  get #fullInvetory() {
    return this.#entities.length * itemMaxPerEntity
  }

  #getItem(slot) {
    return this.#itemData[slot]
  }

  /**
     * Find Empty SLot in entity
     * @returns {number[]}
     */
  #findEmptySlot() {
    let emptySlot = []
    for (let i = 0; i < this.#fullInvetory; i++) {
      let item = this.#getItem(i)
      if (!item) emptySlot.push(i)
    }

    return emptySlot
  }

  /**
   * Set Items
   * @param {number} slot 
   * @param {mc.ItemStack} item 
   * @param {any} data 
   * @returns {any}
   */
  #setItem(slot, item, data = {}) {
    let entityIndex = Math.floor(slot / itemMaxPerEntity)
    let entitySlot = slot % itemMaxPerEntity
    let entity = this.#entities[entityIndex]

    entity.getComponent("inventory").container.setItem(entitySlot, item)

    data["slot"] = slot
    this.#database.set(`slot_${slot}`, data)

    data["item"] = item
    this.#itemData[slot] = data

    return this.#getItem(slot)
  }

  /**
   * Delete Items
   * @param {number} slot 
   */
  #deleteItem(slot) {
    let entityIndex = Math.floor(slot / itemMaxPerEntity)
    let entitySlot = slot % itemMaxPerEntity
    let entity = this.#entities[entityIndex]
    let entityInventory = entity.getComponent("inventory").container
    entityInventory.setItem(entitySlot)
    if (entityInventory.emptySlotsCount >= itemMaxPerEntity && this.#entities.length > 1) {
      this.#entities.splice(entityIndex, 1)
      entity.remove()
    }

    this.#database.delete(`slot_${slot}`)
    delete this.#itemData[slot]
  }

  get length() {
    return Object.keys(this.#itemData).length
  }

  /**
   * Get items amount if have specific data
   * @param {any} data 
   * @returns {number}
   */
  getAmountByData(data = {}) {
    let itemsAmount = 0
    for (const slot in this.#itemData) {
      const itemData = this.#itemData[slot]
      let notSame = false
      for (const d in data) {
        if (itemData[d] === data[d]) continue;
        notSame = true
        break
      }
      if (!notSame) itemsAmount++;
    }

    return itemsAmount
  }

  add(item, data = {}) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    const emptySlot = this.#findEmptySlot()
    if (emptySlot.length <= 0) {
      let entity = overworld.spawnEntity("pao:new_database", { x: 8, y: 0, z: 8 })
      entity.nameTag = `DB_${this.#name}`
      entity.addTag(`spawntime:${Date.now()}`)
      this.#entities.push(entity)
    }
    const slot = this.#findEmptySlot()[0]

    this.#setItem(slot, item, data)

    // data["slot"] = slot
    // this.#entity.setDynamicProperty(`slot_${slot}`, JSON.stringify(data))
    // this.#entity.getComponent("inventory").container.setItem(slot, item)
    // data["item"] = item
    // this.#itemData[slot] = data
    // console.warn(`${this.#entity.getDynamicPropertyTotalByteCount() / 1000} Kilobytes used in this database.`)
  }

  get(slot) {
    if (!this.#getItem(slot)) return undefined
    return new Item(this.#getItem(slot), this)
  }

  remove(data = {}) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    let slot = findIndexByValue(this.#itemData, data)
    if (slot == undefined) throw new Error("Item not found!")
    this.#deleteItem(Number(slot))
  }

  unStore(data, keepItem = true) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    let slot = findIndexByValue(this.#itemData, data)
    if (slot == undefined) throw new Error("Item not found!")
    slot = Number(slot)
    const item = this.#itemData[slot].item
    let cloneItem = item.clone()
    if (!keepItem) {
      this.#deleteItem(slot)
    }
    return cloneItem
  }

  edit(oldData, newData) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    let slot = findIndexByValue(this.#itemData, oldData)
    if (slot == undefined) throw new Error("Item not found!")
    slot = Number(slot)
    this.#database.set(`slot_${slot}`, newData)
    this.#itemData[slot] = { ...this.#itemData[slot], ...newData }
  }

  isValid(data) {
    let indexData = findIndexByValue(this.#itemData, data)
    if (indexData == undefined) return false
    return true
  }

  clear() {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    for (const e of this.#entities) { e.remove() }
    this.#entities = []
    this.#itemData = {}
    this.#database.clear()
    let entity = overworld.spawnEntity("pao:new_database", { x: 8, y: 0, z: 8 })
    entity.nameTag = `DB_${this.#name}`
    entity.addTag(`spawntime:${Date.now()}`)
    this.#entities.push(entity)
  }

  /**
   * Get All Item from Database
   * @param {(data: Item) => void} callback
   */
  forEach(callback) {
    if (!this.#loaded) throw new ReferenceError("Database is not loaded");
    for (const slot in this.#itemData) {
      const item = this.get(slot)
      callback(item)
    }
  }

  /**
   * RESET DATABASE
   */
  async hardReset() {
    return new Promise((resolve, reject) => {
      this.#entities = []
      let entities = overworld.getEntities()
        .filter(e => {
          console.log(e.typeId === entityId, e.nameTag === `DB_${this.#name}`)
          if (e.typeId !== entityId) return false
          if (e.nameTag !== `DB_${this.#name}`) return false
          return true
        })
      
      for (const e of entities) { e.remove() }
      const run = system.runInterval(() => {
        if (this.#entities.length > 0) {
          system.clearRun(run)
          this.#itemData = {}
          resolve()
        } else {
          let entity = overworld.spawnEntity("pao:new_database", { x: 8, y: 0, z: 8 })
          entity.nameTag = `DB_${this.#name}`
          entity.addTag(`spawntime:${Date.now()}`)
          this.#entities.push(entity)
        }
      })
    })
  }
}

export default ItemDatabase