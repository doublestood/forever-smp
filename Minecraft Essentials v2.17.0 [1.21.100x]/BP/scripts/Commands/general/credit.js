import Restful from "../../Modules/Restful"

/**
* @type {{ addonName: string, creator: string, version: string }[]}
*/
const credits = []
Restful.listen("registerCreditToMCE", (data) => {
  credits.push(data)
  return { status: 200 }
})

/**
 * @param {import("../../main").default} Server
 */
const credit = (Server) => {
  Server.Commands.register({
    name: "credit",
    description: "mce.command.credit.description",
    usage: "credit",
    category: "General"
  }, async (data, player, args) => {
    let credit = "§eAddon Credits:"
    credit += `\n§e - Minecraft Essentials v${Server.Version}: §aPaoeni`
    if (Server.BetterScoreboard.installed) credit += `\n§e - Better Scoreboard v${Server.BetterScoreboard.version}: §aPaoeni`
    for (const data of credits) {
      credit += `\n§e - ${data.addonName} v${data.version}: §a${data.creator}`
    }
    player.sendMessage({ text: credit })
  })
}

export default credit