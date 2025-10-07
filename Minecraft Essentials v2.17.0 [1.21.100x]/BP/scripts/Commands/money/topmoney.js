import Utility from "../../Modules/Utility"

/**
 * @param {import("../../main").default} Server
 */
const topmoney = (Server) => {
  Server.Commands.register({
    name: "topmoney",
    description: "mce.command.topmoney.description",
    aliases: ["topbal", "topbalance"],
    usage: "topmoney <page?>",
    category: "Money"
  }, async (data, player, args) => {
    let BalanceData = Server.Money.getAllMoney()
    BalanceData = BalanceData.filter(data => !Server.BanDB.get(data.playerName))
    
    if (BalanceData.length <= 0) return player.sendMessage("")
    BalanceData = BalanceData.sort((a, b) => b.playerMoney - a.playerMoney)
    if (!args[0]) args[0] = 1
    let selectedPage = args[0]

    const pages = [];
    for (let i = 0; i < BalanceData.length; i += 10) {
      const page = BalanceData.slice(i, i + 10);
      pages.push(page);
    }
    if (selectedPage > pages.length) selectedPage = pages.length

    let message = []
    message.push({ translate: "mce.command.topmoney.header" })
    let i = 1 + ((selectedPage - 1) * 10)
    for (const data of pages[selectedPage - 1]) {
      if (!data) continue
      let playerName = data.playerName
      let playerMoney = Number(data.playerMoney)
      message.push({ text: `\n§a${i}. ${playerName}: §e${Utility.formatMoney(playerMoney)}` })
      i++
    }
    player.sendMessage({ rawtext: message })
  })
}

export default topmoney