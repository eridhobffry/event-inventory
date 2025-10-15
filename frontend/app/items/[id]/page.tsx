"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { useItem, useUpdateItem, useDeleteItem } from "@/hooks/useItems";
import { useAudits } from "@/hooks/useAudits";
import { Navbar } from "@/components/Navbar";
import { ItemForm } from "@/components/ItemForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchTable } from "@/components/batches/BatchTable";
import { BatchForm } from "@/components/batches/BatchForm";
import { ConsumeForm } from "@/components/batches/ConsumeForm";
import { WasteLogTable } from "@/components/waste/WasteLogTable";
import { WasteLogForm } from "@/components/waste/WasteLogForm";
import { WasteSummaryCard } from "@/components/waste/WasteSummaryCard";
import { StorageTypeBadge } from "@/components/ui/StorageTypeBadge";
import { PerishableBadge } from "@/components/ui/PerishableBadge";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  Plus,
  PackageMinus,
  Recycle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { api, ItemBatch, Item, WasteLog, WasteSummary } from "@/lib/api";
import { BatchFormData, ConsumeBatchData } from "@/lib/validations/batch";
import { WasteLogFormData } from "@/lib/validations/waste";
import { toast } from "sonner";
import {
  buildWasteSummary,
  createEmptyWasteSummary,
  THIRTY_DAYS_MS,
} from "@/lib/utils/waste";
import { formatCurrency } from "@/lib/utils/formatters";

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [batches, setBatches] = useState<ItemBatch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [receiveBatchOpen, setReceiveBatchOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [wasteLoading, setWasteLoading] = useState(true);
  const [logWasteOpen, setLogWasteOpen] = useState(false);
  const [isWasteSubmitting, setIsWasteSubmitting] = useState(false);
  const [wasteSummary, setWasteSummary] = useState<WasteSummary>(() =>
    createEmptyWasteSummary()
  );
  const openBatchCount = useMemo(
    () =>
      batches.reduce(
        (count, batch) => (batch.isOpen ? count + 1 : count),
        0
      ),
    [batches]
  );
  const hasOpenBatches = openBatchCount > 0;

  const {
    data: item,
    isLoading,
    refetch: refetchItem,
  } = useItem(resolvedParams.id);
  const { data: auditsData } = useAudits({
    itemId: resolvedParams.id,
    limit: 10,
  });
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  // Debug: Log item data to console
  useEffect(() => {
    if (item) {
      console.log("Item data:", item);
      console.log("Item status:", item.status);
      console.log("Item unitOfMeasure:", item.unitOfMeasure);
      console.log("Item storageType:", item.storageType);
    }
  }, [item]);

  if (!user) {
    redirect("/");
  }

  const handleUpdate = async (data: any) => {
    await updateMutation.mutateAsync({ id: resolvedParams.id, data });
    await refetchItem(); // Force refetch to get latest data
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(resolvedParams.id);
    router.push("/items");
  };

  const hydrateBatchesFromItem = (sourceItem: Item) => {
    if (sourceItem.batches && sourceItem.batches.length > 0) {
      const sorted = [...sourceItem.batches].sort((a, b) => {
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1;
        }

        const aExpiration = a.expirationDate
          ? new Date(a.expirationDate).getTime()
          : Number.POSITIVE_INFINITY;
        const bExpiration = b.expirationDate
          ? new Date(b.expirationDate).getTime()
          : Number.POSITIVE_INFINITY;

        if (aExpiration !== bExpiration) {
          return aExpiration - bExpiration;
        }

        return (
          new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
        );
      });

      setBatches(sorted);
    } else {
      setBatches([]);
    }
  };

  // Load batches when item data is available
  const loadBatches = async () => {
    if (!item) {
      setBatches([]);
      setBatchesLoading(false);
      return;
    }

    setBatchesLoading(true);
    try {
      hydrateBatchesFromItem(item);
    } catch (error) {
      console.error("Failed to load batches:", error);
      toast.error("Failed to load batches");
    } finally {
      setBatchesLoading(false);
    }
  };

  const loadWasteLogs = async () => {
    if (!item) {
      setWasteLogs([]);
      setWasteSummary(createEmptyWasteSummary());
      setWasteLoading(false);
      return;
    }

    setWasteLoading(true);
    try {
      const response = await api.getWasteLogs({
        itemId: item.id,
        eventId: item.eventId,
        limit: 50,
        page: 1,
      });

      const sortedLogs = [...response.data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const cutoff = Date.now() - THIRTY_DAYS_MS;
      const recentLogs = sortedLogs.filter(
        (log) => new Date(log.timestamp).getTime() >= cutoff
      );

      setWasteLogs(sortedLogs);
      setWasteSummary(buildWasteSummary(recentLogs));
    } catch (error) {
      console.error("Failed to load waste logs:", error);
      toast.error("Failed to load waste logs");
      setWasteLogs([]);
      setWasteSummary(createEmptyWasteSummary());
    } finally {
      setWasteLoading(false);
    }
  };

  // Load batches when item changes
  useEffect(() => {
    if (item) {
      loadBatches();
      loadWasteLogs();
    }
  }, [item]);

  const handleReceiveBatch = async (data: BatchFormData) => {
    if (!user) return;

    setIsBatchSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      const payload = {
        eventId: data.eventId,
        quantity: data.quantity,
        lotNumber: data.lotNumber?.trim() ? data.lotNumber.trim() : undefined,
        expirationDate: data.expirationDate
          ? new Date(data.expirationDate).toISOString()
          : undefined,
        receivedAt: data.receivedAt
          ? new Date(data.receivedAt).toISOString()
          : new Date().toISOString(),
        manufacturedAt: data.manufacturedAt
          ? new Date(data.manufacturedAt).toISOString()
          : undefined,
        notes: data.notes?.trim() ? data.notes.trim() : undefined,
      };

      await api.createBatch(
        resolvedParams.id,
        payload,
        accessToken.accessToken
      );
      toast.success("Batch received successfully");
      setReceiveBatchOpen(false);

      const updated = await refetchItem();
      if (updated.data) {
        hydrateBatchesFromItem(updated.data);
      } else {
        loadBatches();
      }
    } catch (error: any) {
      console.error("Failed to receive batch:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to receive batch";
      toast.error(message);
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  const handleConsume = async (data: ConsumeBatchData) => {
    if (!user) return;

    if (!hasOpenBatches) {
      toast.error("No open batches available to consume");
      return;
    }

    setIsBatchSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      const result = await api.consumeBatch(
        resolvedParams.id,
        data,
        accessToken.accessToken
      );

      if (result.batches && result.batches.length > 0) {
        const breakdown = result.batches
          .map((batchResult) => {
            const matchedBatch = batches.find((b) => b.id === batchResult.id);
            const label = matchedBatch?.lotNumber
              ? `batch ${matchedBatch.lotNumber}`
              : `batch ${batchResult.id.slice(0, 8)}`;
            return `${batchResult.consumed} from ${label}`;
          })
          .join(", ");
        toast.success(`Consumed ${data.quantity} units: ${breakdown}`);
      } else {
        toast.success(`Consumed ${data.quantity} units`);
      }

      setConsumeOpen(false);
      const updated = await refetchItem();
      if (updated.data) {
        hydrateBatchesFromItem(updated.data);
      } else {
        loadBatches();
      }
    } catch (error: any) {
      console.error("Failed to consume:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to consume stock";
      toast.error(message);
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  const handleLogWaste = async (data: WasteLogFormData) => {
    if (!user || !item) return;

    setIsWasteSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      const payload = {
        ...data,
        batchId: data.batchId || undefined,
      };

      await api.createWasteLog(payload, accessToken.accessToken);
      toast.success("Waste logged successfully");
      setLogWasteOpen(false);

      const updated = await refetchItem();
      if (updated.data) {
        hydrateBatchesFromItem(updated.data);
      } else {
        loadBatches();
      }

      await loadWasteLogs();
    } catch (error: any) {
      console.error("Failed to log waste:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to log waste";
      toast.error(message);
    } finally {
      setIsWasteSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading item...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Item not found</p>
            <Link href="/items">
              <Button className="mt-4">Back to Items</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/items">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Items
              </Button>
            </Link>
            <div className="flex gap-2">
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {item.name} from your
                      inventory. This action cannot be undone.
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
          </div>

          {isEditing ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Edit Item</CardTitle>
                    <CardDescription>
                      Update the details for this inventory item
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ItemForm
                  defaultValues={item}
                  onSubmit={handleUpdate}
                  isSubmitting={updateMutation.isPending}
                  submitLabel="Save Changes"
                />
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="batches">Batches</TabsTrigger>
                <TabsTrigger value="waste">Waste Logs</TabsTrigger>
                <TabsTrigger value="audits">Audit History</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          SKU: {item.sku}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge>{item.category.replace(/_/g, " ")}</Badge>
                        <StatusBadge status={item.status} />
                        {item.isPerishable && (
                          <PerishableBadge isPerishable={item.isPerishable} />
                        )}
                        {item.isAlcohol && (
                          <PerishableBadge isAlcohol={item.isAlcohol} />
                        )}
                        {item.storageType && (
                          <StorageTypeBadge storageType={item.storageType} />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Quantity
                        </p>
                        <p className="text-2xl font-bold">
                          {item.quantity}{" "}
                          {item.unitOfMeasure?.toLowerCase() || "units"}
                        </p>
                      </div>
                      {item.unitPrice && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Unit Price
                          </p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(Number(item.unitPrice))}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Location
                        </p>
                        <p className="text-lg">{item.location}</p>
                      </div>
                      {item.bin && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Bin
                          </p>
                          <p className="text-lg">{item.bin}</p>
                        </div>
                      )}
                      {item.supplier && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Supplier
                          </p>
                          <p className="text-lg">{item.supplier.name}</p>
                        </div>
                      )}
                      {item.parLevel && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Par Level
                          </p>
                          <p className="text-lg">{item.parLevel}</p>
                        </div>
                      )}
                      {item.reorderPoint && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Reorder Point
                          </p>
                          <p className="text-lg">{item.reorderPoint}</p>
                        </div>
                      )}
                      {item.isAlcohol && item.abv && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            ABV
                          </p>
                          <p className="text-lg">{item.abv}%</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Audit
                        </p>
                        <p className="text-sm">
                          {item.lastAudit
                            ? new Date(item.lastAudit).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Created
                        </p>
                        <p className="text-sm">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {item.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Description
                        </p>
                        <p className="text-sm">{item.description}</p>
                      </div>
                    )}
                    {item.allergens && item.allergens.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Allergens
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {item.allergens.map((allergen) => (
                            <Badge key={allergen} variant="outline">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Batches Tab */}
              <TabsContent value="batches">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Batch Inventory</CardTitle>
                        <CardDescription>
                          Track batches with expiration dates and lot numbers
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={receiveBatchOpen}
                          onOpenChange={setReceiveBatchOpen}
                        >
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Receive Batch
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Receive Inventory</DialogTitle>
                              <DialogDescription>
                                Add a new batch to {item.name}
                              </DialogDescription>
                            </DialogHeader>
                            <BatchForm
                              eventId={item.eventId}
                              itemName={item.name}
                              unitOfMeasure={item.unitOfMeasure || "EACH"}
                              onSubmit={handleReceiveBatch}
                              isSubmitting={isBatchSubmitting}
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog
                          open={consumeOpen}
                          onOpenChange={setConsumeOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              disabled={
                                item.quantity === 0 || !hasOpenBatches || batchesLoading
                              }
                              title={
                                batchesLoading
                                  ? "Loading batch information"
                                  : item.quantity === 0
                                  ? "No inventory available to consume"
                                  : !hasOpenBatches
                                  ? "Receive a batch before consuming stock"
                                  : undefined
                              }
                            >
                              <PackageMinus className="h-4 w-4 mr-2" />
                              Consume Stock
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Consume Stock</DialogTitle>
                              <DialogDescription>
                                Remove stock from {item.name} (FIFO)
                              </DialogDescription>
                            </DialogHeader>
                            <ConsumeForm
                              eventId={item.eventId}
                              itemName={item.name}
                              currentQuantity={item.quantity}
                              unitOfMeasure={item.unitOfMeasure || "EACH"}
                              onSubmit={handleConsume}
                              isSubmitting={isBatchSubmitting}
                              hasOpenBatches={hasOpenBatches}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {batchesLoading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading batches...</span>
                      </div>
                    ) : batches.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">
                          No batches received yet
                        </p>
                        <Button onClick={() => setReceiveBatchOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Receive First Batch
                        </Button>
                      </div>
                    ) : (
                      <BatchTable
                        batches={batches}
                        unitOfMeasure={item.unitOfMeasure || "EACH"}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Waste Logs Tab */}
              <TabsContent value="waste">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Waste Tracking</CardTitle>
                        <CardDescription>
                          Monitor waste events and understand cost impact
                        </CardDescription>
                      </div>
                      <Dialog
                        open={logWasteOpen}
                        onOpenChange={setLogWasteOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Recycle className="mr-2 h-4 w-4" />
                            Log Waste
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Log Waste</DialogTitle>
                            <DialogDescription>
                              Record waste for {item.name}
                            </DialogDescription>
                          </DialogHeader>
                          <WasteLogForm
                            itemId={item.id}
                            itemName={item.name}
                            eventId={item.eventId}
                            unitOfMeasure={item.unitOfMeasure || "EACH"}
                            unitPrice={
                              item.unitPrice !== undefined
                                ? Number(item.unitPrice)
                                : undefined
                            }
                            batches={batches.filter((batch) => batch.isOpen)}
                            onSubmit={handleLogWaste}
                            isSubmitting={isWasteSubmitting}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {wasteLogs.length > 0 && (
                      <WasteSummaryCard
                        summary={wasteSummary}
                        period="30 days"
                      />
                    )}

                    {wasteLoading ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading waste logs...</span>
                      </div>
                    ) : wasteLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed py-10 text-center">
                        <p className="text-muted-foreground">
                          No waste events logged for this item yet.
                        </p>
                        <Button onClick={() => setLogWasteOpen(true)}>
                          <Recycle className="mr-2 h-4 w-4" />
                          Log Waste
                        </Button>
                      </div>
                    ) : (
                      <WasteLogTable
                        wasteLogs={wasteLogs}
                        unitOfMeasure={item.unitOfMeasure}
                      />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit History Tab */}
              <TabsContent value="audits">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit History</CardTitle>
                    <CardDescription>
                      Recent audits for this item
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {auditsData?.data && auditsData.data.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Expected</TableHead>
                            <TableHead>Actual</TableHead>
                            <TableHead>Discrepancy</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {auditsData.data.map((audit) => (
                            <TableRow key={audit.id}>
                              <TableCell>
                                {new Date(audit.timestamp).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{audit.expectedQuantity}</TableCell>
                              <TableCell>{audit.actualQuantity}</TableCell>
                              <TableCell>
                                <span
                                  className={
                                    audit.discrepancy === 0
                                      ? "text-green-600"
                                      : "text-orange-600"
                                  }
                                >
                                  {audit.discrepancy > 0 ? "+" : ""}
                                  {audit.discrepancy}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {audit.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No audit history for this item yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}
