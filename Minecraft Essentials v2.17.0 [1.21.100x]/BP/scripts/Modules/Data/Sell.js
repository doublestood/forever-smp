import * as mc from "@minecraft/server"
import Server from "../../main"
import { Database } from "../Database"

const SellDB = new Database("sellDB")

const Sell = {}

Sell.StructureData = {
  itemid: String.prototype,
  displayname: String.prototype,
  price: Number.prototype
}
Sell.StructureDatas = {
  itemid: String.prototype,
  displayname: String.prototype,
  price: Number.prototype,
  id: String.prototype
}

/**
 * Add Item to Sell
 * @param {string} id 
 * @param {Sell.StructureData} itemData 
 */
Sell.addItem = async (id, itemData) => {
  await SellDB.set(id, itemData)
}

/**
 * Edit Item from Sell
 * @param {string} id 
 * @param {Sell.StructureData} itemData 
 */
Sell.editItem = async (id, itemData) => {
  await SellDB.set(id, itemData)
}

/**
 * Remove Item from Sell
 * @param {string} id 
 */
Sell.removeItem = async (id) => {
  await SellDB.delete(id)
}

/**
 * Check If Item is Valid
 * @param {string} id 
 * @returns {boolean}
 */
Sell.isValid = (id) => {
  return SellDB.get(id) != undefined
}

/**
 * Get Data from Item in Sell
 * @param {string} id 
 * @returns {Sell.StructureData}
 */
Sell.getData = (id) => {
  return SellDB.get(id)
}

/**
 * ForEach Items from Shop
 * @param {(data: Sell.StructureDatas) => void} callback 
 */
Sell.forEach = (callback) => {
  SellDB.forEach((id, itemData) => {
    itemData["id"] = id
    callback(itemData)
  })
}

/**
 * Get all Items from Sell
 * @returns {Sell.StructureDatas[]}
 */
Sell.getItems = () => {
  let Items = []
  Sell.forEach(data => {
    Items.push(data)
  })

  return Items
}

/**
 * Get all Items Id from Sell
 * @returns {string[]}
 */
Sell.getItemsId = () => {
  return SellDB.keys()
}

/**
 * Reset Sell Data
 */
Sell.resetData = async () => {
  await SellDB.clear()
}

export default Sell