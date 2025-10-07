/**
 * compatibility_adapter.js
 * Small adapter layer to isolate engine/API calls so updates are localized.
 *
 * Keep all direct calls to the Bedrock scripting/GameTest APIs in this file.
 * On a breaking update, edit only this file (and any tiny shims it needs).
 *
 * NOTE: This file is a placeholder scaffold — implement actual API wrappers here.
 */

module.exports = {
  engineVersion: [1, 21, 100],

  isCompatible: function (runtimeVersionArray) {
    for (let i = 0; i < Math.min(this.engineVersion.length, runtimeVersionArray.length); i++) {
      if (runtimeVersionArray[i] > this.engineVersion[i]) return true;
      if (runtimeVersionArray[i] < this.engineVersion[i]) return false;
    }
    return true;
  },

  // Example: wrapper for scheduling a repeating task
  scheduleRepeating: function (fn, intervalTicks) {
    // Implement platform-specific scheduling (GameTest / scheduler)
    // Placeholder: return a cancellable object for the core to use
    const handle = { canceled: false };
    // In real implementation, call the engine scheduler and set handle.cancel to stop it.
    return {
      cancel: function () { handle.canceled = true; }
    };
  }

  // Add other wrappers here (teleport, storage read/write, player events, forms, particles)
};