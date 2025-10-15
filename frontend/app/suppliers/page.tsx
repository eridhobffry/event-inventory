"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SupplierCard } from "@/components/suppliers/SupplierCard";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { api, Supplier } from "@/lib/api";
import { SupplierFormData } from "@/lib/validations/supplier";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function SuppliersPage() {
  const user = useUser();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.getSuppliers({ limit: 100 });
      setSuppliers(response.data);
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: SupplierFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      await api.createSupplier(data, accessToken.accessToken);
      toast.success("Supplier created successfully");
      setCreateDialogOpen(false);
      loadSuppliers();
    } catch (error: any) {
      console.error("Failed to create supplier:", error);
      toast.error(error.response?.data?.message || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: SupplierFormData) => {
    if (!user || !selectedSupplier) return;

    setIsSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      await api.updateSupplier(selectedSupplier.id, data, accessToken.accessToken);
      toast.success("Supplier updated successfully");
      setEditDialogOpen(false);
      setSelectedSupplier(null);
      loadSuppliers();
    } catch (error: any) {
      console.error("Failed to update supplier:", error);
      toast.error(error.response?.data?.message || "Failed to update supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedSupplier) return;

    setIsSubmitting(true);
    try {
      const accessToken = await user.getAuthJson();
      await api.deleteSupplier(selectedSupplier.id, accessToken.accessToken);
      toast.success("Supplier deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedSupplier(null);
      loadSuppliers();
    } catch (error: any) {
      console.error("Failed to delete supplier:", error);
      toast.error(error.response?.data?.message || "Failed to delete supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto py-8 space-y-6">
        {!user ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-semibold mb-2">Sign in required</h1>
            <p className="text-muted-foreground">
              Please sign in to manage suppliers for your events.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Suppliers</h1>
                <p className="text-muted-foreground">
                  Manage your food &amp; beverage suppliers
                </p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Supplier</DialogTitle>
                    <DialogDescription>
                      Add a new supplier to your inventory system
                    </DialogDescription>
                  </DialogHeader>
                  <SupplierForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Suppliers Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading suppliers...</p>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No suppliers found matching your search" : "No suppliers yet"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Supplier
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    onEdit={() => {
                      setSelectedSupplier(supplier);
                      setEditDialogOpen(true);
                    }}
                    onDelete={() => {
                      setSelectedSupplier(supplier);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Supplier</DialogTitle>
                  <DialogDescription>Update supplier information</DialogDescription>
                </DialogHeader>
                {selectedSupplier && (
                  <SupplierForm
                    defaultValues={selectedSupplier}
                    onSubmit={handleEdit}
                    isSubmitting={isSubmitting}
                    submitLabel="Update Supplier"
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{selectedSupplier?.name}"?
                    {selectedSupplier?._count?.items ? (
                      <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                        Warning: This supplier has {selectedSupplier._count.items} associated item(s).
                        Deletion will fail unless items are reassigned or deleted first.
                      </span>
                    ) : (
                      <span className="block mt-2">
                        This action cannot be undone.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </main>
    </div>
  );
}
