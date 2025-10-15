"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { allergenLabels } from "@/lib/utils/inventory";

interface AllergenMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const allergenOptions = Object.entries(allergenLabels).map(([value, label]) => ({
  value,
  label,
}));

export function AllergenMultiSelect({
  value,
  onChange,
  placeholder = "Select allergens...",
}: AllergenMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleAllergen = (allergen: string) => {
    if (value.includes(allergen)) {
      onChange(value.filter((v) => v !== allergen));
    } else {
      onChange([...value, allergen]);
    }
  };

  const removeAllergen = (allergen: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== allergen));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-1">
            {value.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {value.map((allergen) => (
              <Badge
                key={allergen}
                variant="secondary"
                className="mr-1"
                onClick={(e) => removeAllergen(allergen, e)}
              >
                {allergenLabels[allergen] || allergen}
                <button
                  className="ml-1 hover:bg-muted rounded-full"
                  onClick={(e) => removeAllergen(allergen, e)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search allergens..." />
          <CommandEmpty>No allergen found.</CommandEmpty>
          <CommandGroup>
            {allergenOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => toggleAllergen(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
