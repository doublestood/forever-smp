const broadcast = (Server) => {
  Server.Commands.register({
    name: "broadcast",
    description: "mce.command.broadcast.description",
    usage: "broadcast <message>",
    aliases: ["bc"],
    permission: "broadcast",
    category: "Admin"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({ translate: "mce.command.broadcast.inputmessages" })
    // await Server.sendMessage("§c§l[Broadcast]§r " + args.join(" "))
    let message = []
    message.push({ text: "§c§l[" })
    message.push({ translate: "mce.command.broadcast" })
    message.push({ text: "]§r " })
    message.push({ translate: args.join(" ") })
    await Server.sendMessage({ rawtext: message })
    await player.sendMessage({ translate: "mce.command.broadcast.sent" })
  })
}

export default broadcast