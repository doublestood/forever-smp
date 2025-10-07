// import Config from "./Configuration"
// import Restful from "./Modules/Restful"

import Config from "./Configuration";

// import back from "./Commands/general/back"
// import help from "./Commands/general/help"
// import message from "./Commands/general/message"
// import playerlist from "./Commands/general/playerlist"
// import rtp from "./Commands/general/rtp"
// import tps from "./Commands/general/tps"
// import info from "./Commands/general/info"
// import calculate from "./Commands/general/calculate"
// import report from "./Commands/general/report"

// import delhome from "./Commands/home/delhome"
// import home from "./Commands/home/home"
// import listhome from "./Commands/home/listhome"
// import sethome from "./Commands/home/sethome"

// import auctionhouse from "./Commands/money/auctionhouse"
// import money from "./Commands/money/money"
// import pay from "./Commands/money/pay"
// import sell from "./Commands/money/sell"
// import shop from "./Commands/money/shop"
// import topmoney from "./Commands/money/topmoney"
// import withdraw from "./Commands/money/withdraw"

// import tpa from "./Commands/tpa/tpa"
// import tpacancel from "./Commands/tpa/tpacancel"
// import tpaccept from "./Commands/tpa/tpaccept"
// import tpahere from "./Commands/tpa/tpahere"
// import tpasetting from "./Commands/tpa/tpasetting"

// import listwarp from "./Commands/warp/listwarp"
// import warp from "./Commands/warp/warp"

// import adminpanel from "./Commands/admin/adminpanel"
// import ban from "./Commands/admin/ban"
// import broadcast from "./Commands/admin/broadcast"
// import delwarp from "./Commands/admin/delwarp"
// import economy from "./Commands/admin/economy"
// import inventorysee from "./Commands/admin/inventorysee"
// import kick from "./Commands/admin/kick"
// import log from "./Commands/admin/log"
// import mute from "./Commands/admin/mute"
// import resetdata from "./Commands/admin/resetdata"
// import sellsetting from "./Commands/admin/sellsetting"
// import setting from "./Commands/admin/setting"
// import setwarp from "./Commands/admin/setwarp"
// import shopsetting from "./Commands/admin/shopsetting"
// import tempban from "./Commands/admin/tempban"
// import unban from "./Commands/admin/unban"
// import unmute from "./Commands/admin/unmute"

// import addranks from "./Commands/ranks/addranks"
// import createranks from "./Commands/ranks/createranks"
// import deleteranks from "./Commands/ranks/deleteranks"
// import removeranks from "./Commands/ranks/removeranks"
// import editranks from "./Commands/ranks/editranks"

// import land from "./Commands/land/land"
// import landsetting from "./Commands/land/landsetting"

// import floatingtext_add from "./Commands/floatingtext/floatingtext-add"
// import floatingtext_remove from "./Commands/floatingtext/floatingtext-remove"
// import floatingtext_edit from "./Commands/floatingtext/floatingtext-edit"
// import floatingtext_clear from "./Commands/floatingtext/floatingtext-clear"

// const Commands = {}
// Commands["admin"] = { adminpanel, ban, broadcast, delwarp, economy, inventorysee, kick, log, mute, resetdata, sellsetting, setting, setwarp, shopsetting, tempban, unban, unmute }
// Commands["general"] = { back, help, message, playerlist, rtp, tps, info, calculate, report }
// Commands["home"] = { delhome, home, listhome, sethome }
// Commands["land"] = { land, landsetting }
// Commands["money"] = { auctionhouse, money, pay, sell, shop, topmoney, withdraw }
// Commands["tpa"] = { tpa, tpacancel, tpaccept, tpahere, tpasetting }
// Commands["warp"] = { warp, listwarp }
// Commands["ranks"] = { addranks, createranks, deleteranks, editranks, removeranks }
// Commands["floating text"] = { 
//   "floatingtext-add": floatingtext_add, 
//   "floatingtext-remove": floatingtext_remove, 
//   "floatingtext-edit": floatingtext_edit, 
//   "floatingtext-clear": floatingtext_clear } 

/**
 * 
 * @param {import("./main").default} Server 
 */
const commandHandler = async (Server) => {
  for (const category of Object.keys(Config.Commands)) {
    for (const cmd of Object.keys(Config.Commands[category])) {
      if (Config.Commands[category][cmd]) {
        try {
          const command = await import(`./Commands/${category.replaceAll(" ", "")}/${cmd}`)
          command.default(Server)
        } catch(e) {
          Server.SystemLog(`Failed to import command: ${cmd} | ${category} | ${e}${e.stack} `)
        }
      }
    }
  }
}

export default commandHandler