import Sell from "../../Modules/Data/Sell"
import Shop from "../../Modules/Data/Shop"
import { ResetData } from "../../Modules/Forms"
import Ranks from "../../Modules/Ranks"

const DataList = {
  "ALL DATA": "all",
  "MONEY DATA": "money",
  "HOME DATA": "home",
  "WARP DATA": "warp",
  "BAN DATA": "ban",
  "SETTING DATA": "setting",
  "SHOP DATA": "shop",
  "SELL DATA": "sell",
  "RANK DATA": "rank"
}

const resetdata = (Server) => {
  Server.Commands.register({
    name: "resetdata",
    description: "mce.command.resetdata.description",
    usage: "resetdata",
    permission: "resetdata",
    category: "Admin"
  }, async (data, player, args) => {
    player.sendMessage({ translate: "mce.ui.closechat" })
    let selectedData = await ResetData.selectData(player, Object.keys(DataList))
    if (selectedData == undefined) return player.sendMessage({ translate: "mce.command.resetdata.canceled" })
    let confirmReset = await ResetData.confirmReset(player, selectedData)
    if (!confirmReset) return player.sendMessage({ translate: "mce.command.resetdata.canceled" })
  
    try {
      switch (DataList[selectedData]) {
        case "all":
          await Server.Money.resetData()
          await Server.HomeDB.clear()
          await Server.WarpDB.clear()
          await Server.BanDB.clear()
          await Server.Setting.resetAll()
          await Shop.resetData()
          await Sell.resetData()
          break
  
        case "money":
          await Server.Money.resetData()
          break
  
        case "home":
          await Server.HomeDB.clear()
          break
  
        case "warp":
          await Server.WarpDB.clear()
          break
  
        case "ban":
          await Server.BanDB.clear()
          break
  
        case "setting":
          await Server.Setting.resetAll()
          break
  
        case "shop":
          await Shop.resetData()
          break
  
        case "sell":
          await Sell.resetData()
          break

        case "rank":
          Ranks.resetRanks()
          break
  
        default:
          return player.sendMessage({ translate: "mce.command.resetdata.unknown" })
      }
    } catch (err) {
      return player.sendMessage(`§c[Error] ${err}, send this error to discord!`)
    }
    player.sendMessage({ translate: "mce.command.resetdata.successfully" })
  })
}

export default resetdata