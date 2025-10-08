import { Container, world } from "@minecraft/server"
import Config from "../Configuration"
import Server from "../main"
import Combat from "../Modules/Combat"
import Utility from "../Modules/Utility"
import { Database } from "../Modules/Database"

/**
 * @param {import("../main").default} Server
 */
const combat = (Server) => {
  const isCombatOn = () => {
    return Server.Setting.get("combatSystem") ?? Config.combatSystem
  }

  const combatLog = new Database("DB_combatLog")

  Server.world.afterEvents.entityHurt.subscribe(async data => {
    if (!isCombatOn()) return
    if (data.damageSource.cause == "none") return
    if (data.hurtEntity.typeId != "minecraft:player") return
    if (data.damageSource.damagingEntity == undefined || data.damageSource.damagingEntity.typeId != "minecraft:player") return
    if (data.damageSource.damagingEntity == data.hurtEntity) return

    let player1 = data.damageSource.damagingEntity
    let player2 = data.hurtEntity

    Combat.setCombat(player1, player2)
    Combat.setCombat(player2, player1)
  })

  /**
   * @param {number} deadMoney 
   * @param {number} enemyMoney 
   * @returns {number}
   */
  const calculateMoneyGet = (deadMoney, enemyMoney) => {
    let defaultCalc = Math.floor(deadMoney * (30 / 100))
    if (!Server.Setting.get("moneySystem")) return 0
    try {
      let result = eval(Config.combatConfig.moneyLostWhenDie.replaceAll("deadPlayerMoney", deadMoney).replaceAll("killerMoney", enemyMoney))
      let numberResult = parseInt(result)
      if (!Number.isSafeInteger(numberResult)) return defaultCalc
      return numberResult
    } catch(e) {
      return defaultCalc
    }
  }

  Server.world.afterEvents.playerLeave.subscribe(({ playerName }) => {
    if (!isCombatOn()) return
    if (!Combat.isCombat(playerName)) return
    let enemyName = Combat.getCombat(playerName)

    let playerMoney = Server.Money.getMoney(playerName)
    let enemyMoney = Server.Money.getMoney(enemyName)
    let get = calculateMoneyGet(playerMoney, enemyMoney)

    if (get <= 0) return
    Server.Money.setMoney(playerName, playerMoney - get)
    Server.Money.setMoney(enemyName, enemyMoney + get)

    if (Server.getPlayer(enemyName))
      Server.getPlayer(enemyName).sendMessage({ translate: "mce.combat.leaveincombat", with: [playerName, Utility.formatMoney(get)] })
  })

  Server.world.afterEvents.entityDie.subscribe((data) => {
    if (!isCombatOn()) return
    if (!data.deadEntity || !data.deadEntity.isValid) return
    if (data.deadEntity.isValid && data.deadEntity.typeId === "minecraft:player") {
      let player = data.deadEntity
      if (!Combat.isCombat(player.name)) return
      let enemyName = Combat.getCombat(player.name)

      let playerMoney = Server.Money.getMoney(player.name)
      let enemyMoney = Server.Money.getMoney(enemyName)
      let get = calculateMoneyGet(playerMoney, enemyMoney)

      if (get <= 0) return
      Server.Money.setMoney(player.name, playerMoney - get)
      Server.Money.setMoney(enemyName, Server.Money.getMoney(enemyName) + get)


      player.sendMessage({ translate: "mce.combat.gotkilled", with: [Utility.formatMoney(get)] })
      Server.System.run(() => Server.getPlayer(enemyName).onScreenDisplay.setActionBar({ translate: "mce.player.killing", with: [Utility.formatMoney(get)] }))
    }
  })

  const playerInfoData = {}

  Server.world.beforeEvents.playerLeave.subscribe(({ player }) => {
    if (!player || !player.isValid) return
    if (!Combat.isCombat(player.name)) return
    if (!Config.combatConfig.dropItemsWhenCombatLog) return
    const playerInventory = player.getComponent("inventory").container
    playerInfoData[player.name] = {}
    playerInfoData[player.name].location = player.location
    playerInfoData[player.name].dimension = player.dimension
    playerInfoData[player.name].inventory = []
    for (let i = 0; i < playerInventory.size; i++) {
      let item = playerInventory.getItem(i)
      if (item) playerInfoData[player.name].inventory.push(item)
    }
  })

  Server.world.afterEvents.playerLeave.subscribe(({ playerId, playerName }) => {
    const playerInfo = playerInfoData[playerName] //as Container
    if (!playerInfo) return
    const playerInventory = playerInfo.inventory //as Container

    combatLog.set(playerName, Date.now())
    playerInventory.forEach(item => {
      playerInfo.dimension.spawnItem(item, playerInfo.location)
    })
  })

  Server.world.afterEvents.playerSpawn.subscribe(({ initialSpawn, player }) => {
    if (initialSpawn) {
      if (!player || !player.isValid) return
      if (!combatLog.get(player.name)) return
      combatLog.delete(player.name)
      player.getComponent("inventory").container.clearAll()
      player.kill()
    }
  })

  const goldenAppleCooldown = {}
  Server.world.beforeEvents.itemUse.subscribe((data) => {
    if (!Combat.isCombat(data.source.name)) return
    if (Config.combatConfig.banItems.includes(data.itemStack.typeId)) {
      data.cancel = true
      data.source.sendMessage("§cYou cannot use this item while in combat!")
    } else if (data.itemStack.typeId == "minecraft:golden_apple" || data.itemStack.typeId == "minecraft:enchanted_golden_apple") {
      if (!goldenAppleCooldown[data.source.name]) return
      if (Date.now() < goldenAppleCooldown[data.source.name]) {
        data.cancel = true
        data.source.sendMessage("§cThis item on cooldown!")
      }
    }
  })

  Server.world.afterEvents.itemCompleteUse.subscribe(({ itemStack, source }) => {
    if (Config.combatConfig.goldenAppleCooldown) {
      goldenAppleCooldown[source.name] = Date.now() + (Config.combatConfig.goldenAppleCooldown * 1000)
    }
  })

  Server.System.runInterval(() => {
    if (!isCombatOn()) return
    Server.world.getAllPlayers().forEach(player => {
      if (!player || !player.isValid) return
      if (Combat.isCombat(player.name)) {
        Server.System.run(() => player.onScreenDisplay.setActionBar({ translate: "mce.combat.incombat" }))
        player.addTag("mce:combat")
      } else {
        player.removeTag("mce:combat")
      }
    })
  }, 20)
}

export default combat