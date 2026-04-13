import { isShallowEqual, unique } from "remeda";

export function normalizeComponentPinOrder(
  pinOrder: readonly string[] | undefined,
  validPinKeys: readonly string[],
): string[] | undefined {
  if (!pinOrder || pinOrder.length === 0) return undefined;

  const defaultPinKeys = unique(validPinKeys);
  const validKeySet = new Set(defaultPinKeys);
  const nextPinOrder = unique(pinOrder.filter((key) => validKeySet.has(key)));

  for (const key of defaultPinKeys) {
    if (!nextPinOrder.includes(key)) nextPinOrder.push(key);
  }

  return isShallowEqual(nextPinOrder, defaultPinKeys)
    ? undefined
    : nextPinOrder;
}

export function applyComponentPinOrder<T extends { key: string }>(
  pins: readonly T[],
  pinOrder: readonly string[] | undefined,
): T[] {
  const normalizedPinOrder = normalizeComponentPinOrder(
    pinOrder,
    pins.map((pin) => pin.key),
  );
  if (!normalizedPinOrder) return [...pins];

  const pinsByKey = new Map(pins.map((pin) => [pin.key, pin]));
  return normalizedPinOrder.flatMap((key) => {
    const pin = pinsByKey.get(key);
    return pin ? [pin] : [];
  });
}
