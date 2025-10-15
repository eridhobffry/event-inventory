import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ItemBatch } from "@/lib/api";
import { BatchExpiryBadge } from "./BatchExpiryBadge";
import { formatDate } from "@/lib/utils/date";
import { formatQuantity } from "@/lib/utils/formatters";

interface BatchTableProps {
  batches: ItemBatch[];
  unitOfMeasure: string;
  showItemName?: boolean;
}

export function BatchTable({ batches, unitOfMeasure, showItemName = false }: BatchTableProps) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No batches found. Receive inventory to create batches.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showItemName && <TableHead>Item</TableHead>}
            <TableHead>Lot Number</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              {showItemName && batch.item && (
                <TableCell className="font-medium">{batch.item.name}</TableCell>
              )}
              <TableCell>
                {batch.lotNumber || (
                  <span className="text-muted-foreground italic">No lot number</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatQuantity(batch.quantity, unitOfMeasure)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    of {formatQuantity(batch.initialQuantity, unitOfMeasure)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(batch.receivedAt)}
              </TableCell>
              <TableCell>
                {batch.expirationDate ? (
                  <BatchExpiryBadge expirationDate={batch.expirationDate} />
                ) : (
                  <span className="text-muted-foreground text-sm">No expiry</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={batch.isOpen ? "default" : "secondary"}>
                  {batch.isOpen ? "Open" : "Closed"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
