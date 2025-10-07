import { ScriptEventSource } from "@minecraft/server"
import Config from "../Configuration"
import CommandBuilder from "../Modules/CommandBuilder"
import { getCooldown, setCooldown } from "../Modules/Cooldown"
import { Log } from "../Modules/Log"

/**
 * @param {import("../main").default} Server
 */
const chatSend = (Server) => {
  Server.Minecraft.world.beforeEvents.chatSend.subscribe(async (data) => {
    if (data.sender.isMuted()) {
      data.cancel = true
      return data.sender.sendMessage({ translate: "mce.player.muted" })
    }
    let player = data.sender
    let message = data.message
    let prefix = Server.getPrefix()
    if (message.startsWith(prefix)) {
      let args = data.message.slice(prefix.length).trim().split(' ')
      let command = args.shift().toLowerCase()
      let cmd = Server.Commands.getAllRegistation().find(c => c.name == command || (c.aliases && c.aliases.includes(command)))
      data.cancel = true
      if (getCooldown("command", player) > 0) return player.sendMessage({ translate: "mce.player.command.oncooldown", with: [`${getCooldown("command", player)}`] })
      if (!cmd)
        return player.sendMessage({ translate: "mce.command.unknown", with: [command] })

      Server.System.run(() => player.runCommand(`scriptevent ${cmd.id}:runCommand ${command} ${args.join(" ")}`))
      setCooldown("command", player, player.getPermission("command.cooldown"))
      Log({ translate: "mce.log.commandused", with: [player.name, cmd.name] })
    }
    if (getCooldown("chat", player) > 0) {
      data.cancel = true
      return player.sendMessage({ translate: "mce.player.chat.cooldown" })
    }

    setCooldown("chat", player, player.getPermission("chat.cooldown"))
  })

  Server.System.afterEvents.scriptEventReceive.subscribe(data => {
    if (data.sourceEntity && data.sourceEntity.typeId == "minecraft:player") {
      if (data.id != "cc:runCommand") return
      const player = data.sourceEntity
      let message = data.message
      let args = data.message.trim().split(' ')
      let command = args.shift().toLowerCase()
      let cmd = Server.Commands.getAllRegistation().find(c => c.name == command || (c.aliases && c.aliases.includes(command)))
      if (cmd) return player.runCommand(`scriptevent ${cmd.id}:runCommand ${command} ${args.join(" ")}`)
    }
  })

  Server.Commands.beforeCommandUse.subscribe(data => {
    let cmd = data.command
    let player = data.player
    if (
      !cmd ||
      (Server.Setting.get(`${cmd.category.toLowerCase()}System`) ?? true) == false ||
      (Server.Setting.get(`${cmd.settingname}System`) ?? Config.Commands[cmd.category.toLowerCase()][cmd.settingname]) == false ||
      player.hasTag(`disablecommand:${cmd.name}`) ||
      cmd.permission && !player.checkPermission(cmd.permission)
    ) {
      data.cancel = true
      return player.sendMessage({ translate: "mce.command.unknown", with: [data.inputCommand] })
    }
  })

  Server.Commands.afterCommandUse.subscribe(({ error, player, command }) => {
    if (command.permission) {
      Server.world.getAllPlayers()
        .filter(p => p && p.isAdmin())
        .filter(p => p != player)
        .forEach(p => {
          p.sendMessage(`§a${player.name} just used ${command.name} command.`)
        })
    }
    if (error) {
      player.sendMessage(`§c${error}${error?.stack ?? ""}`)
    }
  })
}

export default chatSend