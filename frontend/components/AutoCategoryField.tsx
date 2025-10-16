import { useEffect, useMemo, useState } from "react";
import type {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from "react-hook-form";
import { Loader2, Sparkles, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MIN_DESCRIPTION_LENGTH, useAutoCategory } from "@/hooks/useAutoCategory";
import type { Category } from "@/lib/api";

type CategoryOption = {
  value: Category;
  label: string;
};

type AutoCategoryFieldProps<TFieldValues extends FieldValues = FieldValues> = {
  field: ControllerRenderProps<TFieldValues, FieldPath<TFieldValues>>;
  form: UseFormReturn<TFieldValues>;
  options: CategoryOption[];
  nameValue: string;
  descriptionValue?: string;
  isSubmitting?: boolean;
};

const confidenceClasses = (confidence: number) => {
  if (confidence >= 0.9) {
    return "border-emerald-400/60 bg-emerald-50 text-emerald-700 hover:border-emerald-500";
  }
  if (confidence >= 0.7) {
    return "border-amber-400/60 bg-amber-50 text-amber-700 hover:border-amber-500";
  }
  return "border-rose-400/50 bg-rose-50 text-rose-700 hover:border-rose-500";
};

const confidenceLabel = (confidence: number) => {
  if (confidence >= 0.9) return "High confidence";
  if (confidence >= 0.7) return "Likely match";
  return "Low confidence";
};

export function AutoCategoryField<TFieldValues extends FieldValues>({
  field,
  form,
  options,
  nameValue,
  descriptionValue,
  isSubmitting = false,
}: AutoCategoryFieldProps<TFieldValues>) {
  const { suggestions, isLoading, error: suggestionError, requestSuggestions, reset } =
    useAutoCategory();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const trimmedName = nameValue?.trim() ?? "";
  const trimmedDescription = descriptionValue?.trim() ?? "";

  const handleManualSuggest = () => {
    setManualError(null);
    if (trimmedName.length < 3) {
      setManualError("Name must be at least 3 characters for suggestions.");
      return;
    }

    requestSuggestions({
      name: trimmedName,
      description: trimmedDescription,
      force: true,
    }).then((result) => {
      if (result && result.length > 0) {
        setShowSuggestions(true);
      }
    });
  };

  const applySuggestion = (category: Category) => {
    field.onChange(category);
    form.setValue(field.name, category, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setShowSuggestions(false);
  };

  useEffect(() => {
    // Reset suggestions when name/description cleared
    if (!trimmedName && !trimmedDescription) {
      reset();
      setShowSuggestions(false);
    }
  }, [trimmedName, trimmedDescription, reset]);

  const suggestionHelperText = useMemo(() => {
    if (suggestionError) return suggestionError;
    if (manualError) return manualError;
    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
      return `Add a bit more detail (${MIN_DESCRIPTION_LENGTH}+ characters) so the AI has enough context.`;
    }
    return "Press Suggest to see AI recommendations for this item.";
  }, [trimmedDescription.length, manualError, suggestionError]);

  return (
    <TooltipProvider delayDuration={150}>
      <FormItem>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <FormLabel className="flex items-center gap-2">Category</FormLabel>
            <FormDescription>
              Choose the category that best fits this item
            </FormDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleManualSuggest}
              disabled={isSubmitting || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Suggest
            </Button>
          </div>
        </div>

        <FormControl>
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormControl>

        {suggestionHelperText ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            {suggestionHelperText}
          </p>
        ) : null}

        {showSuggestions && suggestions.length > 0 ? (
          <div className="mt-2 space-y-2 rounded-md border border-dashed border-border/70 bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Suggested categories
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => {
                const percent = Math.round(suggestion.confidence * 100);
                return (
                  <Tooltip key={suggestion.category}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => applySuggestion(suggestion.category)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          confidenceClasses(suggestion.confidence),
                          field.value === suggestion.category
                            ? "ring-2 ring-primary/60"
                            : ""
                        )}
                      >
                        <span>{suggestion.category.replace(/_/g, " ")}</span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                          {percent}%
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p className="font-semibold text-foreground">
                        {confidenceLabel(suggestion.confidence)}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {suggestion.reasoning}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            {suggestions.every((suggestion) => suggestion.confidence < 0.7) ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <p>
                  Suggestions have low confidence. Double-check before applying.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-[11px] text-muted-foreground">
          Update the name or description and tap Suggest whenever you need fresh ideas.
        </p>

        <FormMessage />
      </FormItem>
    </TooltipProvider>
  );
}
