import { Player, system, world } from "@minecraft/server"
import { Database } from "./Database"
import Config from "../Configuration"

const Ranks = {}
const RanksDB = new Database("rankDB")
const DefaultRankTag = "mce:default_rank"
Ranks.DefaultRankTag = DefaultRankTag

/**
 * Create Rank
 * @param {string} rankTag 
 * @param {{displayName: string}} rankData 
 */
Ranks.createRank = (rankTag, rankData) => {
  if (!rankData.order) rankData.order = Ranks.getRanks().length + 1
  if (!rankData.permissions) rankData.permissions = {}
  RanksDB.set(rankTag, rankData)
}

/**
 * Delete Rank
 * @param {string} rankTag 
 */
Ranks.deleteRank = (rankTag) => RanksDB.delete(rankTag)

const defaultData = {
  displayName: Config.Ranks.defaultRank.displayName,
  order: 99999,
  permissions: Config.Ranks.defaultPermission,
  adminPermissions: Config.Ranks.defaultAdminPermission,
  landPermissions: Config.Ranks.defaultLandPermission,
  chestShopPermissions: Config.Ranks.defaultChestShopPermission
}
Ranks.resetRanks = () => {
  RanksDB.clear()
  Ranks.createRank(DefaultRankTag, { ...defaultData })
}

/**
 * Edit Rank
 * @param {string} rankTag 
 * @param {{displayName: string, order: number | null, colorText: string, hideRanks: boolean, permissions: any, adminPermissions: any}}  rankData 
 */
Ranks.editRank = (rankTag, rankData) => {
  for (let [key, value] of Object.entries(rankData.permissions ?? {})) {
    if (typeof value == "string" && value.trim() == "") { rankData.permissions[key] = undefined; continue; }
    let numValue = Number(value)
    if (!Number.isSafeInteger(numValue) || (numValue < 0 && rankTag != DefaultRankTag)) { rankData.permissions[key] = undefined; continue; }
    rankData.permissions[key] = numValue
  }
  RanksDB.set(rankTag, rankData)
}

/**
 * Add Rank
 * @param {Player} player
 * @param {string} rankTag 
 */
Ranks.addRank = (player, rankTag) => player.addTag(rankTag)

/**
 * Remove Rank
 * @param {Player} player
 * @param {string} rankTag 
 */
Ranks.removeRank = (player, rankTag) => player.removeTag(rankTag)

/**
 * Get Permission
 * @param {Player} player
 * @param {string} permission
 */
Ranks.getPermission = (player, permission) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (rankData.permissions[permission] != undefined) {
      result = rankData.permissions[permission]
      break;
    }
  }

  if (result == undefined) result = Config.Ranks.defaultPermission[permission]
  return result
}

/**
 * Get Admin Permission
 * @param {Player} player
 * @param {string} permission
 */
Ranks.getAdminPermission = (player, permission) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (!rankData.adminPermissions) rankData.adminPermissions = {}
    if (rankData.adminPermissions[permission] != undefined) {
      result = rankData.adminPermissions[permission]
      break;
    }
  }

  if (result == undefined) result = Config.Ranks.defaultAdminPermission[permission] ?? false
  return result
}

/**
 * Get Land Permission
 * @param {Player} player
 * @param {string} permission
 */
Ranks.getLandPermission = (player, permission) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (!rankData.landPermissions) rankData.landPermissions = {}
    if (rankData.landPermissions[permission] != undefined) {
      result = rankData.landPermissions[permission]
      break;
    }
  }

  if (result == undefined) result = Config.Ranks.defaultAdminPermission[permission] ?? false
  return result
}

/**
 * Get Chest Shop Permission
 * @param {Player} player
 * @param {string} permission
 */
Ranks.getChestShopPermission = (player, permission) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (!rankData.chestShopPermissions) rankData.chestShopPermissions = {}
    if (rankData.chestShopPermissions[permission] != undefined) {
      result = rankData.chestShopPermissions[permission]
      break;
    }
  }

  if (result == undefined) result = Config.Ranks.defaultChestShopPermission[permission] ?? false
  return result
}

/**
 * Get Color Text
 * @param {Player} player
 */
Ranks.getColorText = (player) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (rankData.colorText != undefined && rankData.colorText.trim() != "") {
      result = rankData.colorText
      break;
    }
  }

  return result
}

/**
 * Get Color Text
 * @param {Player} player
 */
Ranks.getColorName = (player) => {
  const playerRanks = Ranks.getRanks(player)
  let result
  for (let tag of playerRanks) {
    const rankData = Ranks.getRank(tag)
    if (rankData.colorName != undefined && rankData.colorName.trim() != "") {
      result = rankData.colorName
      break;
    }
  }

  return result
}

/**
 * Get Rank
 * @param {string} rankTag 
 * @returns {{displayName: string, order: number | null, colorText: string, hideRanks: boolean, permissions: any, adminPermissions: any, landPermissions: any}} 
 */
Ranks.getRank = (rankTag) => { return RanksDB.get(rankTag) }

/**
 * Get All Ranks
 * @param {Player | null} player
 */
Ranks.getRanks = (player) => {
  if (player) {
    let playerRanks = player.getTags().filter((tag) => RanksDB.keys().includes(tag))
    playerRanks = playerRanks.sort((tag1, tag2) => {
      let rank1 = RanksDB.get(tag1)
      let rank2 = RanksDB.get(tag2)

      return rank1.order - rank2.order
    })

    return playerRanks
  } else {
    let ranks = RanksDB.keys()
    ranks = ranks.sort((tag1, tag2) => {
      let rank1 = RanksDB.get(tag1)
      let rank2 = RanksDB.get(tag2)

      return rank1.order - rank2.order
    })
    return ranks
  }
}

/**
 * Get Players Formated Ranks
 * @param {Player} player
 * @returns {string}
 */
Ranks.getFormatedRank = (player) => {
  let ranks = Ranks.getRanks(player).filter(r => r != Server.Ranks.DefaultRankTag && !Server.Ranks.getRank(r).hideRanks)
  if (ranks.length <= 0) ranks.push(Server.Ranks.DefaultRankTag)
  ranks = ranks.map((rank) => Server.Ranks.getRank(rank).displayName).join(Config.Ranks.rankSeparator)

  return ranks
}

Ranks.permissionList = {
  "chat.cooldown": ["Chat Cooldown"],
  "back.cooldown": ["Back Cooldown"],
  "tpa.cooldown": ["TPA Cooldown"],
  "home.cooldown": ["Home Cooldown"],
  "warp.cooldown": ["Warp Cooldown"],
  "rtp.cooldown": ["RTP Cooldown"],
  "command.cooldown": ["Command Cooldown"],

  "back.countdown": ["Chat Countdown"],
  "tpa.countdown": ["TPA Countdown"],
  "home.countdown": ["Home Countdown"],
  "warp.countdown": ["Warp Countdown"],
  "rtp.countdown": ["RTP Countdown"],

  "back.cost": ["Back Cost"],
  "tpa.cost": ["TPA Cost"],
  "home.cost": ["Home Cost"],
  "warp.cost": ["Warp Cost"],
  "rtp.cost": ["RTP Cost"],

  "home.limit": ["Home Limit"]
}

Ranks.adminPermissionList = {
  "admin.adminpanel": ["Admin Panel Command"],
  "admin.ban": ["Ban Command"],
  "admin.broadcast": ["Broadcast Command"],
  "admin.economy": ["Economy Command"],
  "admin.floatingtext": ["Floatingtext Command"],
  "admin.invsee": ["Inventory See Command"],
  "admin.kick": ["Kick Command"],
  "admin.landsetting": ["Land Setting Command"],
  "admin.log": ["Log Command"],
  "admin.mute": ["Mute Command"],
  "admin.ranks": ["Ranks Command"],
  "admin.resetdata": ["Reset Data Command"],
  "admin.sellsetting": ["Sell Setting Command"],
  "admin.setting": ["Setting Command"],
  "admin.shopsetting": ["Shop Setting Command"],
  "admin.warp": ["Warp Command"],
  "admin.teleport": ["Teleport Command"],
  "admin.gamemode_creative": ["Gamemode Creative Command"],
  "admin.gamemode_survival": ["Gamemode Survival Command"],
  "admin.gamemode_spectator": ["Gamemode Spectator Command"],
  "admin.gamemode_adventure": ["Gamemode Adventure Command"]
}

Ranks.landPermissionList = {
  "land.claim": ["Land Claim Command"],
  "land.unclaim": ["Land Unclaim Command"],
  "land.invite": ["Land Invite Command"],
  "land.kick": ["Land Kick Command"],
  "land.transferOwnership": ["Land Transfer Ownership Command"],
  "land.setting": ["Land Setting Command"]
}

Ranks.chestShopPermissionList = {
  "chestshop.create.selling": ["Chest Shop Create (Selling)", "Allow player to create selling chest shop"],
  "chestshop.create.buying": ["Chest Shop Create (Buying)", "Allow player to create buying chest shop"],
  "chestshop.selling": ["Chest Shop Sell", "Allow player to sell items to chest shop"],
  "chestshop.buying": ["Chest Shop Buy", "Allow player to buy items from chest shop"],
}

system.runInterval(() => {
  world.getAllPlayers().forEach(player => {
    if (!player || !player.isValid) return
    Ranks.addRank(player, DefaultRankTag)
  })
})

let defaultRank = Ranks.getRank(DefaultRankTag) ?? {}
Ranks.createRank(DefaultRankTag, { ...defaultData, ...defaultRank })

export default Ranks