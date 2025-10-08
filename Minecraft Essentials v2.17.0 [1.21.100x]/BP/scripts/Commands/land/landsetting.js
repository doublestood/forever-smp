import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import { Database } from "../../Modules/Database"
import { ForceOpen } from "../../Modules/Forms"

/**
 * @param {import("../../main").default} Server 
 */
const landsetting = (Server) => {
  Server.Commands.register({
    name: "landsetting",
    description: "Setting Land system",
    category: "Land",
    permission: "landsetting",
    usage: "landsetting"
  }, async (data, player, args) => {
    let settingUi = new ui.ModalFormData()
      .title("Land Setting")
      .toggle("Cost Claim Block", { defaultValue: Server.Setting.get("costClaimBlock") })
      .textField("Starter Claim Block:", "Input number", { defaultValue: `${Server.Setting.get("starterClaimBlock")}` })
      .textField("Claim Block Objective:", "Input objective", { defaultValue: Server.Setting.get("claimBlockObjective") })
      .textField("Money Cost per Block:", "Input number", { defaultValue: `${Server.Setting.get("moneyCostperBlock")}` })
      .textField("Particle Claim:", "Input particle", {defaultValue: Server.Setting.get("particleClaim")})
      .textField("Notify Land:", "Input type", {defaultValue: Server.Setting.get("notifyLand")})
      .textField("Item Claim Land:", "Input id", {defaultValue: Server.Setting.get("itemClaimLand")})
      .toggle("Protect Land from Explosion", {defaultValue: Server.Setting.get("protectLandfromExplosion")})
    //.toggle("Allow Piston on Land", Server.Setting.get("allowPistonInLand"))

    player.sendMessage("§eClose Chat to Show UI!")
    await ForceOpen(player, settingUi).then(res => {
      if (res.canceled) return
      try {
        let [
          costClaimBlock,
          starterClaimBlock,
          claimBlockObjective,
          moneyCostperBlock,
          particleClaim,
          notifyLand,
          itemClaimLand,
          protectLandfromExplosion,
          //allowPistonInLand
        ] = res.formValues

        // Cost Claim Block
        Server.Setting.set("costClaimBlock", costClaimBlock)

        // Starter Claim Block
        let Set_starterClaimBlock = Number(starterClaimBlock)
        if (Number.isInteger(Set_starterClaimBlock) && Number.isFinite(Set_starterClaimBlock) && Set_starterClaimBlock >= 0) Server.Setting.set("starterClaimBlock", Set_starterClaimBlock)

        // Claim Block Objective
        Server.Setting.set("claimBlockObjective", claimBlockObjective)

        // Money Cost per Block
        let Set_moneyCostperBlock = Number(moneyCostperBlock)
        if (Number.isInteger(Set_moneyCostperBlock) && Number.isFinite(Set_moneyCostperBlock) && Set_moneyCostperBlock >= 0) Server.Setting.set("moneyCostperBlock", Set_moneyCostperBlock)

        // Particle Claim
        Server.Setting.set("particleClaim", particleClaim)

        // Notify Land
        Server.Setting.set("notifyLand", notifyLand)

        // Item Claim Land
        Server.Setting.set("itemClaimLand", itemClaimLand)

        // Protect Land from Explosion
        Server.Setting.set("protectLandfromExplosion", protectLandfromExplosion)

        // Allow Piston in Land
        //Server.Setting.set("allowPistonInLand", allowPistonInLand)

        return player.sendMessage("§aSuccessfully saved settings!")
      } catch (err) {
        player.sendMessage(`§c${err}`)
        return player.sendMessage(`§c${err.stack}`)
      }
    })
  })

  mc.system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }) => {
    if (id == "mce:convertlandsetting2.5.0" && (sourceEntity != undefined && sourceEntity.typeId == "minecraft:player")) {
      sourceEntity.sendMessage("§eConverting...")
      let database = new Database("Land_settingDB")
      database.forEach((key, value) => Server.Setting.set(key, value))

      sourceEntity.sendMessage("§aConverted.")
    }
  })
}

export default landsetting