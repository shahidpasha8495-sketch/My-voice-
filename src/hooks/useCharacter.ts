import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CHARACTER_STORAGE_KEY,
  PLUSH_CHARACTERS,
  PLUSH_CHARACTER_LIST,
  isValidCharacterId,
  type PlushCharacterConfig,
  type PlushCharacterId,
} from '../config/characters';

export interface CharacterContextValue {
  characterId: PlushCharacterId;
  character: PlushCharacterConfig;
  characters: PlushCharacterConfig[];
  selectCharacter: (id: PlushCharacterId) => void;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

function loadSavedCharacter(): PlushCharacterId {
  if (typeof window === 'undefined') return 'mellow';
  try {
    const saved = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (isValidCharacterId(saved)) {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'mellow';
}

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [characterId, setCharacterId] = useState<PlushCharacterId>(loadSavedCharacter);

  const selectCharacter = useCallback((id: PlushCharacterId) => {
    if (!isValidCharacterId(id)) return;
    setCharacterId(id);
    try {
      localStorage.setItem(CHARACTER_STORAGE_KEY, id);
    } catch {
      // ignore storage errors
    }
  }, []);

  const value = useMemo<CharacterContextValue>(
    () => ({
      characterId,
      character: PLUSH_CHARACTERS[characterId] || PLUSH_CHARACTERS.mellow,
      characters: PLUSH_CHARACTER_LIST,
      selectCharacter,
    }),
    [characterId, selectCharacter]
  );

  return React.createElement(CharacterContext.Provider, { value }, children);
}

export function useCharacter(): CharacterContextValue {
  const context = useContext(CharacterContext);
  if (!context) {
    return {
      characterId: 'mellow',
      character: PLUSH_CHARACTERS.mellow,
      characters: PLUSH_CHARACTER_LIST,
      selectCharacter: () => {},
    };
  }
  return context;
}
