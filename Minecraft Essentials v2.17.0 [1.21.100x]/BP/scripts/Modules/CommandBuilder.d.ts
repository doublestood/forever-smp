import { ChatSendBeforeEvent, Player } from "@minecraft/server";

/**
 * An object of information needed to register the custom command
 */
declare interface registerInformation {
  name: string;
  description: string;
  aliases?: string[];
  category: string;
  usage: string;
  permission: string;
  settingname?: string;
}

/**
 * An object of information registered custom command
 */
declare interface storedRegisterInformation {
  name: string;
  description: string;
  aliases: string[];
  category: string;
  usage: string;
  permission: string;
  settingname: string;
  callback: void;
  id: string;
}

declare interface BeforeCommandUseData {
  cancel: boolean;
  command?: storedRegisterInformation;
  player: Player;
  inputCommand: string;
}

declare interface AfterCommandUseData {
  player: Player;
  error?: Error;
  command: storedRegisterInformation;
}

declare interface BeforeCommandUse {
  /**
   * @remarks
   * Adds a callback that will be called before player use command.
   */
  subscribe(callback: (data: BeforeCommandUseData) => void): void;
  /**
   * @remarks
   * Removes a callback from being called before player use command.
   */
  unsubscribe(id: number): void;
}

declare interface AfterCommandUse {
  /**
   * @remarks
   * Adds a callback that will be called after player used command.
   */
  subscribe(callback: (data: AfterCommandUseData) => void): void;
  /**
   * @remarks
   * Adds a callback that will be called after player used command.
   */
  unsubscribe(id: number): void;
}

export default class CommandBuilder {
  /**
   * Command Builder for Custom Command
   * @param id
   */
  constructor(id: string) 
  /**
   * Register a command with a callback
   * @param register
   * @param callback Code you want to execute when the command is executed
   * @example const Commands = new CommandBuilder("land")
   *  Commands.register({ name: 'ping', description: "ping, pong", category: "General" }, (data, player, args) => {
   *  Server.broadcast('Pong!', player.name);
   * });
   */
  register(register: registerInformation, callback: (data: ChatSendBeforeEvent, player: Player, args: Array<string>) => Promise<void>): void;
  /**
   * Get all the registered informations

   * @example getAllRegistration();
   */
  getAllRegistation(): storedRegisterInformation[];
  /**
   * Get registration information on a specific command
   * @param name The command name or alias you want to get information on

   * @example getRegistration('ping');
   */
  getRegistration(name: string): storedRegisterInformation;

  beforeCommandUse: BeforeCommandUse;
  afterCommandUse: AfterCommandUse;
}