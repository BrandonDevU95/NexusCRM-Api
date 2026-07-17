import {
  SYSTEM_SETTING_DEFINITIONS,
  type SystemSettingKey,
} from './system-setting.definitions';

export function isKnownSystemSettingKey(key: string): key is SystemSettingKey {
  return Object.hasOwn(SYSTEM_SETTING_DEFINITIONS, key);
}

export function isPublicSystemSettingKey(key: string): key is SystemSettingKey {
  return (
    isKnownSystemSettingKey(key) && SYSTEM_SETTING_DEFINITIONS[key].isPublic
  );
}

export function isValidSystemSettingValue(
  key: string,
  value: unknown,
): boolean {
  return (
    isKnownSystemSettingKey(key) &&
    SYSTEM_SETTING_DEFINITIONS[key].isValidValue(value)
  );
}

export function normalizeCode(code: string): string {
  return code.trim().toLowerCase();
}

export function isValidCode(code: string, maxLength = 80): boolean {
  const normalizedCode = normalizeCode(code);

  return normalizedCode.length > 0 && normalizedCode.length <= maxLength;
}

export function isNonNegativeSortOrder(sortOrder: number): boolean {
  return Number.isInteger(sortOrder) && sortOrder >= 0;
}

export function isMetadataObject(
  metadata: unknown,
): metadata is Record<string, unknown> {
  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    Array.isArray(metadata)
  ) {
    return false;
  }

  const prototype = Object.getPrototypeOf(metadata) as object | null;

  return prototype === Object.prototype || prototype === null;
}
