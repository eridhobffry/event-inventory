"use client";

import { useState } from "react";
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
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "AV_EQUIPMENT", label: "AV Equipment" },
  { value: "DECOR", label: "Decor" },
  { value: "SUPPLIES", label: "Supplies" },
  { value: "OTHER", label: "Other" },
];

export default function ItemsPage() {
  const user = useUser({ or: "redirect" });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useItems({
    page,
    limit: 20,
    q: search || undefined,
    category: category !== "all" ? category : undefined,
  });

  const deleteMutation = useDeleteItem();

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
      OTHER: "secondary",
    };
    return variants[cat] || "default";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Inventory Items</h1>
            <p className="text-muted-foreground">
              Manage your event inventory items
            </p>
          </div>
          <Link href="/items/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[200px]">
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
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Audit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(item.category)}>
                        {item.category.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      {item.lastAudit
                        ? new Date(item.lastAudit).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/items/${item.id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
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
