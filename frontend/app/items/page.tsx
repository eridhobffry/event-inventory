"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useItems, useDeleteItem } from "@/hooks/useItems";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { StorageTypeBadge } from "@/components/ui/StorageTypeBadge";
import { PerishableBadge } from "@/components/ui/PerishableBadge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Package,
  AlertTriangle,
  Clock,
  TrendingDown,
  Filter,
  X,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api, Supplier, Item } from "@/lib/api";
import { isExpiringSoon, daysUntilExpiry } from "@/lib/utils/date";
import { isBelowReorderPoint } from "@/lib/utils/inventory";
import { formatCurrency } from "@/lib/utils/formatters";
import { ItemsListSkeleton } from "@/components/ItemsListSkeleton";
import { exportItemsToCSV, exportItemsWithSummary } from "@/lib/utils/export";
import { useEventContext } from "@/contexts/EventContext";
import { toast } from "sonner";

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "AV_EQUIPMENT", label: "AV Equipment" },
  { value: "DECOR", label: "Decor" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "FOOD_BEVERAGE", label: "Food & Beverage" },
  { value: "OTHER", label: "Other" },
];

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "RESERVED", label: "Reserved" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETIRED", label: "Retired" },
];

const storageTypeOptions = [
  { value: "all", label: "All Storage Types" },
  { value: "DRY", label: "Dry Storage" },
  { value: "CHILL", label: "Chilled" },
  { value: "FREEZE", label: "Frozen" },
];

const stockStatusOptions = [
  { value: "all", label: "All Stock Levels" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
  { value: "expiring", label: "Expiring Soon" },
];

export default function ItemsPage() {
  const user = useUser({ or: "redirect" });
  const { currentEvent } = useEventContext();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [storageType, setStorageType] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [perishableOnly, setPerishableOnly] = useState(false);
  const [supplierId, setSupplierId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useItems({
    page,
    limit: 20,
    q: search || undefined,
    category: category !== "all" ? category : undefined,
    status: status !== "all" ? status : undefined,
  });

  const deleteMutation = useDeleteItem();

  // Load suppliers for filter
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await api.getSuppliers({ limit: 100, isActive: true });
        setSuppliers(response.data);
      } catch (error) {
        console.error("Failed to load suppliers:", error);
      }
    };
    loadSuppliers();
  }, []);

  if (!user) {
    redirect("/");
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getCategoryBadgeVariant = (cat: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      FURNITURE: "default",
      AV_EQUIPMENT: "secondary",
      DECOR: "outline",
      SUPPLIES: "default",
      FOOD_BEVERAGE: "default",
      OTHER: "secondary",
    };
    return variants[cat] || "default";
  };

  // Client-side filtering for Phase 2 features
  const filteredItems = data?.data
    ? data.data.filter((item) => {
        // Perishable filter
        if (perishableOnly && !item.isPerishable) return false;

        // Storage type filter
        if (storageType !== "all" && item.storageType !== storageType)
          return false;

        // Supplier filter
        if (supplierId !== "all" && item.supplierId !== supplierId)
          return false;

        // Stock status filters
        if (stockStatus === "low" && !isBelowReorderPoint(item)) return false;
        if (stockStatus === "out" && item.quantity !== 0) return false;
        if (stockStatus === "expiring") {
          const hasExpiringBatch = item.batches?.some(
            (batch) =>
              batch.expirationDate && isExpiringSoon(batch.expirationDate)
          );
          if (!hasExpiringBatch) return false;
        }

        return true;
      })
    : [];

  const hasActiveFilters =
    perishableOnly ||
    storageType !== "all" ||
    supplierId !== "all" ||
    stockStatus !== "all";

  const clearFilters = () => {
    setPerishableOnly(false);
    setStorageType("all");
    setSupplierId("all");
    setStockStatus("all");
  };

  // Export handlers
  const handleExportBasic = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast.error("No items to export");
      return;
    }
    
    setIsExporting(true);
    try {
      exportItemsToCSV(filteredItems, currentEvent?.name);
      toast.success(`Exported ${filteredItems.length} items to CSV`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export items");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDetailed = () => {
    if (!filteredItems || filteredItems.length === 0) {
      toast.error("No items to export");
      return;
    }
    
    setIsExporting(true);
    try {
      exportItemsWithSummary(filteredItems, currentEvent?.name);
      toast.success(`Exported ${filteredItems.length} items with summary to CSV`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export items");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to check if item needs attention
  const getItemAlerts = (item: Item) => {
    const alerts: {
      type: "warning" | "error";
      message: string;
      icon: typeof AlertTriangle;
    }[] = [];

    // Low stock alert
    if (isBelowReorderPoint(item)) {
      alerts.push({
        type: "warning",
        message: `Low stock (below ${item.reorderPoint})`,
        icon: TrendingDown,
      });
    }

    // Out of stock
    if (item.quantity === 0) {
      alerts.push({
        type: "error",
        message: "Out of stock",
        icon: AlertTriangle,
      });
    }

    // Expiring soon
    const expiringBatch = item.batches?.find(
      (batch) => batch.expirationDate && isExpiringSoon(batch.expirationDate)
    );
    if (expiringBatch && expiringBatch.expirationDate) {
      const days = daysUntilExpiry(expiringBatch.expirationDate);
      alerts.push({
        type: days < 3 ? "error" : "warning",
        message: `Expires in ${days} day${days !== 1 ? "s" : ""}`,
        icon: Clock,
      });
    }

    return alerts;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inventory Items</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your event inventory items
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleExportBasic}
              disabled={isExporting || !filteredItems || filteredItems.length === 0}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={handleExportDetailed}
              disabled={isExporting || !filteredItems || filteredItems.length === 0}
              className="w-full sm:w-auto min-h-[44px]"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Detailed
            </Button>
            <Link href="/items/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* Primary Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 min-h-[44px]"
                aria-label="Search inventory items"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto min-h-[44px]"
              aria-label={
                showFilters ? "Hide advanced filters" : "Show more filters"
              }
              aria-expanded={showFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide" : "More"} Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {
                    [
                      perishableOnly,
                      storageType !== "all",
                      supplierId !== "all",
                      stockStatus !== "all",
                    ].filter(Boolean).length
                  }
                </Badge>
              )}
            </Button>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Storage Type
                    </label>
                    <Select value={storageType} onValueChange={setStorageType}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {storageTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Supplier
                    </label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="All Suppliers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Suppliers</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Stock Level
                    </label>
                    <Select value={stockStatus} onValueChange={setStockStatus}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stockStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => setPerishableOnly(!perishableOnly)}
                      className={`w-full min-h-[44px] ${
                        perishableOnly
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }`}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {perishableOnly ? "Perishable Only" : "Show All"}
                    </Button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Items List/Table */}
        {isLoading ? (
          <ItemsListSkeleton />
        ) : filteredItems.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name & Alerts</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const alerts = getItemAlerts(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.name}</span>
                              {item.isPerishable && (
                                <PerishableBadge isPerishable />
                              )}
                              {item.isAlcohol && <PerishableBadge isAlcohol />}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              SKU: {item.sku}
                            </div>
                            {alerts.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {alerts.map((alert, idx) => (
                                  <Badge
                                    key={idx}
                                    variant={
                                      alert.type === "error"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    <alert.icon className="h-3 w-3 mr-1" />
                                    {alert.message}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getCategoryBadgeVariant(item.category)}
                          >
                            {item.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {item.quantity} {item.unitOfMeasure?.toLowerCase() || "units"}
                            </div>
                            {item.reorderPoint && (
                              <div className="text-xs text-muted-foreground">
                                Reorder: {item.reorderPoint}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.storageType ? (
                            <StorageTypeBadge storageType={item.storageType} />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.supplier ? (
                            <span className="text-sm">
                              {item.supplier.name}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/items/${item.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-[44px] min-w-[44px]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(item.id)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredItems.map((item) => {
                const alerts = getItemAlerts(item);
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-base truncate">
                              {item.name}
                            </h3>
                            {item.isPerishable && (
                              <PerishableBadge isPerishable />
                            )}
                            {item.isAlcohol && <PerishableBadge isAlcohol />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.sku}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge
                              variant={getCategoryBadgeVariant(item.category)}
                              className="text-xs"
                            >
                              {item.category.replace(/_/g, " ")}
                            </Badge>
                            <StatusBadge
                              status={item.status}
                              className="text-xs"
                            />
                            {item.storageType && (
                              <StorageTypeBadge
                                storageType={item.storageType}
                              />
                            )}
                          </div>
                          {alerts.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alerts.map((alert, idx) => (
                                <Badge
                                  key={idx}
                                  variant={
                                    alert.type === "error"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  <alert.icon className="h-3 w-3 mr-1" />
                                  {alert.message}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link href={`/items/${item.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            className="h-10 w-10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Quantity
                            </p>
                            <p className="font-medium">
                              {item.quantity} {item.unitOfMeasure?.toLowerCase() || "units"}
                            </p>
                            {item.reorderPoint && (
                              <p className="text-xs text-muted-foreground">
                                Reorder: {item.reorderPoint}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              Location
                            </p>
                            <p className="font-medium truncate">
                              {item.location}
                            </p>
                          </div>
                        </div>
                        {item.supplier && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Supplier
                            </p>
                            <p className="font-medium">{item.supplier.name}</p>
                          </div>
                        )}
                        {item.unitPrice && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Unit Price
                            </p>
                            <p className="font-medium">
                              {formatCurrency(Number(item.unitPrice))}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">
              No items found. Add your first item to get started!
            </p>
            <Link href="/items/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item from your inventory. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
