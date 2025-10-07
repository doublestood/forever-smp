import { world, system } from "@minecraft/server";

function calculateMath(expression) {
  const mathExpressionRegex = /^[-+*/()\d\s]+$/;
  if (!mathExpressionRegex.test(expression)) return false
  try {
    let result = eval(expression)
    return result
  } catch(e) {
    return false
  }
}

/**
 * @param {import("../../main").default} Server
 */
const calculate = (Server) => {
  Server.Commands.register({
    name: "calculate",
    description: "mce.command.calculate.description",
    usage: "calculate <math expression>",
    category: "General"
  }, async (data, player, args) => {
    if (!args[0]) return player.sendMessage({translate: "mce.command.calculate.wrongoperations"})
    let result = calculateMath(args.join(" "))
    if (!Number.isInteger(result)) return player.sendMessage({translate: "mce.command.calculate.wrongoperations"})
    player.sendMessage({translate: "mce.command.calculate.result", with: [`${result}`]})
  })
}

export default calculate