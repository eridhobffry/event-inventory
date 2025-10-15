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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { data: item, isLoading } = useItem(resolvedParams.id);
  const { data: auditsData } = useAudits({
    itemId: resolvedParams.id,
    limit: 10,
  });
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  if (!user) {
    redirect("/");
  }

  const handleUpdate = async (data: any) => {
    await updateMutation.mutateAsync({ id: resolvedParams.id, data });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(resolvedParams.id);
    router.push("/items");
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
                      This will permanently delete "{item.name}" from your
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{item.name}</CardTitle>
                  <Badge>{item.category.replace(/_/g, " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Quantity
                    </p>
                    <p className="text-2xl font-bold">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Location
                    </p>
                    <p className="text-lg">{item.location}</p>
                  </div>
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
              </CardContent>
            </Card>
          )}

          {/* Audit History */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Audit History</CardTitle>
              <CardDescription>Recent audits for this item</CardDescription>
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
        </div>
      </main>
    </div>
  );
}
