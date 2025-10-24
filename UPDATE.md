# Update and compatibility guide

Switch to Lite pack:
1. In world settings -> Add-Ons, disable Forever SMP - Full (scripts).
2. Enable Forever SMP - Lite (functions) while keeping the shared RP enabled.

Hotfix process (summary)
- Limit engine-specific code to BP/full/scripts/compatibility_adapter.js
- For breaking API updates: update adapter first, run smoke tests on a BDS instance, then release.