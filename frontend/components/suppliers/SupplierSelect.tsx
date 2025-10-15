"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { api, Supplier } from "@/lib/api";

interface SupplierSelectProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: () => void;
}

export function SupplierSelect({
  value,
  onChange,
  placeholder = "Select supplier...",
  disabled = false,
  onCreateNew,
}: SupplierSelectProps) {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.getSuppliers({ limit: 100, isActive: true });
      setSuppliers(response.data);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === value);

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedSupplier ? (
            <span>{selectedSupplier.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search suppliers..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading suppliers...</div>
            ) : (
              <div className="py-6 text-center text-sm">
                No supplier found.
                {onCreateNew && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setOpen(false);
                      onCreateNew();
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Create new supplier
                  </Button>
                )}
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {filteredSuppliers.map((supplier) => (
              <CommandItem
                key={supplier.id}
                value={supplier.id}
                onSelect={(currentValue) => {
                  onChange(currentValue === value ? undefined : currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === supplier.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span>{supplier.name}</span>
                  {supplier.leadTimeDays && (
                    <span className="text-xs text-muted-foreground">
                      Lead time: {supplier.leadTimeDays} days
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          {onCreateNew && filteredSuppliers.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  onCreateNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new supplier
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
