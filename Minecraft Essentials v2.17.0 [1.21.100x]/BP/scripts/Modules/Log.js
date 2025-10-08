import Restful from "./Restful"

let LogData = []

const SystemLog = (log) => {
  LogData.push("[System] " + log)
  return console.log("[System] " + log)
}

Restful.listen("mce-sendSystemLog", (data) => {
  if (!data.message) return { error: true }
  SystemLog(data.message)
  return { error: false }
})

const Log = (log) => {
  LogData.push(log)
}
Restful.listen("mce-sendLog", (data) => {
  if (!data.message) return { error: true }
  Log(data.message)
  return { error: false }
})

const ClearLog = () => {
  LogData = []
}
Restful.listen("mce-clearLog", (data) => {
  ClearLog()
  return { error: false }
})

export { SystemLog, Log, LogData, ClearLog }