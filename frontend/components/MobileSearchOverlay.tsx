import { useEffect, useMemo, useState } from "react";
import { Search, Mic, MicOff, Clock, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MobileSearchOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isSemanticMode: boolean;
  onSemanticModeChange: (value: boolean) => void;
  placeholderExamples: string[];
  onSubmit: () => void;
  isLoading?: boolean;
};

type RecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type RecognitionResult = {
  0?: RecognitionAlternative;
  length: number;
};

type RecognitionResultEvent = {
  results: {
    [index: number]: RecognitionResult;
    length: number;
  };
};

type RecognitionErrorEvent = {
  error: string;
};

type RecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart?: () => void;
  onresult?: (event: RecognitionResultEvent) => void;
  onerror?: (event: RecognitionErrorEvent) => void;
  onend?: () => void;
  start: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: RecognitionConstructor;
    SpeechRecognition?: RecognitionConstructor;
  }
}

export function MobileSearchOverlay({
  open,
  onOpenChange,
  searchValue,
  onSearchChange,
  isSemanticMode,
  onSemanticModeChange,
  placeholderExamples,
  onSubmit,
  isLoading = false,
}: MobileSearchOverlayProps) {
  const [activeTab, setActiveTab] = useState<"keyword" | "semantic">(
    isSemanticMode ? "semantic" : "keyword"
  );
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  useEffect(() => {
    setActiveTab(isSemanticMode ? "semantic" : "keyword");
  }, [isSemanticMode, open]);

  useEffect(() => {
    if (!open) return;
    if (placeholderExamples.length <= 1) {
      setExampleIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % placeholderExamples.length);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [open, placeholderExamples]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechAvailable(Boolean(Recognition));
  }, []);

  const currentPlaceholder = useMemo(() => {
    return placeholderExamples[exampleIndex] ?? "Search inventory...";
  }, [placeholderExamples, exampleIndex]);

  const handleTabChange = (value: string) => {
    const nextTab = value === "semantic" ? "semantic" : "keyword";
    setActiveTab(nextTab);
    onSemanticModeChange(nextTab === "semantic");
  };

  const handleVoiceSearch = () => {
    if (!speechAvailable || typeof window === "undefined") {
      toast.info("Voice search is not supported on this device.");
      return;
    }

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      toast.info("Voice search is not supported on this device.");
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if (!isSemanticMode) {
          onSemanticModeChange(true);
          setActiveTab("semantic");
        }
        toast.message("Listening…", {
          description: "Speak your search query and release when done.",
        });
      };

      recognition.onresult = (event: RecognitionResultEvent) => {
        const firstResult = event.results?.[0];
        const alternative = firstResult?.[0];
        const transcript = alternative?.transcript;
        if (transcript) {
          onSearchChange(transcript);
          toast.success("Voice input captured", {
            description: `Query: “${transcript}”`,
          });
        }
      };

      recognition.onerror = (event: RecognitionErrorEvent) => {
        console.error("Voice recognition error:", event.error);
        toast.error("Voice search failed", {
          description:
            event.error === "not-allowed"
              ? "Microphone permission is required."
              : "Please try again.",
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (error) {
      console.error("Voice recognition init error:", error);
      toast.error("Voice search failed to start.");
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await Promise.resolve(onSubmit());
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="h-[85vh] rounded-b-3xl border-none bg-background px-0 pt-4"
      >
        <div className="mx-auto flex h-full w-full max-w-lg flex-col px-4">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-left text-xl font-semibold">
              Search Inventory
            </SheetTitle>
            <SheetDescription className="text-left">
              Choose your search mode: <strong>Keyword</strong> for exact matches or <strong>AI</strong> for natural language. Press Enter or Search button to search.
            </SheetDescription>
          </SheetHeader>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="mt-4 flex flex-1 flex-col"
          >
            <TabsList className="grid grid-cols-2 rounded-full bg-muted/60 p-1">
              <TabsTrigger
                value="keyword"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Keyword
              </TabsTrigger>
              <TabsTrigger
                value="semantic"
                className="rounded-full text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                AI Search
              </TabsTrigger>
            </TabsList>

            <TabsContent value="keyword" className="flex flex-1 flex-col">
              <div className="mt-6 space-y-4">
                <div className="rounded-lg border border-muted bg-muted/30 p-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Search className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p><strong className="text-foreground">Keyword Search:</strong> Searches item names, SKUs, categories, and locations for exact or partial matches.</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="e.g., chairs, SKU-123, warehouse..."
                    className="pl-10 text-base"
                    autoFocus
                    maxLength={200}
                    inputMode="search"
                    enterKeyHint="search"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Tips
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      Use SKU numbers
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Filter by location
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Combine keywords
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="semantic" className="flex flex-1 flex-col">
              <div className="mt-6 flex flex-col gap-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <p><strong className="text-foreground">AI Search:</strong> Ask questions in natural language. Understands context, intent, and relationships between items.</p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={currentPlaceholder}
                    className="pl-10 pr-12 text-base"
                    maxLength={200}
                    inputMode="search"
                    enterKeyHint="search"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute right-1.5 top-1.5 h-9 w-9 rounded-full border",
                      isListening
                        ? "border-rose-500 bg-rose-500/10 text-rose-600"
                        : "border-input text-muted-foreground hover:text-primary"
                    )}
                    onClick={handleVoiceSearch}
                    disabled={isLoading}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    <span className="sr-only">Voice search</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Example queries
                  </p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {placeholderExamples.slice(0, 3).map((example) => (
                      <li
                        key={example}
                        className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-auto flex flex-col gap-3 pb-4 pt-6">
            {isSemanticMode ? (
              <p className="text-center text-[11px] text-muted-foreground">
                You can switch back to keyword search anytime. AI matches will
                include confidence scores.
              </p>
            ) : null}
            <Button
              className="w-full"
              size="lg"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isSemanticMode ? "Search with AI" : "Search"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
