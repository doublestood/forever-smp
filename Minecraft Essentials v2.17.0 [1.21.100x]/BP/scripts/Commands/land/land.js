import { system, world, Player } from "@minecraft/server";
import Land from "../../Modules/Land";
import * as ui from "@minecraft/server-ui"
import { ForceOpen } from "../../Modules/Forms";
import Utility from "../../Modules/Utility";
import Ranks from "../../Modules/Ranks";

const isMoving = (entity) => {
  const MathRound = (x) => {
    return Math.round(x * 1000) / 1000;
  };

  /**
   * @type {{x: number, y: number, z: number}}
   */
  const vector = {
    x: MathRound(entity.getVelocity().x),
    y: MathRound(entity.getVelocity().y),
    z: MathRound(entity.getVelocity().z)
  };

  if (vector.x === 0 && vector.y === 0 && vector.z === 0) return false;
  else return true;
};

/**
 * 
 * @param {import("../../main").default} Server 
 */
const land = (Server) => {
  const Position = {}

  Server.Commands.register({
    name: "land",
    description: "Land Claim",
    category: "Land",
    usage: "land help"
  }, async (data, player, args) => {
    const commands = {
      "startpos": {
        description: ["Set start position land"],
        permission: "land.claim",
        callback: () => {
          const block = player.dimension.getBlock(player.location).below()
          return StartPos(player, block.location)
        }
      },
      "endpos": {
        description: ["Set end position land"],
        permission: "land.claim",
        callback: () => {
          const block = player.dimension.getBlock(player.location).below()
          return EndPos(player, block.location)
        }
      },
      "claim": {
        description: ["Claim a land"],
        permission: "land.claim",
        callback: () => ClaimFunction(player, args)
      },
      "list": {
        description: ["Provides list of your land"],
        callback: () => ListFunction(player)
      },
      "unclaim": {
        description: ["Unclaim a land"],
        permission: "land.unclaim",
        callback: () => UnClaimFunction(player)
      },
      "invite": {
        description: ["Invite player to your land", ["player_name"]],
        permission: "land.invite",
        callback: () => InviteFunction(player, args.slice(1))
      },
      "kick": {
        description: ["Kick player from your land", ["player_name"]],
        permission: "land.kick",
        callback: () => KickFunction(player, args.slice(1))
      },
      "transferownership": {
        description: ["Transfer land ownership", ["player_name"]],
        permission: "land.transferOwnership",
        callback: () => TransferOwnershipFunction(player, args.slice(1))
      },
      "info": {
        description: ["Provides land information"],
        callback: () => InfoFunction(player)
      },
      "setting": {
        description: ["Setting your land permissions for everyone"],
        permission: "land.setting",
        callback: () => SettingsFunction(player)
      },
      "checkblocks": {
        description: ["States the current claim blocks of a player"],
        callback: () => player.sendMessage(`§eYour claim blocks: §r${player.getClaimBlock()} blocks`)
      },
      "players": {
        description: ["Provides list of player lands", ["player_name?"]],
        admin: true,
        callback: () => {
          player.sendMessage("§eClose Chat to Show UI!")
          return PlayerLandFunction(player, args.slice(1))
        }
      }
    }

    const HelpFunction = () => {
      const prefix = Server.Setting.get("commandPrefix")

      let message = `§eLand command list:`
      Object.keys(commands).forEach(name => {
        const options = commands[name]

        if (options.admin && !player.isAdmin()) return
        if (options.permission && (!Ranks.getLandPermission(player, options.permission) && !player.isAdmin())) return

        const cmd = `${prefix}land ${name}`
        const description = options.description
        message += `\n§e - §a${cmd} §e| ${cmd}${description[1] == undefined ? "" : ` ${description.map(v => v = `<${v}>`).join(" ")}`} (${description[0]})`
      })

      player.sendMessage(message)
    }

    if (args[0]) {
      const subcommand = commands[args[0].toLowerCase()]
      if (subcommand) {
        if (subcommand.admin && !player.isAdmin()) return HelpFunction()
        if (subcommand.permission && (!Ranks.getLandPermission(player, subcommand.permission) && !player.isAdmin())) return HelpFunction()

        return subcommand.callback()
      }
    } else HelpFunction()
  })

  /**
   * @param {Player} player 
   * @param {{x: number, y: number, z: number}} location
   * @returns 
   */
  const StartPos = (player, location) => {
    if (!Position[player.name]) Position[player.name] = {}
    Position[player.name].start = {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
      lastChange: Date.now()
    }
    return player.sendMessage(`§aSuccessfull set start pos on coordinate §ex: ${Math.floor(location.x)} z: ${Math.floor(location.z)}`);
  }

  /**
   * @param {Player} player 
   * @param {{x: number, y: number, z: number}} location
   * @returns 
   */
  const EndPos = (player, location) => {
    if (!Position[player.name]) Position[player.name] = {}
    Position[player.name].end = {
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
      lastChange: Date.now()
    }
    return player.sendMessage(`§a§aSuccessfull set end pos on coordinate §ex: ${Math.floor(location.x)} z: ${Math.floor(location.z)}`);
  }

  /**
   * @param {Player} player 
   * @param {number} args 
   */
  const ClaimConfirm = async (player, price) => {
    if (price <= 0) return true
    const ConfirmUI = new ui.MessageFormData()
      .title("§l§ePURCHASE CONFIRMATION")
      .body(`Claim Land for §e${Utility.formatMoney(price)}§r?`)
      .button2("§l§aACCEPT")
      .button1("§l§cCANCEL")

    player.sendMessage("§eClose Chat to Show UI!")
    let res = await ForceOpen(player, ConfirmUI)
    if (!res.canceled) {
      if (res.selection == 1) return true
    }
    return false
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const ClaimFunction = async (player, args) => {
    if (!Position[player.name])
      return player.sendMessage("§cYou haven't set position.")
    if (!Position[player.name].start)
      return player.sendMessage("§cYou haven't set start position.")
    if (!Position[player.name].end)
      return player.sendMessage("§cYou haven't set end position.")

    const { start, end } = Position[player.name];
    const calculatedSize = Land.calculateLandSize(start, end);
    if (Server.Setting.get("costClaimBlock") && calculatedSize > player.getClaimBlock())
      return player.sendMessage("§cInsufficient claim blocks.")
    let moneyCost = Server.Setting.get("moneyCostperBlock") * calculatedSize
    const playerMoney = player.getMoney()
    if (moneyCost > playerMoney)
      return player.sendMessage(`§cInsufficient funds. §ePrice: ${await Utility.formatMoney(moneyCost)}`)

    const checkOverlap = Land.checkOverlap(start, end, player)
    if (checkOverlap.isInside)
      return player.sendMessage(`§cYour land is overlapping with others land`);

    const Confirm = await ClaimConfirm(player, moneyCost)
    if (!Confirm) {
      delete Position[player.name]
      return player.sendMessage("§cCanceled!")
    }

    const landResult = await Land.createLand(player, { x: start.x, z: start.z }, { x: end.x, z: end.z })
    delete Position[player.name]

    if (!landResult.created)
      return player.sendMessage(`§cYour land is overlapping with others land`);

    await player.setMoney(playerMoney - moneyCost)
    if (Server.Setting.get("costClaimBlock")) player.setClaimBlock(player.getClaimBlock() - calculatedSize)

    const landCenter = Land.getCenter(start, end)
    Server.Log(`[Land] ${player.name} created land on ${player.dimension.id} | x: ${landCenter.x} z: ${landCenter.z}`)
    return player.sendMessage(`§aSuccessfully created new land${moneyCost > 0 ? ` §awith price: §e${Utility.formatMoney(moneyCost)}.` : "."}`);
  }

  /**
   * @param {Player} player 
   */
  const ListFunction = async (player) => {
    const playerLands = Land.getLands(player.name);
    if (playerLands.length === 0)
      return player.sendMessage("§e----- Your lands -----\nNo lands found.");

    const lands = []
    let landCount = 1
    playerLands
      .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
      .forEach(
        (land) => {
          lands.push(`§e#${landCount}. §7Land: \n §e> §7Dimension: §e${land.landDimension.split(":")[1]
            }\n §e> §7Position: ${land.landCenter.x}, ${land.landCenter.z}\n §e> §7Members: §e${land.invites.join(", ") || "None."
            }\n §e> §7Created at: §b${land.creationDate || 0}`)
          landCount += 1
        })
    return player.sendMessage(`§e----- Your lands -----\n${lands.join("\n\n")}`);
  }

  /**
   * @param {Player} player 
   */
  const UnClaimFunction = async (player) => {
    const land = Land.testLand(player.dimension.getBlock(player.location).below().location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
    if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")
    const { start, end } = land.data.land
    const calculatedSize = Land.calculateLandSize(start, end);
    let deleteResult = await Land.deleteLand(land.id, land.owner)
    if (deleteResult.error) return player.sendMessage(deleteResult.error)
    if (player.name == land.owner) player.setClaimBlock(player.getClaimBlock() + calculatedSize)
    return player.sendMessage("§aSuccessfully unclaim this land!")
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const InviteFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (player == targetPlayer) return player.sendMessage("§cYou may not invite yourself.")
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name) return player.sendMessage("§cYou do not have permission!")
      if (land.invites.includes(targetPlayer.name)) return player.sendMessage(`§c${targetPlayer.name} is already member of land!`)
      await Land.invitePlayer(land.id, player.name, targetPlayer.name)
      targetPlayer.sendMessage(`§a${player.name} give you access to their land.`)
      player.sendMessage("§aInvited successfully!")
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const KickFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      if (player == targetPlayer) return player.sendMessage("§cYou may not kick yourself.")
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name) return player.sendMessage("§cYou do not have permission!")
      if (!land.invites.includes(targetPlayer.name)) return player.sendMessage(`§c${targetPlayer.name} is not member of land!`)
      await Land.removeInvite(land.id, player.name, targetPlayer.name)
      targetPlayer.sendMessage(`§a${player.name} remove your access to their land.`)
      player.sendMessage("§aKicked successfully!")
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   * @param {string[]} args 
   */
  const TransferOwnershipFunction = async (player, args) => {
    if (!args[0]) return player.sendMessage("§cInput a player name.")
    let targetPlayer = Server.getPlayer(args[0])
    if (targetPlayer != undefined) {
      const land = Land.testLand(player.location, player.dimension)
      if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
      if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")
      if (land.owner == targetPlayer) return player.sendMessage("§cYou are the owner this land.")
      await Land.transferOwnership(land.id, land.owner, targetPlayer.name)
      targetPlayer.sendMessage(`§a${land.owner} gives ownership to you.`)
      player.sendMessage(`§aSuccessfully transfer ownership to ${targetPlayer.name}.`)
    } else {
      return player.sendMessage("§cNo targets matched selector")
    }
  }

  /**
   * @param {Player} player 
   */
  const PlayerLandFunction = async (player, args) => {
    if (args[0]) {
      let targetPlayer = Server.getPlayer(args[0])
      if (targetPlayer) return PlayerLand(player, targetPlayer.name)
    }
    let players = world.getAllPlayers().map(p => p.name)
    Object.keys(Land.getAllLands()).forEach(p => {
      if (!players.includes(p)) players.push(p)
    })
    players = players.sort((a, b) => a.localeCompare(b))
    if (players.length <= 0) return player.sendMessage("§cNo players detected")
    let playerPanel = new ui.ActionFormData()
      .title("§l§ePlayers List")
      .body(`§aPlayers Online : §e${world.getAllPlayers().length}`)
    players.forEach(p => {
      playerPanel.button(`§l§e${p} ${world.getAllPlayers().find(pl => pl.name == p) == undefined ? "" : "§8(§aOnline§8)"}`)
    })

    ForceOpen(player, playerPanel).then(res => {
      if (!res.canceled) {
        const targetName = players[res.selection]
        return PlayerLand(player, targetName)
      }
    })
  }

  /**
   * @param {Player} player 
   * @param {Player} targetPlayer 
   */
  const PlayerLand = (player, targetName) => {
    const PlayerLands = Land.getLands(targetName)
    let count = 1
    let landPanel = new ui.ActionFormData()
      .title(`§l§e${targetName}'s Lands`)
      .body(`§aLands : §e${PlayerLands.length}`)
    PlayerLands.forEach(p => {
      landPanel.button(`§e#${count}\n§0X: ${p.landCenter.x} | Z: ${p.landCenter.z}`)
      count += 1
    })
    landPanel.button("§l§c<== BACK")

    ForceOpen(player, landPanel).then(res => {
      if (!res.canceled) {
        let land = PlayerLands[res.selection]
        if (!land) return PlayerLandFunction(player, [])
        let landPanel = new ui.ActionFormData()
          .title(`§l§e${targetName}'s Lands`)
          .body(`§e#${res.selection + 1}. §7Land: \n §e> §7Dimension: §e${land.landDimension.split(":")[1]
            }\n §e> §7Position: ${land.landCenter.x}, ${land.landCenter.z}\n §e> §7Members: §e${land.invites.join(", ") || "None."
            }\n §e> §7Created at: §b${land.creationDate || 0}`)

          .button("§l§2Teleport")
          .button("§l§4Delete")
          .button("§l§c<== BACK")

        ForceOpen(player, landPanel).then(res => {
          if (!res.canceled) {
            switch (res.selection) {
              case 0:
                land.landCenter.y = player.location.y
                return player.teleport(land.landCenter)
              case 1:
                const deleteLand = Land.deleteLand(land.landId, targetName)
                if (deleteLand.error) {
                  if (deleteLand.error == "NotFound") return player.sendMessage("§cLand not found!")
                } else return player.sendMessage("§aSuccessfully delete land!")
              default:
                return PlayerLand(player, targetName)
            }
          }
        })
      }
    })
  }

  /**
   * 
   * @param {Player} player 
   * @returns 
   */
  const InfoFunction = (player) => {
    const land = Land.testLand(player.dimension.getBlock(player.location).location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")


    const width = Math.abs(land.data.land.end.x - land.data.land.start.x) + 1;
    const depth = Math.abs(land.data.land.end.z - land.data.land.start.z) + 1;
    player.sendMessage(`§eLand Information:\n` +
      `§f- §7Owner: §e${land.owner}\n` +
      `§f- §7Members: §e${land.invites.join(", ") || "None."}\n` +
      `§f- §7Size: §e${width}x${depth} (${Land.calculateLandSize(land.data.land.start, land.data.land.end)} blocks)`);
    if (!CooldownMark.includes(player.name)) {
      const { start, end } = land.data.land
      CooldownMark.push(player.name)
      const particle = system.runInterval(() => ParticleLand(start, end, player, player.location.y), 5)
      system.runTimeout(() => {
        system.clearRun(particle)
        CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
      }, 20 * 5)
    }
  }
  /**
   * 
   * @param {Player} player 
   */
  const SettingsFunction = async (player) => {
    const SettingList = {
      "Allow Building (Not Working)": "building",
      "Allow Breaking": "breaking",
      "Allow Open Container": "openContainer",
      "Allow Open Ender Chest": "openEnderChest",
      "Allow Open Door": "openDoor",
      "Allow Open Fence Gate": "openFenceGate",
      "Allow Push Button": "pushButton",
      "Allow Use Lever": "useLever",
      "Allow Use Crafting Table": "useCraftingTable",
      "Allow Interact with Mobs": "interactWithMobs"
    }

    const land = Land.testLand(player.location, player.dimension)
    if (!land.isInside) return player.sendMessage("§cYou have to stand in land!")
    if (land.owner != player.name && !player.isAdmin()) return player.sendMessage("§cYou do not have permission!")

    const SettingUI = new ui.ModalFormData()
      .title("Land Settings")
    Object.keys(SettingList).forEach(settingName => {
      SettingUI.toggle(settingName, { defaultValue: land.setting[SettingList[settingName]] })
    })

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, SettingUI).then(async res => {
      if (!res.canceled) {
        const newSetting = {}
        for (let i = 0; i < res.formValues.length; i++) {
          const settingName = Object.keys(SettingList)[i]
          const setting = SettingList[settingName]
          const value = res.formValues[i]

          newSetting[setting] = value
          // console.warn(setting, value)
        }

        await Land.setSetting(land.id, land.owner, newSetting)
        return player.sendMessage("§aSuccessfully saved settings!")
      }
    })
  }

  // Land System
  const CooldownNotify = {}
  const CooldownMark = []
  const NotifyText = (player, message) => {
    const Cooldown = CooldownNotify[player.name] ?? (Date.now() - 500)
    if (Date.now() - Cooldown >= 500) player.sendMessage(message)
    CooldownNotify[player.name] = Date.now()
  }
  const checkPermission = (player, location, data) => {
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(location, player.dimension)
    if (land.isInside) {
      if (land.owner != player.name && !land.invites.includes(player.name)) {
        data.cancel = true
        const Cooldown = CooldownNotify[player.name] ?? (Date.now() - 500)
        if (Date.now() - Cooldown >= 500) player.sendMessage(`§cYou can not do that here! Land owner: §e${land.owner}.`)
        CooldownNotify[player.name] = Date.now()
        if (!CooldownMark.includes(player.name)) {
          const { start, end } = land.data.land
          CooldownMark.push(player.name)
          const particle = system.runInterval(() => ParticleLand(start, end, player, location.y), 5)
          system.runTimeout(() => {
            system.clearRun(particle)
            CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
          }, 20 * 3)
        }
      }
    }
  }

  world.beforeEvents.playerBreakBlock.subscribe(data => {
    const { player, block } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (land.setting.breaking) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerPlaceBlock.subscribe(data => {
    const { player, block } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      // if (land.setting.building) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    const { player, block, itemStack } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(block.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (itemStack && itemStack.typeId.includes("bucket")) return data.cancel = true
      if (block.getComponent("minecraft:inventory") != undefined && land.setting.openContainer) return
      if (block.typeId == "minecraft:ender_chest" && land.setting.openEnderChest) return
      if (block.typeId.includes("door") && land.setting.openDoor) return
      if (block.typeId.includes("fence_gate") && land.setting.openFenceGate) return
      if (block.typeId.includes("button") && land.setting.pushButton) return
      if (block.typeId == "minecraft:lever" && land.setting.useLever) return
      if (block.typeId == "minecraft:crafting_table" && land.setting.useCraftingTable) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, block.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.playerInteractWithEntity.subscribe(data => {
    const { player, target } = data
    if (data.cancel || player.isAdmin()) return
    const land = Land.testLand(target.location, player.dimension)
    if (land.isInside) {
      if (land.owner == player.name || land.invites.includes(player.name)) return
      if (land.setting.interactWithMobs) return
      data.cancel = true
      NotifyText(player, `§cYou can not do that here! Land owner: §e${land.owner}.`)
      if (!CooldownMark.includes(player.name)) {
        const { start, end } = land.data.land
        CooldownMark.push(player.name)
        const particle = system.runInterval(() => ParticleLand(start, end, player, target.location.y), 5)
        system.runTimeout(() => {
          system.clearRun(particle)
          CooldownMark.splice(CooldownMark.findIndex(p => p == player.name), 1)
        }, 20 * 3)
      }
    }
  })
  world.beforeEvents.explosion.subscribe(data => {
    if (!Server.Setting.get("protectLandfromExplosion")) return
    const impact = data.getImpactedBlocks().filter(block => {
      const land = Land.testLand(block.location, block.dimension)
      return !land.isInside
    })
    data.setImpactedBlocks(impact)
  })
  // world.beforeEvents.pistonActivate.subscribe(data => {
  //   if (Setting.get("allowPistonInLand")) return
  //   data.piston.getAttachedBlocks().forEach(location => {
  //     const land = Land.testLand(location, data.dimension)
  //     if (land.isInside) data.cancel = true
  //   })
  // })

  // Land Claim by Item
  const CooldownSet = {}
  world.beforeEvents.playerInteractWithBlock.subscribe(data => {
    if (data.cancel) return
    const { player, itemStack } = data
    if (itemStack?.typeId == Server.Setting.get("itemClaimLand")) {
      const Cooldown = CooldownSet[player.name] ?? Date.now()
      data.cancel = true
      if (Cooldown > Date.now()) return
      if (player.isSneaking) {
        EndPos(player, data.block.location)
      } else {
        StartPos(player, data.block.location)
      }
      CooldownSet[player.name] = Date.now() + 500
    }
  })

  // Particle
  const calculateCorner = (coordinate1, coordinate2) => {
    const { x: x1, z: z1 } = coordinate1;
    const { x: x2, z: z2 } = coordinate2;

    const corner1 = { x: x1, z: z1 };
    const corner2 = { x: x1, z: z2 };
    const corner3 = { x: x2, z: z2 };
    const corner4 = { x: x2, z: z1 };

    const corners = [corner1, corner2, corner3, corner4];

    return corners;
  }

  const ParticleLand = (start, end, player, y) => {
    calculateCorner(start, end).forEach(c => {
      try { player?.spawnParticle(Server.Setting.get("particleClaim"), { x: c.x + 0.5, y: y + 1.30, z: c.z + 0.5 }) } catch (err) { }
    })
    const center = Land.getCenter(start, end)
    try { player?.spawnParticle(Server.Setting.get("particleClaim"), { x: center.x + 0.5, y: y + 1.30, z: center.z + 0.5 }) } catch (err) { }
  }

  system.runInterval(() => {
    for (const playerName in Position) {
      const location = Position[playerName]
      const startLocation = location.start
      const endLocation = location.end
      if (startLocation && (Date.now() - startLocation.lastChange) >= 300000) delete Position[playerName].start
      if (endLocation && (Date.now() - endLocation.lastChange) >= 300000) delete Position[playerName].end
    }
  }, 5)

  system.runInterval(() => {
    for (const playerName in Position) {
      const location = Position[playerName]
      const startLocation = location.start
      const endLocation = location.end
      const player = world.getAllPlayers().find(p => p.name == playerName)
      if (startLocation && endLocation) {
        ParticleLand(startLocation, endLocation, player, Math.max(startLocation.y, endLocation.y))
      } else {
        if (startLocation) player?.spawnParticle(Server.Setting.get("particleClaim"), { x: startLocation.x + 0.5, y: startLocation.y + 1.30, z: startLocation.z + 0.5 })
        if (endLocation) player?.spawnParticle(Server.Setting.get("particleClaim"), { x: endLocation.x + 0.5, y: endLocation.y + 1.30, z: endLocation.z + 0.5 })
      }
    }
  }, 10)

  const Notify = (player, text) => {
    switch (Server.Setting.get("notifyLand").toLowerCase()) {
      case "chat":
        return player.sendMessage(text)

      case "actionbar":
        return player.onScreenDisplay.setActionBar(text)

      case "title":
        return player.onScreenDisplay.setTitle(text)

      default:
        return
    }
  }

  const LandLog = {}
  system.runInterval(() => {
    world.getAllPlayers().forEach(player => {
      if (!player || !player.isValid) return
      try {
        if (!isMoving(player)) return
        if (player.location.y <= -63) return
        let land = Land.testLand(player.dimension.getBlock(player.location).location, player.dimension)
        if (!land.isInside && LandLog[player.name]) {
          land = LandLog[player.name]
          delete LandLog[player.name]
          Notify(player, `§eYou have left ${land.owner}'s land.`)
        } else if (land.isInside) {
          const landOld = LandLog[player.name]
          if (!landOld || (landOld.owner != land.owner && landOld.id != land.id)) {
            LandLog[player.name] = land
            Notify(player, `§eYou are entering ${land.owner}'s land`)
          }
        }
      } catch (e) {

      }
    })
  }, 5)
}

export default land