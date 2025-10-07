import { world, system, Player } from '@minecraft/server'
import { ActionFormData, ModalFormData, FormCancelationReason, MessageFormData } from "@minecraft/server-ui"
import { ForceOpen } from '../../Modules/Forms'

// CREDIT: @kuystmark

/**
 * @param {import("../../main").default} Server 
 */
const report = (Server) => {
  Server.Commands.register({
    name: "report",
    description: "mce.command.report.description",
    usage: "report",
    category: "General"
  }, async (data, player, args) => {
    const ui = new ActionFormData()
      .title("§eReport Menu")
      .body(`Select actions`)
      .button(`§bCreate Report\n§fClick to Create`, "textures/items/ender_pearl")
    if (player.checkPermission("report")) ui.button("§bView Reports\n§fClick to View", "textures/ui/Friend2")

    player.sendMessage("§eClose Chat to Show UI!")
    ForceOpen(player, ui).then(res => {
      if (!res.canceled) {
        if (res.selection === 0) makeReport(player)
        if (res.selection === 1 && player.checkPermission("report")) viewReports(player)
      }
    })
  })

  const reportDB = Server.ReportDB

  /**
   * @param {Player} player 
   */
  const makeReport = (player) => {
    const typeOptions = ['Player Report', 'Server Report']
    const playersList = world.getAllPlayers().map(p => p.name)//.filter(p => p != player)
    let create = new ModalFormData()
      .title("§eReport Form")
      .textField("§7Type your Reason for Reporting Here:", "e.g. Fly Hacking§r")
      .dropdown('\n§7Select User Target - Only if you are Reporting a User:', playersList)
      .dropdown('\n§7Report Type:', typeOptions)

    ForceOpen(player, create).then((res) => {
      if (!res.canceled) {
        const reporter = player.name
        const reportField = res.formValues[0]
        const playerTarget = res.formValues[1]
        const typeIndex = res.formValues[2]
        const createdAt = new Date().toLocaleString()
        const type = typeOptions[typeIndex]
        if (!reportField)
          return player.sendMessage("§cInvalid Response!")
        const fullReport = {
          reportData: {
            reporter,
            target: playersList[playerTarget],
            reportText: reportField,
            type,
            createdAt
          }
        }
        reportDB.set(`${player.name}-${Date.now()}`, fullReport)
        Server.world.getAllPlayers()
          .filter(p => p && p.isAdmin())
          .forEach(p => {
            p.sendMessage(`§a${player.name} just created report.`)
          })
        player.sendMessage("§aReport Form Submitted!")
      }
    })
  }

  const viewReports = (player) => {
    if (!reportDB.length)
      return player.sendMessage("§cThere are no Reports at the moment.")
    const reportList = reportDB.keys()
    let reportsForm = new ActionFormData()
      .title("§eReport Form")
      .body("Select a Report to view:")

    let number = 1
    for (const id of reportList) {
      const data = reportDB.get(id)
      if (!data) {
        reportList.splice(reportList.indexOf(id), 1)
        continue
      }
      const buttonLabel = `§f${data.reportData.reporter}\n§f[§8#${number}§f]§r`
      reportsForm.button(buttonLabel)
      number++
    }
    ForceOpen(player, reportsForm).then(res => {
      if (!res.canceled && player.checkPermission("report")) {
        let reportId = reportList[res.selection]
        const data = reportDB.get(reportId)?.reportData
        if (!data) return
        showReport(player, reportId, data)
      }
    })
  }

  const showReport = (player, reportId, reportData) => {
    let ui = new ActionFormData()
      .title("§eReport")
      .body(`§7Report Form§r\n\n${formatFullReport(reportData)}`)
      .button("§4Delete Report")
      .button(`§cClose`)

    ForceOpen(player, ui).then(res => {
      if (!res.canceled) {
        if (res.selection == 0) {
          let delConfirmation = new MessageFormData()
            .title(`§cDelete Report`)
            .body(`Are you sure you'd like to delete this Report?`)
            .button1(`§cDelete`)
            .button2(`§aCancel`)
          ForceOpen(player, delConfirmation).then(result => {
            if (result.selection === 0) {
              if (reportDB.has(reportId)) reportDB.delete(reportId)
              player.sendMessage(`§aReport Deleted.`)
            }
          })
        }
      }
    })
  }

  const formatFullReport = (data) => {
    return `§7Username: §b${data.reporter}\n${data.type == "Player Report" ? `§7Target: §b${data.target} §b\n` : ""}\n§7Report: §b${data.reportText}§r\n\n\n§7Type: §b${data.type}§r\n\n§7Reported At: §b${data.createdAt}§r\n\n`
  }
}

export default report