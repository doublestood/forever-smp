// Script example for ScriptAPI
// Author: Jayly <https://github.com/JaylyDev>
// Project: https://github.com/JaylyDev/ScriptAPI
import { world, Entity, ScoreboardIdentity, system } from "@minecraft/server";
/**
 * Gets the score recorded for a participant on objective
 * @param participant
 * @param objectiveId
 */
export function getScore(participant, objectiveId) {
  try {
    return world.scoreboard.getObjective(objectiveId).getScore(participant);
  } catch (err) {
    return undefined
  }
}
/**
 * Sets the score recorded for a participant on objective
 * @param participant
 * @param objectiveId
 * @param score
 * @returns {ScoreboardIdentity} participant that was changed in objective
 */
export function setScore(participant, objectiveId, score) {
  const objective = world.scoreboard.getObjective(objectiveId);
  if (!objective)
    throw new Error(`Objective ${objectiveId} not found`);
  objective.setScore(participant, score);
  if (participant instanceof Entity)
    return participant.scoreboardIdentity;
  else if (participant instanceof ScoreboardIdentity)
    return participant;
  else
    return objective.getParticipants().find(p => p.displayName === participant);
}
;
/**
 * Add the score recorded for entity on objective
 * @param participant
 * @param objectiveId
 * @param score
 */
export function addScore(participant, objectiveId, score) {
  const objective = world.scoreboard.getObjective(objectiveId);
  if (!objective)
    throw new Error(`Objective ${objectiveId} not found`);
  objective.addScore(participant, score);
  if (participant instanceof Entity)
    return participant.scoreboardIdentity;
  else if (participant instanceof ScoreboardIdentity)
    return participant;
  else
    return objective.getParticipants().find(p => p.displayName === participant);
}

export function checkObjective(objectiveId) {
  try {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (objective) return true
    return false
  } catch (err) {
    return false
  }
}

const listenData = {}
const callbackListen = {}
export const onChanged = {
  subscribe: (objectiveId, callback) => {
    const objective = world.scoreboard.getObjective(objectiveId);
    if (!objective) throw new Error(`Objective ${objectiveId} not found`);
    if (listenData[objectiveId]) throw new Error("Already listened")
    listenData[objectiveId] = {}
    callbackListen[objectiveId] = callback
    return objectiveId
  },
  unsubscribe: (objectiveId) => {
    delete listenData[objectiveId]
    delete callbackListen[objectiveId]
  }
}

system.runInterval(() => {
  try {
    Object.keys(listenData).forEach(objectiveId => {
      const obj = world.scoreboard.getObjective(objectiveId)
      if (!obj) return;
      obj.getScores().forEach(({ participant, score }) => {
        if (!participant || participant.displayName == "commands.scoreboard.players.offlinePlayerName") return
        const entity = participant?.getEntity()
        if (!entity || entity.typeId != "minecraft:player") return
        if (!listenData[objectiveId][entity.name]) listenData[objectiveId][entity.name] = score
        if (listenData[objectiveId][entity.name] !== score) callbackListen[objectiveId](entity, score)
        listenData[objectiveId][entity.name] = score
      })
    })
  } catch {}
}, 5)