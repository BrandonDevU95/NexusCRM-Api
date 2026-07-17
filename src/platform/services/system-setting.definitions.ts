export const SYSTEM_SETTING_DATE_FORMATS = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
] as const;

interface SystemSettingDefinition {
  isPublic: boolean;
  isValidValue: (value: unknown) => boolean;
}

function isValidLanguage(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    Intl.getCanonicalLocales(value);
    return true;
  } catch {
    return false;
  }
}

function isValidCurrency(value: unknown): boolean {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
}

function isValidTimeZone(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isValidDateFormat(value: unknown): boolean {
  return SYSTEM_SETTING_DATE_FORMATS.includes(
    value as (typeof SYSTEM_SETTING_DATE_FORMATS)[number],
  );
}

export const SYSTEM_SETTING_DEFINITIONS = {
  'platform.default_language': {
    isPublic: true,
    isValidValue: isValidLanguage,
  },
  'platform.default_currency': {
    isPublic: true,
    isValidValue: isValidCurrency,
  },
  'platform.time_zone': {
    isPublic: true,
    isValidValue: isValidTimeZone,
  },
  'platform.date_format': {
    isPublic: true,
    isValidValue: isValidDateFormat,
  },
} as const satisfies Record<string, SystemSettingDefinition>;

export type SystemSettingKey = keyof typeof SYSTEM_SETTING_DEFINITIONS;

export const SYSTEM_SETTING_KEYS = Object.freeze(
  Object.keys(SYSTEM_SETTING_DEFINITIONS) as SystemSettingKey[],
);

export const PUBLIC_SYSTEM_SETTING_KEYS = Object.freeze(
  SYSTEM_SETTING_KEYS.filter((key) => SYSTEM_SETTING_DEFINITIONS[key].isPublic),
);
