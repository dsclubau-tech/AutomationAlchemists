export interface CpBotSettings {
  automation_enabled: boolean;
  auto_mark_ordered: boolean;
  auto_select_address: boolean;
}

export const DEFAULT_CP_BOT_SETTINGS: CpBotSettings = {
  automation_enabled: true,
  auto_mark_ordered: true,
  auto_select_address: true,
};

export interface GiftTemplate {
  id: string;
  name: string;
  message: string;
  from_name: string;
}
