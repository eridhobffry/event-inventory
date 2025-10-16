import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SemanticSearchBarProps = {
  value: string;
  onChange: (nextValue: string) => void;
  isSemanticMode: boolean;
  onSemanticModeChange: (nextMode: boolean) => void;
  onSubmit?: () => void;
  placeholderExamples?: string[];
  className?: string;
};

const DEFAULT_PLACEHOLDERS = [
  "Try: 'tables for outdoor events'",
  "Try: 'audio equipment checked out this week'",
  "Try: 'damaged items needing replacement'",
  "Try: 'projectors available in March'",
];
export function SemanticSearchBar({
  value,
  onChange,
  isSemanticMode,
  onSemanticModeChange,
  onSubmit,
  placeholderExamples,
  className,
}: SemanticSearchBarProps) {
  const examples = useMemo(
    () =>
      placeholderExamples && placeholderExamples.length > 0
        ? placeholderExamples
        : DEFAULT_PLACEHOLDERS,
    [placeholderExamples],
  );
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused || value.length > 0 || examples.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % examples.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [examples.length, isFocused, value]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onSemanticModeChange(true);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSemanticModeChange]);

  useEffect(() => {
    setExampleIndex(0);
  }, [examples]);

  // Mode-specific placeholders
  const keywordPlaceholder = "Search by name, SKU, category, or location...";
  const aiPlaceholder = value.length === 0 ? examples[exampleIndex] : "";

  const handleExampleClick = (example: string) => {
    const cleaned = example.replace(/^Try:\s*/i, "").replace(/^['"]|['"]$/g, "");
    onChange(cleaned.replace(/^[“”'\s]+|[“”'\s]+$/g, ""));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3">
        <Tabs
          value={isSemanticMode ? "ai" : "keyword"}
          onValueChange={(val) => onSemanticModeChange(val === "ai")}
          className="w-fit rounded-full border border-border/60 bg-background/90 backdrop-blur"
        >
          <TabsList className="grid h-10 grid-cols-2 rounded-full bg-transparent p-0">
            <TabsTrigger
              value="keyword"
              className="rounded-full px-4 data-[state=active]:bg-muted"
            >
              <Search className="h-4 w-4" />
              <span className="ml-2 text-sm font-medium">Keyword</span>
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="rounded-full px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white"
            >
              <Sparkles className="h-4 w-4" />
              <span className="ml-2 text-sm font-medium">AI Search</span>
              <Badge variant="secondary" className="ml-2 bg-white/20 text-[10px] text-white">
                BETA
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div
          className={cn(
            "group relative flex items-center rounded-xl border transition-colors",
            isSemanticMode
              ? "border-purple-400/60 bg-gradient-to-r from-purple-50/60 to-blue-50/60"
              : "border-border bg-background",
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute left-4 inline-flex h-8 w-8 items-center justify-center rounded-full",
              isSemanticMode ? "text-purple-600" : "text-muted-foreground",
            )}
          >
            {isSemanticMode ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </div>
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSubmit?.();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isSemanticMode ? aiPlaceholder : keywordPlaceholder}
            className={cn(
              "h-14 border-0 bg-transparent pl-14 pr-32 text-base shadow-none focus-visible:ring-0",
              isSemanticMode
                ? "text-foreground placeholder:text-purple-600/70"
                : "placeholder:text-muted-foreground",
            )}
            aria-label={isSemanticMode ? "Natural language AI search" : "Keyword search"}
          />
          <div className="absolute inset-y-2 right-2 flex items-center gap-2">
            <Button
              type="button"
              variant={isSemanticMode ? "default" : "secondary"}
              size="sm"
              className={cn(
                "h-9 rounded-full px-4 font-medium",
                isSemanticMode && "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
              )}
              onClick={() => onSubmit?.()}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {isSemanticMode && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {examples.map((example, idx) => (
            <Button
              key={`${example}-${idx}`}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 whitespace-nowrap rounded-full border border-border bg-background/80 px-3 text-xs font-medium hover:bg-muted"
              onClick={() => handleExampleClick(example)}
            >
              {example.replace(/^Try:\s*/i, "Try ")}
            </Button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        <span>
          {isSemanticMode
            ? "AI mode understands natural questions and prioritises semantic matches."
            : "Keyword mode searches names, SKUs, categories, and locations."}
        </span>
      </div>
    </div>
  );
}
