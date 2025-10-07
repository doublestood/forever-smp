/**
 * Start automatically update if available
 * @param {import("../main").default} server 
 */
const update = async (server) => {
  const registeredVersion = server.world.getDynamicProperty("registeredVersion") ?? server.Version
  const currentVersion = server.Version
  console.log("Current Version:", currentVersion)

  const isLower = (version1, version2) => {
    const v1 = version1.split('.').map(Number)
    const v2 = version2.split('.').map(Number)

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0
      const num2 = v2[i] || 0
      if (num1 < num2) return true
      if (num1 > num2) return false
    }

    return false
  }

  if (isLower(registeredVersion, currentVersion)) {
    console.log("Registered Version:", registeredVersion)
    console.log("New version detected. Updating...")
  }
  server.world.setDynamicProperty("registeredVersion", currentVersion)
}

export { update }