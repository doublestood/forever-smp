import { world, system, CommandPermissionLevel, CustomCommandStatus, Player, CustomCommandParamType } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"

world.afterEvents.worldLoad.subscribe(() => {
  const beforeLoad = Date.now()
  import("./main").then(async () => {
    const { SystemLog } = await import("./Modules/Log")
    const loadTime = Date.now() - beforeLoad
    SystemLog(`Minecraft Essentials have been loaded successfully in ${loadTime}ms`)
    world.getAllPlayers()
      .filter(p => p && p.isAdmin())
      .forEach(p => {
        p.sendMessage({ translate: "mce.load.successfully.player", with: [`${loadTime}`] })
      })
  })
})

// TESTING
system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  customCommandRegistry.registerCommand({
    name: "mce:shop",
    description: "Open a shop menu",
    permissionLevel: CommandPermissionLevel.Any,
  }, (origin) => {
    if (origin.sourceEntity && origin.sourceEntity instanceof Player) {
      const { sourceEntity: player } = origin

      system.run(() => player.runCommand("scriptevent cc:runCommand shop"))

      return {
        status: CustomCommandStatus.Success,
        message: "Shop opened."
      }
    }

    return {
      status: CustomCommandStatus.Success,
      message: "This command can only run by player."
    }
  })

  customCommandRegistry.registerCommand({
    name: "mce:pay",
    description: "mce.command.pay.description",
    permissionLevel: CommandPermissionLevel.Any,
    mandatoryParameters: [
      { name: "player", type: CustomCommandParamType.PlayerSelector },
      { name: "amount", type: CustomCommandParamType.Integer }
    ]
  }, (origin, targetPlayers, amount) => {
    if (origin.sourceEntity && origin.sourceEntity instanceof Player) {
      const { sourceEntity: player } = origin
      if (targetPlayers.length > 1) return {
        status: CustomCommandStatus.Failure,
        message: "§cToo many targets matched selector"
      } 
      
      if (targetPlayers.length < 1) return {
        status: CustomCommandStatus.Failure,
        message: "§cNo targets matched selector"
      }

      const targetPlayer = targetPlayers[0]
      system.run(() => player.runCommand(`scriptevent cc:runCommand pay ${targetPlayer.name} ${amount}`))

      return {
        status: CustomCommandStatus.Success
      }
    }

    return {
      status: CustomCommandStatus.Failure,
      message: "This command can only run by player."
    }
  })
})