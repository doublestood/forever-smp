import chatSend from "./Events/chatSend"
import playerDie from "./Events/playerDie"
import playerSpawn from "./Events/playerSpawn"
import entityDie from "./Events/entityDie"
import combat from "./Events/combat"
import ranks from "./Events/ranks"
import compassMenu from "./Events/compassMenu"

const eventHandler = (server) => {
  chatSend(server)
  playerDie(server)
  playerSpawn(server)
  entityDie(server)
  combat(server)
  ranks(server)
  compassMenu(server)
}

export default eventHandler