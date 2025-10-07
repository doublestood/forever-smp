import Config from "../Configuration"

/**
 * @param {import("../main").default} Server
 */
const playerDie = (Server) => {
  Server.Minecraft.world.afterEvents.entityDie.subscribe((data) => {
    if (!data.deadEntity || !data.deadEntity.isValid) return
    if (data.deadEntity.isValid && data.deadEntity.typeId === "minecraft:player") {
      if ((Server.Setting.get("backSystem") ?? true) == false) return
      let player = data.deadEntity
      const backData = {
        x: Math.floor(player.location.x),
        y: Math.floor(player.location.y),
        z: Math.floor(player.location.z),
        dimension: player.dimension.id
      }
      Server.BackDB.set(player.name, backData)
    }
  })
}

export default playerDie