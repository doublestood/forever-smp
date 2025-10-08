import { Player, world } from "@minecraft/server"
import Config from "../Configuration"
import * as MCE from "../Modules/MinecraftEssentials"
import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { ForceOpen } from "../Modules/Forms"
import Restful from "../Modules/Restful"

/**
 * @param {import("../main").default} Server 
 */
const compassMenu = (Server) => {
  const inUI = {}
  const FunctionUI = {}

  /**
   * @type {{ buttonDisplay: string, buttonImage?: string, direct: { scriptEvent?: string }}[]}
   */
  const externalButton = []
  Restful.listen("registerMenuToMCE", (data) => {
    externalButton.push(data)
    console.log(`[Menu] ${data.buttonDisplay} registered.`)
    return { status: 200 }
  })

  world.beforeEvents.itemUse.subscribe(async data => {
    const { source: player, itemStack } = data
    if (data.cancel || itemStack.typeId != Config.compassMenu.ItemId) return
    data.cancel = true
    await null;
    OpenMenu(player)
  })

  Server.Commands.register({
    name: "menu",
    category: "General",
    description: "Open a menu",
    usage: "menu"
  }, (data, player, args) => {
    player.sendMessage({ translate: "mce.ui.closechat" })
    OpenMenu(player)
  })

  /**
   * @param {Player} player 
   */
  const OpenMenu = (player) => {
    let gotDisabled = false
    if (player.checkTag("disablecompass")) gotDisabled = true
    if (gotDisabled || inUI[player.name]) return
    const Button = []
    if (Server.Setting.get("homeSystem")) Button.push({ type: "Home", text: "Homes", texture: "textures/icons/home" })
    Button.push({ type: "Warp", text: "Warps", texture: "textures/icons/warps" })
    Button.push({ type: "Players", text: "Players", texture: "textures/icons/players" })
    if (Server.Setting.get("auctionSystem")) Button.push({ type: "Auction", text: "Auction House", texture: "textures/blocks/chest_front" })
    if (Server.Setting.get("shopSystem")) Button.push({ type: "Shop", text: "Shop", texture: "textures/icons/shop" })
    if (Server.Setting.get("sellSystem")) Button.push({ type: "Sell", text: "Sell", texture: "textures/icons/sell" })
    const MenuUI = new ActionFormData()
      .title("Menu")
      .body("Select actions")
    Button.forEach(b => {
      MenuUI.button(b.text, b.texture)
    })
    externalButton.forEach(b => {
      MenuUI.button(b.buttonDisplay, b.buttonImage)
    })

    inUI[player.name] = true
    ForceOpen(player, MenuUI).then(async res => {
      if (!res.canceled) {
        if (res.selection < Button.length) {
          await FunctionUI[Button[res.selection].type](player)
        } else {
          const data = externalButton[res.selection - Button.length]
          if (data.direct.scriptEvent) player.runCommand(`scriptevent ${data.direct.scriptEvent}`)
        }
      }
      inUI[player.name] = false
    })
  }

  const Homes = {}
  Homes.create = (player) => {
    const CreateHomeUI = new ModalFormData()
      .title("Create Home")
      .textField("Input home name", "Input here")

    ForceOpen(player, CreateHomeUI).then(async res => {
      if (!res.canceled) {
        const [homeName] = res.formValues
        if (homeName == "") return player.sendMessage("You have to complete form!")
        return MCE.runCommand(player, `sethome ${homeName}`)
      }
    })
  }

  Homes.remove = (player) => {
    const HomesList = []
    for (const [key] of Server.HomeDB.entries()) {
      const playerName = key.split("-")[0]
      const homeName = key.substring(`${playerName}-`.length)
      if (playerName == player.name) HomesList.push(homeName)
    }
    if (HomesList.length <= 0) return player.sendMessage({ translate: "mce.command.listhome.nohome" })
    const RemoveHomeUI = new ModalFormData()
      .title("Remove Home")
      .dropdown("Select home", HomesList)

    ForceOpen(player, RemoveHomeUI).then(async res => {
      if (!res.canceled) {
        const [homeSelect] = res.formValues
        const homeName = HomesList[homeSelect]
        return MCE.runCommand(player, `delhome ${homeName}`)
      }
    })
  }

  Homes.list = (player) => {
    const HomesList = {}
    for (const [key, homeData] of Server.HomeDB.entries()) {
      const [playerName, homeName] = key.split("-")
      if (playerName !== player.name || homeName == undefined) continue
      HomesList[homeName] = homeData
    }
    if (Object.keys(HomesList).length <= 0) return player.sendMessage({ translate: "mce.command.listhome.nohome" })
    const ListHomeUI = new ActionFormData()
      .title("List Home")
      .body("Select Home")
    for (const home in HomesList) {
      ListHomeUI.button(`${home}\n§eClick to teleport`)
    }

    ForceOpen(player, ListHomeUI).then(async res => {
      if (!res.canceled) {
        const homeSelect = res.selection
        const homeName = Object.keys(HomesList)[homeSelect]
        return MCE.runCommand(player, `home ${homeName}`)
      }
    })
  }
  /**
   * @param {Player} player 
   */
  FunctionUI.Home = (player) => {
    const MenuUI = new ActionFormData()
      .title("Home Menu")
      .body("Select actions")
      .button("Create Home")
      .button("List Home")
      .button("Remove Home")

    ForceOpen(player, MenuUI).then(async res => {
      if (!res.canceled) {
        switch (res.selection) {
          case 0:
            return Homes.create(player)

          case 1:
            return Homes.list(player)

          case 2:
            return Homes.remove(player)

          default: break;
        }
      }
    })
  }

  const Warps = {}
  /**
   * 
   * @param {Player} player 
   * @param {*} warpName 
   * @param {*} warpData 
   */
  Warps.panel = (player, warpName, warpData) => {
    const WarpUI = new ActionFormData()
      .title("Warp Menu")
      .body("Select actions")
      .button("§eTeleport")
    if (player.checkPermission("warp")) WarpUI.button("§cRemove")

    ForceOpen(player, WarpUI).then(async res => {
      if (!res.canceled) {
        switch (res.selection) {
          case 0:
            return await MCE.runCommand(player, `warp ${warpName}`)

          case 1:
            return await MCE.runCommand(player, `delwarp ${warpName}`)
        }
      }
    })
  }
  /**
   * @param {Player} player 
   */
  FunctionUI.Warp = async (player) => {
    const WarpsList = {}
    for (const [warpName, warpData] of Server.WarpDB.entries()) {
      WarpsList[warpName] = warpData
    }
    const WarpsName = Object.keys(WarpsList)
    if (WarpsName.length <= 0) return player.sendMessage({ translate: "mce.command.listwarp.nowarp" })
    const WarpUI = new ActionFormData()
      .title("Warp Menu")
      .body("Select warps")
    WarpsName.forEach(w => WarpUI.button(w))

    ForceOpen(player, WarpUI).then(res => {
      if (!res.canceled) {
        const WarpName = WarpsName[res.selection]
        const Warp = WarpsList[WarpName]

        return Warps.panel(player, WarpName, Warp)
      }
    })
  }

  const Players = {}
  Players.pay = (player, targetPlayer) => {
    const PayUI = new ModalFormData()
      .title("Pay")
      .textField("Input amount", "Input here")

    ForceOpen(player, PayUI).then(res => {
      if (!res.canceled) {
        const [amount] = res.formValues
        return MCE.runCommand(player, `pay "${targetPlayer.name}" ${amount}`)
      }
    })
  }

  Players.message = (player, targetPlayer) => {
    const MessageUI = new ModalFormData()
      .title("Message")
      .textField("Input message", "Input message here")

    ForceOpen(player, MessageUI).then(res => {
      if (!res.canceled) {
        const [message] = res.formValues
        return MCE.runCommand(player, `message "${targetPlayer.name}" ${message}`)
      }
    })
  }

  Players.panel = (player, targetPlayer) => {
    const PlayersUI = new ActionFormData()
      .title(`${targetPlayer.name}'s Menu`)
      .body("Select actions")
      .button("Pay")
      .button("Message")
      .button("Send TPA request")
      .button("Send TPAHERE request")

    ForceOpen(player, PlayersUI).then(res => {
      if (!res.canceled) {
        switch (res.selection) {
          case 0: return Players.pay(player, targetPlayer)
          case 1: return Players.message(player, targetPlayer)
          case 2: return MCE.runCommand(player, `tpa "${targetPlayer.name}"`)
          case 3: return MCE.runCommand(player, `tpahere "${targetPlayer.name}"`)
        }
      }
    })
  }

  FunctionUI.Players = (player) => {
    const PlayersName = world.getAllPlayers().map(p => p.name)

    const PlayersUI = new ActionFormData()
      .title("Players Menu")
      .body("Select players")
    PlayersName.forEach(p => PlayersUI.button(p))

    ForceOpen(player, PlayersUI).then(res => {
      if (!res.canceled) {
        const targetPlayer = world.getAllPlayers().find(p => p.name == PlayersName[res.selection])
        return Players.panel(player, targetPlayer)
      }
    })
  }

  FunctionUI.Auction = (player) => { return MCE.runCommand(player, "auctionhouse") }
  FunctionUI.Shop = (player) => { return MCE.runCommand(player, "shop") }
  FunctionUI.Sell = (player) => { return MCE.runCommand(player, "sell") }
}

export default compassMenu