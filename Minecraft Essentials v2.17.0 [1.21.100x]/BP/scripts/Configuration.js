const Config = {}

Config.AdminList = ["Players", "Name", "Here"] // Trusted player or Admin
Config.BanPlayer = [ // Player ban list
  {
    name: "Player Name Here",
    reason: "Reason"
  }
]

// Common Setting
Config.playerJoinMessage = `Type "{Prefix}help" for more information.` // Set to "None" will disable join message
Config.tpaSystemWithUI = true // UI for accept or decline tpa requests, set it false will using tpaccept comamnd to accept request
Config.serverInfo = "§cServer info isn't set yet." // Text that will be show in info command. ((NEWLINE) = New Line)
Config.Timezone = 0 // Set to your timezone, Example +7 is 7
Config.compassMenu = {
  ItemId: "minecraft:compass"
}

Config.MoneyObjective = "Money" // Money Scoreboard

// Combat Configuration
Config.combatSystem = false
Config.combatConfig = {
  combatTime: 30, // How long combat time will be in seconds
  moneyLostWhenDie: "deadPlayerMoney * (30/100)", // INPUT MATH. If 0, player will not lost their money after got killed. 
  // deadPlayerMoney = Money from dead player | killerMoney = Money from player that killing dead player
  disableTeleport: true, // If true, player not able to use teleport command while in combat
  dropItemsWhenCombatLog: false, // If true, player will drop all items in inventory if leaving in combat
  banItems: ["minecraft:ender_pearl"], // If true, player not able to use listed item while in combat
  goldenAppleCooldown: 5 // The cooldown of using golden apple while in cooldown
}

Config.defaultPermission = {
  "chat.cooldown": 2,  // Set 0 to disable anti spam

  "back.cooldown": 2,  // Back Cooldown
  "tpa.cooldown": 2,  // TPA & TPAHere Cooldown
  "home.cooldown": 2,  // Home Cooldown
  "warp.cooldown": 2,  // Warp Cooldown
  "rtp.cooldown": 2,  // RTP Cooldown
  "command.cooldown": 2,  // Command Cooldown

  "back.countdown": 2,  // Countdown before Teleport
  "tpa.countdown": 2,  // Countdown before Teleport
  "home.countdown": 2,  // Countdown before Teleport
  "warp.countdown": 2,  // Countdown before Teleport
  "rtp.countdown": 2,  // Countdown before Teleport

  "back.cost": 0,  // Cost for Teleport
  "tpa.cost": 0,  // Cost for Teleport
  "home.cost": 0,  // Cost for Teleport
  "warp.cost": 0,  // Cost for Teleport
  "rtp.cost": 0,  // Cost for Teleport

  "home.limit": 10  // Limit Home for Player
}

Config.defaultAdminPermission = {
  "admin.adminpanel": false,
  "admin.ban": false,
  "admin.broadcast": false,
  "admin.economy": false,
  "admin.floatingtext": false,
  "admin.invsee": false,
  "admin.kick": false,
  "admin.landsetting": false,
  "admin.log": false,
  "admin.mute": false,
  "admin.ranks": false,
  "admin.resetdata": false,
  "admin.sellsetting": false,
  "admin.setting": false,
  "admin.shopsetting": false,
  "admin.warp": false,
  "admin.teleport": false,
  "admin.gamemode_creative": false,
  "admin.gamemode_survival": false,
  "admin.gamemode_spectator": false,
  "admin.gamemode_adventure": false
}

Config.defaultLandPermission = {
  "land.claim": true,
  "land.unclaim": true,
  "land.invite": true,
  "land.kick": true,
  "land.transferOwnership": true,
  "land.setting": true,
}

Config.defaultChestShopPermission = {
  "chestshop.create.selling": true,
  "chestshop.create.buying": true,
  "chestshop.selling": true,
  "chestshop.buying": true
}

// RTP Configuration
Config.RTPRange = 1000 // In Blocks

// Money Configuration
Config.maxMoney = 100000 // Max Money
Config.starterMoney = 100 // Starter Money
Config.currencyPrefix = "" // Currency or Money Prefix
Config.earnMoneyfromMobs = true // Money drop from killing Mobs
Config.notifyEarnMoneyInChat = false // If true, the notification of the money you get from mobs will appear in the chat instead of actionbar.
Config.moneyFromMobs = { // Money drop from killing Mobs
  "minecraft:pig": [1, 5],
  "minecraft:cow": [1, 5],
  "minecraft:sheep": [1, 5],
  "minecraft:chicken": [1, 5],
  "minecraft:cod": [1, 5],
  "minecraft:salmon": [1, 5],
  "minecraft:pufferfish": [1, 5],
  "minecraft:tropicalfish": [1, 5],

  "minecraft:zombie": [20, 50],
  "minecraft:husk": [20, 50],
  "minecraft:skeleton": [20, 50],
  "minecraft:stray": [20, 50],
  "minecraft:blaze": [20, 50],
  "minecraft:zombie_villager": [20, 50],
  "minecraft:zombie_villager_v2": [20, 50],
  "minecraft:pillager": [20, 50],
  "minecraft:vex": [20, 50],
  "minecraft:evocation_illager": [20, 50],
  "minecraft:slime": [20, 50],
  "minecraft:drowned": [20, 50],
  "minecraft:guardian": [20, 50],
  "minecraft:iron_golem": [20, 50],
  "minecraft:spider": [20, 50],
  "minecraft:magma_cube": [20, 50],
  "minecraft:cave_spider": [20, 50],
  "minecraft:endermite": [20, 50],
  "minecraft:piglin": [20, 50],
  "minecraft:piglin_brute": [20, 50],
  "minecraft:zoglin": [20, 50],
  "minecraft:shulker": [20, 50],
  "minecraft:enderman": [20, 50],
  "minecraft:phantom": [20, 50],
  "minecraft:creeper": [25, 55],
  "minecraft:wither_skeleton": [20, 50],
  "minecraft:ghast": [20, 50],
  "minecraft:witch": [30, 50],
  "minecraft:zombie_pigman": [20, 50],

  "minecraft:warden": [70, 100],
  "minecraft:ravager": [70, 100],
  "minecraft:wither": [70, 100],
  "minecraft:ender_dragon": [70, 100]
}

// System Configuration
Config.moneySystem = true
Config.homeSystem = true
Config.tpaSystem = true
Config.warpSystem = true
Config.backSystem = true
Config.rtpSystem = true
Config.shopSystem = true
Config.sellSystem = true
Config.auctionSystem = true
Config.withdrawSystem = true
Config.messageSystem = true
Config.combatSystem = true
Config.landSystem = true

// Land Configuration

/**
 * Claim Block = How much player can claim
 * Example: 64 Claim block, thats means player can only claim 64 block
 * true = On
 * false = Off
 * Set it off = Player will not cost / use Claim Block
 */
Config.costClaimBlock = true

/**
 * Starter Player Claim Block
 * Max: 2147483647
 */
Config.starterClaimBlock = 512

/**
 * Claim Block Objective
 */
Config.claimBlockObjective = "ClaimBlock"

/**
 * Money cost per block
 * Example: If you set it to 2. Then it will cost 2 Coin per block
 * Set it 0 to make it free
 */
Config.moneyCostperBlock = 2

/**
 * Particle when player set position
 */
Config.particleClaim = "minecraft:endrod"

/**
 * Notify when enter or exit land
 * None = No notify
 * ActionBar = Notify on Action Bar
 * Chat = Notify on Chat
 * Title = Notify on Title
 */
Config.notifyLand = "ActionBar"

/**
 * Item that used to set start or end position
 */
Config.itemClaimLand = "minecraft:golden_shovel"

/**
 * If its set to true, any explosion can't destroy land
 */
Config.protectLandfromExplosion = true

/**
 * If its set to true, other player can't use piston to break into other player land
 */
Config.allowPistonInLand = false

Config.Ranks = {
  displayOnMessage: true,
  displayOnNameTag: true,
  /**
   * If player doesn't have rank, this rank will be applied
   */
  defaultRank: {
    displayName: "§bMember"
  },
  /**
   * If player doesn't have permission, this permission will be applied
   */
  defaultPermission: Config.defaultPermission,
  /**
   * If player doesn't have permission, this permission will be applied
   */
  defaultAdminPermission: Config.defaultAdminPermission,
  /**
   * If player doesn't have permission, this permission will be applied
   */
  defaultLandPermission: Config.defaultLandPermission,
  /**
   * If player doesn't have permission, this permission will be applied
   */
  defaultChestShopPermission: Config.defaultChestShopPermission,
  /**
   * Separator between ranks, Example put "-" will [Admin-Builder]
   */
  rankSeparator: "§r§8][§r",
  /**
  * {PLAYERNAME} = The Player Name
  * {MESSAGE} = The Message
  * {RANK} = THE RANKS
  */
  message: `§r§8[§r{RANK}§r§8]§r§7 {PLAYERNAME} §r>> {MESSAGE}`,
  /**
   * {PLAYERNAME} = The Player Name
   * {RANK} = THE RANKS
   */
  nameTag: `§r§8[§r{RANK}§r§8]§r§7 {PLAYERNAME}`
}

// Command Configuration
Config.commandPrefix = "!"  // Command Prefix
Config.Commands = {  // Commands Configuration (Don't change, unless you understand the code)
  "general": {
    help: true,
    back: true,
    playerlist: true,
    tps: true,
    message: true,
    rtp: true,
    info: true,
    calculate: true,
    report: true,
    credit: true
  },
  "money": {
    money: true,
    pay: true,
    topmoney: true,
    shop: true,
    sell: true,
    auctionhouse: true,
    withdraw: true
  },
  "home": {
    home: true,
    sethome: true,
    delhome: true,
    listhome: true
  },
  "warp": {
    spawn: true,
    warp: true,
    listwarp: true
  },
  "tpa": {
    tpa: true,
    tpahere: true,
    tpacancel: true,
    tpaccept: true,
    tpasetting: true
  },
  "admin": {
    economy: true,
    setwarp: true,
    delwarp: true,
    broadcast: true,
    kick: true,
    ban: true,
    unban: true,
    setting: true,
    shopsetting: true,
    sellsetting: true,
    resetdata: true,
    adminpanel: true,
    mute: true,
    unmute: true,
    inventorysee: true,
    log: true,
    tempban: true,
    teleport: true
  },
  "land": {
    land: true,
    landsetting: true
  },
  "ranks": {
    addranks: true,
    createranks: true,
    deleteranks: true,
    editranks: true,
    removeranks: true
  },
  "floating text": {
    "floatingtext-add": true,
    "floatingtext-remove": true,
    "floatingtext-edit": true,
    "floatingtext-clear": true,
    "floatingtext-duplicate": true
  },
  "gamemodes": {
    "gamemodes": true
  }
}

// Dangerous Setting (Only change if you know)

/**
 * Number of custom item that you add, Only change this if there is error with texture in UI
 * Set to undefined to use automatically calculate
 * Set to number if there is error
 */
Config.NumberOf_1_16_100_Items = undefined

export default Config