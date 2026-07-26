import type { CpBotSettings } from "../types/Address";

export function dbSettingsToExtension(
  dbSettings: Record<string, unknown> | null,
  current: CpBotSettings
): CpBotSettings {
  if (!dbSettings) {
    return current;
  }

  return {
    autoUseThisAddress:
      typeof dbSettings.auto_select_address === "boolean"
        ? dbSettings.auto_select_address
        : current.autoUseThisAddress,
    automationDisabled:
      typeof dbSettings.automation_enabled === "boolean"
        ? !dbSettings.automation_enabled // INVERTED: enabled in DB => Disabled is false
        : current.automationDisabled,
    giftOptions: current.giftOptions, // LOCALLY STORED ONLY, KEEP UNCHANGED BY DB
    webAppUrl: current.webAppUrl,
  };
}

export function extensionSettingsToDb(
  ext: CpBotSettings
): Record<string, unknown> {
  return {
    automation_enabled: !ext.automationDisabled, // INVERTED: Disabled in Ext => Enabled is false
    auto_select_address: ext.autoUseThisAddress,
    // OMIT gift options completely so we don't save or overwrite them in DB settings table
  };
}
