"use client";

import { useLayoutEffect, useRef } from "react";

import { useTheme } from "@/components/theme-provider";
import {
  themeStorageKey,
  themeUserStorageKey,
  type ThemePreference,
} from "@/features/theme/types";

type ThemePreferenceSyncProps = {
  themePreference: ThemePreference;
  userId: string;
};

export function ThemePreferenceSync({
  themePreference,
  userId,
}: ThemePreferenceSyncProps) {
  const { setTheme } = useTheme();
  const lastSeedKeyRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const nextSeedKey = `${userId}:${themePreference}`;

    if (lastSeedKeyRef.current === nextSeedKey) {
      return;
    }

    lastSeedKeyRef.current = nextSeedKey;

    const storedUserId = window.localStorage.getItem(themeUserStorageKey);
    const storedTheme = window.localStorage.getItem(themeStorageKey);

    if (storedUserId === userId && storedTheme === themePreference) {
      return;
    }

    window.localStorage.setItem(themeUserStorageKey, userId);
    setTheme(themePreference);
  }, [setTheme, themePreference, userId]);

  return null;
}
