import * as mc from "@minecraft/server";
const registrationInformation = [];

mc.system.afterEvents.scriptEventReceive.subscribe(data => {
  let id = data.id
  if (id.endsWith("registerCommand")) {
    try {
      let commandId = id.split(":")[0]
      let commandData = JSON.parse(data.message)
      if (registrationInformation.find(c => c.name == commandData.name)) return
      commandData["id"] = commandId
      registrationInformation.push(commandData)
    } catch (err) { console.error(`Error when register command: Data ${id}. Error: ${err}`) }
  }
})

/**
 * Parses a string input containing space-separated arguments, accounting for quoted and escaped characters.
 *
 * @param {string} input - The input string containing space-separated arguments.
 * @returns {string[]} An array of parsed arguments.
 * @credit {@xskt}
 */
function parseArguments(input) {
  const output = [];
  let quoted = false;
  let escaped = false;
  let construct = "";
  for (let i = 0, length = input.length; i < length; i++) {
    const character = input[i];
    if (character === " " && !quoted) {
      output.push(construct);
      construct = "";
      continue;
    }
    if (character === '"' && !escaped) {
      quoted = !quoted;
      continue;
    }
    if (character === "\\" && !escaped) {
      escaped = true;
      continue;
    } else {
      escaped = false;
    }
    construct = `${construct}${character}`;
  }
  output.push(construct);
  return output;
}

export default class CommandBuilder {
  #beforeCallbacks
  #afterCallbacks
  constructor(id) {
    this.id = id
    this._registrationInformation = []
    this.#beforeCallbacks = []
    this.#afterCallbacks = []
    this.#init()
  }

  register(register, callback) {
    let form = {
      name: register.name.toLowerCase(),
      description: register.description || "No description",
      aliases: register.aliases
        ? register.aliases.map((v) => v.toLowerCase())
        : null,
      category: register.category || "None",
      usage: register.usage,
      permission: register.permission,
      settingname: register.settingname || register.name.toLowerCase(),
      callback,
    };
    this._registrationInformation.push(form)
    mc.world.getDimension("overworld").runCommand(`scriptevent ${this.id}:registerCommand ${JSON.stringify(form)}`)
  }

  getAllRegistation() {
    return registrationInformation;
  }

  getRegistration(name) {
    const command = this._registrationInformation.some(
      (element) =>
        element.name.toLowerCase() === name ||
        (element.aliases && element.aliases.includes(name))
    );
    if (!command) return;
    let register;
    this._registrationInformation.forEach((element) => {
      if (element.private) return;
      const eachCommand =
        element.name.toLowerCase() === name ||
        (element.aliases && element.aliases.includes(name));
      if (!eachCommand) return;
      register = element;
    });
    return register;
  }

  #init() {
    mc.system.afterEvents.scriptEventReceive.subscribe(async data => {
      let id = data.id
      if (id.toLowerCase() != `${this.id}:runcommand`) return
      if (data.sourceType == mc.ScriptEventSource.Entity && data.sourceEntity.typeId == "minecraft:player") {
        const player = data.sourceEntity
        let message = data.message
        let args = message.trim().split(' ')
        let command = args.shift().toLowerCase()
        const parsedArgs = args.length > 0 ? parseArguments(args.join(" ")) : []
        let cmd = this.getRegistration(command)
        let dataCMD = {
          cancel: false,
          command: cmd,
          player: player,
          inputCommand: command
        }
        this.#beforeCommandCallback(dataCMD)
        if (dataCMD.cancel) return
        mc.system.run(() => {
          if (cmd.callback.constructor.name == "AsyncFunction") {
            cmd.callback(data, player, parsedArgs).then(() => {
              this.#afterCommandCallback({ player: player, command: cmd, error: null })
            }).catch(err => {
              this.#afterCommandCallback({ player: player, command: cmd, error: err })
            })
          } else if (cmd.callback.constructor.name == "Function") {
            try {
              cmd.callback(data, player, parsedArgs)
              this.#afterCommandCallback({ player: player, command: cmd, error: null })
            } catch (err) {
              this.#afterCommandCallback({ player: player, command: cmd, error: err })
            }
          }
        })
      }
    })
  }

  #beforeCommandCallback(data) {
    for (const callback of this.#beforeCallbacks) {
      callback.callback(data)
    }
  }

  #afterCommandCallback(data) {
    for (const callback of this.#afterCallbacks) {
      callback.callback(data)
    }
  }

  beforeCommandUse = {
    subscribe: (callback) => {
      let dataCallback = this.#beforeCallbacks.push({ callback })
      return dataCallback
    },
    unsubscribe: (id) => {
      this.#beforeCallbacks.splice(id - 1, 1)
    }
  }

  afterCommandUse = {
    subscribe: (callback) => {
      let dataCallback = this.#afterCallbacks.push({ callback })
      return dataCallback
    },
    unsubscribe: (id) => {
      this.#afterCallbacks.splice(id - 1, 1)
    }
  }
}