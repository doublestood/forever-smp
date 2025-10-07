/**
 * @param {import("../main").default} Server
 */
const playerlist = (Server) => {
  Server.Commands.register({
    name: "playerlist",
    description: "mce.command.playerlist.description",
    usage: "playerlist",
    category: "General"
  }, async (data, player, args) => {
    let message = []
    message.push({ translate: "mce.command.playerlist.header" })
    let players = Server.world.getAllPlayers().sort((a, b) => Server.PlayerOnline[a.name] - Server.PlayerOnline[b.name])
    for (const plr of players) {
      const DateNow = new Date()
      const DateLogin = Server.PlayerOnline[plr.name]
      const SecondPlayed = Math.ceil((DateNow - DateLogin) / 1000);
      message.push({ text: `\n` }, { translate: "mce.command.playerlist.onlinefor.header", with: [plr.name] }, { text: " " })
      if (SecondPlayed >= 86400) {
        let day = Math.floor(SecondPlayed / 86400)
        message.push({ translate: "mce.command.playerlist.onlinefor.days", with: [`${day}`]}, {text: ", "})
      }
      if (SecondPlayed >= 3600) {
        let hour = Math.floor(SecondPlayed / 3600)
        message.push({ translate: "mce.command.playerlist.onlinefor.hours", with: [`${hour % 24}`]}, {text: ", "})
      }
      if (SecondPlayed >= 60) {
        let minute = Math.floor(SecondPlayed / 60)
        message.push({ translate: "mce.command.playerlist.onlinefor.minutes", with: [`${minute % 60}`]}, {text: ", "})
      }
      let second = SecondPlayed
      message.push({ translate: "mce.command.playerlist.onlinefor.seconds", with: [`${second % 60}`]})
    }
    player.sendMessage({ rawtext: message })
  })
}

export default playerlist