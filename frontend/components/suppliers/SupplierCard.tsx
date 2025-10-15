import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Supplier } from "@/lib/api";
import { Mail, Phone, Clock, Package, Pencil, Trash2 } from "lucide-react";

interface SupplierCardProps {
  supplier: Supplier;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SupplierCard({ supplier, onEdit, onDelete }: SupplierCardProps) {
  const itemCount = supplier._count?.items || 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{supplier.name}</CardTitle>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
              {!supplier.isActive && (
                <Badge variant="secondary" className="uppercase">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex shrink-0 gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit supplier</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-destructive text-destructive-foreground transition-all hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete supplier</span>
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {supplier.contactName && (
            <div className="flex items-center text-muted-foreground">
              <span className="font-medium">Contact:</span>
              <span className="ml-2">{supplier.contactName}</span>
            </div>
          )}
          {supplier.contactEmail && (
            <div className="flex items-center text-muted-foreground">
              <Mail className="mr-2 h-4 w-4" />
              <a
                href={`mailto:${supplier.contactEmail}`}
                className="hover:underline"
              >
                {supplier.contactEmail}
              </a>
            </div>
          )}
          {supplier.contactPhone && (
            <div className="flex items-center text-muted-foreground">
              <Phone className="mr-2 h-4 w-4" />
              <a href={`tel:${supplier.contactPhone}`} className="hover:underline">
                {supplier.contactPhone}
              </a>
            </div>
          )}
          {supplier.leadTimeDays && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              <span>Lead time: {supplier.leadTimeDays} days</span>
            </div>
          )}
          {supplier.notes && (
            <div className="mt-3 rounded-md bg-muted p-2 text-xs">
              {supplier.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
