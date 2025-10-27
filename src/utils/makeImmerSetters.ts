const toSetterName = (key: string) =>
  `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;

type SetFn<State> = (updater: (draft: State) => void) => void;

type SetterValue<State, K extends keyof State> =
  | State[K]
  | ((prev: State[K]) => State[K]);

type SetterFunction<State, K extends keyof State> = (
  value: SetterValue<State, K>,
) => void;

type SetterName<Key extends string> = `set${Capitalize<Key>}`;

type SetterMapFromKeys<
  State,
  Keys extends ReadonlyArray<keyof State & string>,
> = {
  [K in Keys[number] as SetterName<K>]: SetterFunction<State, K>;
};

type SetterNameForMapValue<
  Key extends string,
  Value extends string,
> = Value extends "" ? SetterName<Key> : Value;

type SetterMapFromRecord<
  State,
  KeyMap extends Record<keyof State & string, string>,
> = {
  [K in keyof KeyMap as SetterNameForMapValue<
    Extract<K, string>,
    KeyMap[K]
  >]: SetterFunction<State, Extract<K, keyof State>>;
};

const isUpdater = <State, K extends keyof State>(
  value: SetterValue<State, K>,
): value is (prev: State[K]) => State[K] => typeof value === "function";

function createSetter<State, K extends keyof State & string>(
  setFn: SetFn<State>,
  key: K,
): SetterFunction<State, K> {
  return (value) => {
    setFn((draft) => {
      if (isUpdater(value)) {
        draft[key] = value(draft[key]);
      } else {
        draft[key] = value;
      }
    });
  };
}

function isKeyArray<State>(
  value:
    | ReadonlyArray<keyof State & string>
    | Record<keyof State & string, string>,
): value is ReadonlyArray<keyof State & string> {
  return Array.isArray(value);
}

export function makeImmerSetters<
  State,
  Keys extends ReadonlyArray<keyof State & string>,
>(setFn: SetFn<State>, keys: Keys): SetterMapFromKeys<State, Keys>;
export function makeImmerSetters<
  State,
  KeyMap extends Record<keyof State & string, string>,
>(setFn: SetFn<State>, keyMap: KeyMap): SetterMapFromRecord<State, KeyMap>;
export function makeImmerSetters<
  State,
  KeysOrMap extends
    | ReadonlyArray<keyof State & string>
    | Record<keyof State & string, string>,
>(
  setFn: SetFn<State>,
  keysOrMap: KeysOrMap,
): KeysOrMap extends ReadonlyArray<keyof State & string>
  ? SetterMapFromKeys<State, KeysOrMap>
  : KeysOrMap extends Record<keyof State & string, string>
    ? SetterMapFromRecord<State, KeysOrMap>
    : never {
  if (isKeyArray(keysOrMap)) {
    const result: Record<
      string,
      SetterFunction<State, keyof State & string>
    > = {};
    for (const key of keysOrMap) {
      const setterName = toSetterName(key);
      result[setterName] = createSetter(setFn, key);
    }
    return result as unknown as KeysOrMap extends ReadonlyArray<
      keyof State & string
    >
      ? SetterMapFromKeys<State, KeysOrMap>
      : KeysOrMap extends Record<keyof State & string, string>
        ? SetterMapFromRecord<State, KeysOrMap>
        : never;
  }

  const result: Record<
    string,
    SetterFunction<State, keyof State & string>
  > = {};
  const map = keysOrMap as Record<keyof State & string, string>;
  for (const key of Object.keys(map) as Array<keyof typeof map>) {
    const typedKey = key;
    const customName = map[typedKey];
    const setterName = customName || toSetterName(typedKey);
    result[setterName] = createSetter(setFn, typedKey);
  }
  return result as unknown as KeysOrMap extends ReadonlyArray<
    keyof State & string
  >
    ? SetterMapFromKeys<State, KeysOrMap>
    : KeysOrMap extends Record<keyof State & string, string>
      ? SetterMapFromRecord<State, KeysOrMap>
      : never;
}
