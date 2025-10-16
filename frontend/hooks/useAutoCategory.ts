import { useCallback, useRef, useState } from "react";
import { api, type Category } from "@/lib/api";

export type AutoCategorySuggestion = {
  category: Category;
  confidence: number;
  reasoning: string;
};

type SuggestionKey = string;

const MIN_NAME_LENGTH = 3;
export const MIN_DESCRIPTION_LENGTH = 5;

const normalizeKey = (name: string, description?: string): SuggestionKey => {
  return `${name.trim().toLowerCase()}|${(description ?? "")
    .trim()
    .toLowerCase()}`;
};

export function useAutoCategory() {
  const cacheRef = useRef<Map<SuggestionKey, AutoCategorySuggestion[]>>(
    new Map()
  );
  const [suggestions, setSuggestions] = useState<AutoCategorySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSuggestions = useCallback(
    async ({
      name,
      description,
      force = false,
    }: {
      name: string;
      description?: string;
      force?: boolean;
    }) => {
      const trimmedName = name.trim();
      const trimmedDescription = description?.trim() ?? "";

      if (trimmedName.length < MIN_NAME_LENGTH) {
        setError("Add a more descriptive name to get suggestions.");
        setSuggestions([]);
        return null;
      }

      // Only require description when doing auto suggestions; manual can request without
      if (!force && trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
        return null;
      }

      const cacheKey = normalizeKey(trimmedName, trimmedDescription);
      if (!force && cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey) ?? [];
        setSuggestions(cached);
        setError(null);
        return cached;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await api.autoCategorizeItem({
          name: trimmedName,
          description: trimmedDescription.length > 0 ? trimmedDescription : undefined,
        });

        const suggestion: AutoCategorySuggestion = {
          category: (response.category || "OTHER") as Category,
          confidence:
            typeof response.confidence === "number"
              ? Math.max(0, Math.min(1, response.confidence))
              : 0,
          reasoning: response.reasoning || "No reasoning provided",
        };

        const result = [suggestion];
        cacheRef.current.set(cacheKey, result);
        setSuggestions(result);
        return result;
      } catch (apiError) {
        console.error("Failed to fetch auto-categorization:", apiError);
        const status =
          apiError && typeof apiError === "object"
            ? (apiError as { status?: number }).status
            : undefined;
        if (status === 429) {
          const retryAfter = (apiError as { retryAfter?: number | string }).retryAfter;
          if (typeof retryAfter === "number") {
            const minutes = Math.ceil(retryAfter / 60);
            setError(
              minutes > 1
                ? `AI suggestions are cooling down. Try again in about ${minutes} minutes.`
                : "AI suggestions are cooling down. Try again in about a minute."
            );
          } else if (retryAfter) {
            setError(`AI suggestions paused. Try again after ${retryAfter}.`);
          } else {
            setError("Too many AI requests. Please wait a moment and try again.");
          }
        } else {
          setError("Unable to fetch category suggestions right now.");
          setSuggestions([]);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    requestSuggestions,
    reset,
  };
}
