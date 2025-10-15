"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { useAudits, useCreateAudit } from "@/hooks/useAudits";
import { Navbar } from "@/components/Navbar";
import { AuditForm } from "@/components/AuditForm";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function AuditsPage() {
  const user = useUser({ or: "redirect" });
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useAudits({ page, limit: 20 });
  const createMutation = useCreateAudit();

  if (!user) {
    redirect("/");
  }

  const handleCreateAudit = async (auditData: any) => {
    await createMutation.mutateAsync(auditData);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track inventory discrepancies and audits
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Audit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Audit Log</DialogTitle>
                <DialogDescription>
                  Record a new inventory audit with physical count
                </DialogDescription>
              </DialogHeader>
              <AuditForm
                onSubmit={handleCreateAudit}
                isSubmitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Audit Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Audits
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.pagination.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                With Discrepancies
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.data.filter((audit) => audit.discrepancy !== 0).length ||
                  0}
              </div>
              <p className="text-xs text-muted-foreground">Current page</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Perfect Matches
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data?.data.filter((audit) => audit.discrepancy === 0).length ||
                  0}
              </div>
              <p className="text-xs text-muted-foreground">Current page</p>
            </CardContent>
          </Card>
        </div>

        {/* Audits Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading audits...</p>
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Expected</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Discrepancy</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell>
                        {new Date(audit.timestamp).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(audit.timestamp).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {audit.item?.name || "Unknown"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {audit.item?.location}
                        </span>
                      </TableCell>
                      <TableCell>{audit.expectedQuantity}</TableCell>
                      <TableCell>{audit.actualQuantity}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            audit.discrepancy === 0
                              ? "text-green-600"
                              : audit.discrepancy > 0
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}
                        >
                          {audit.discrepancy > 0 ? "+" : ""}
                          {audit.discrepancy}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {audit.notes || "-"}
                      </TableCell>
                      <TableCell>
                        {audit.discrepancy === 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Match
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-orange-50 text-orange-700 border-orange-200"
                          >
                            Discrepancy
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

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
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No audits yet. Create your first audit to get started!
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Audit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Audit Log</DialogTitle>
                  <DialogDescription>
                    Record a new inventory audit with physical count
                  </DialogDescription>
                </DialogHeader>
                <AuditForm
                  onSubmit={handleCreateAudit}
                  isSubmitting={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
    </div>
  );
}
