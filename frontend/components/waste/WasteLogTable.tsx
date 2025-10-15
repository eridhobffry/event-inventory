import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WasteLog } from "@/lib/api";
import { getWasteReasonLabel } from "@/lib/utils/inventory";
import { formatDate } from "@/lib/utils/date";
import { formatCurrency, formatQuantity } from "@/lib/utils/formatters";

interface WasteLogTableProps {
  wasteLogs: WasteLog[];
  unitOfMeasure: string;
  showItemName?: boolean;
}

const reasonColors: Record<string, string> = {
  SPOILAGE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  OVERPRODUCTION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  DAMAGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONTAMINATION: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function WasteLogTable({
  wasteLogs,
  unitOfMeasure,
  showItemName = false,
}: WasteLogTableProps) {
  if (wasteLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No waste logs recorded.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showItemName && <TableHead>Item</TableHead>}
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Cost Impact</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wasteLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                {formatDate(log.timestamp, true)}
              </TableCell>
              {showItemName && log.item && (
                <TableCell className="font-medium">{log.item.name}</TableCell>
              )}
              <TableCell className="font-medium">
                {formatQuantity(log.quantity, unitOfMeasure)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={reasonColors[log.reason] || reasonColors.OTHER}
                >
                  {getWasteReasonLabel(log.reason)}
                </Badge>
              </TableCell>
              <TableCell>
                {log.costImpact ? (
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(log.costImpact)}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">N/A</span>
                )}
              </TableCell>
              <TableCell className="max-w-xs">
                {log.notes ? (
                  <span className="text-sm text-muted-foreground">{log.notes}</span>
                ) : (
                  <span className="text-muted-foreground italic text-sm">No notes</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
