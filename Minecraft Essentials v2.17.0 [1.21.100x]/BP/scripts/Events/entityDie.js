import Config from "../Configuration"
import Server from "../main"
import Utility from "../Modules/Utility"

/**
 * @param {import("../main").default} Server
 */
const entityDie = (Server) => {
  Server.world.afterEvents.entityDie.subscribe(async data => {
    if (!Server.Setting.get("moneySystem") || !Server.Setting.get("earnMoneyfromMobs")) return
    if (data.damageSource.cause == "none") return
    if (data.damageSource.damagingEntity == undefined || data.damageSource.damagingEntity.typeId != "minecraft:player") return
    let deadEntity = data.deadEntity
    let player = data.damageSource.damagingEntity
  
    let entity = Config.moneyFromMobs[deadEntity.typeId]
    if (!entity) return
    let moneyEarn = Utility.random(entity[0], entity[1])
    if (player.getMoney() + moneyEarn > Server.Money.getMaxMoney()) moneyEarn = Server.Money.getMaxMoney() - player.getMoney()
    if (moneyEarn <= 0) return
    await player.setMoney(player.getMoney() + moneyEarn)
    if (Server.Setting.get("notifyEarnMoneyInChat")) {
      Server.System.run(() => player.sendMessage({ translate: "mce.player.killing", with: [Utility.formatMoney(moneyEarn)] }))
    } else {
      Server.System.run(() => player.onScreenDisplay.setActionBar({ translate: "mce.player.killing", with: [Utility.formatMoney(moneyEarn)] }))
    }
  })
}

export default entityDie