"use client";

import { useUser } from "@stackframe/stack";
import { useItems } from "@/hooks/useItems";
import { useAuditStats } from "@/hooks/useAudits";
import { useEventContext } from "@/contexts/EventContext";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
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
  PackageIcon,
  ClipboardList,
  AlertTriangle,
  Plus,
  Calendar,
  MapPin,
  Edit2,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const user = useUser({ or: "redirect" });
  const { currentEvent } = useEventContext();
  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 5 });
  const { data: statsData, isLoading: statsLoading } = useAuditStats();

  if (!user) {
    redirect("/");
  }

  const totalItems = itemsData?.pagination?.total || 0;
  const recentAudits = statsData?.recentAudits || [];

  // Show message if no event is selected
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <PackageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Event Selected</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Select an event from the dropdown above or create a new event to
                get started
              </p>
              <Link href="/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{currentEvent.name}</h1>
              {currentEvent.role === "owner" && (
                <Link href={`/events/${currentEvent.id}`}>
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-muted-foreground">
                Welcome back, {user.displayName || "there"}!
              </p>
              <Badge
                variant={
                  currentEvent.role === "owner" ? "default" : "secondary"
                }
              >
                {currentEvent.role === "owner" ? "Owner" : "Member"}
              </Badge>
            </div>
            {currentEvent.location && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {currentEvent.location}
              </div>
            )}
            {currentEvent.startDate && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(currentEvent.startDate).toLocaleDateString()}
                {currentEvent.endDate &&
                  ` - ${new Date(currentEvent.endDate).toLocaleDateString()}`}
              </div>
            )}
          </div>
          <Link href="/items/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Items"
            value={totalItems}
            description="In inventory"
            icon={PackageIcon}
          />
          <StatsCard
            title="Total Audits"
            value={statsData?.totalAudits || 0}
            description="All time"
            icon={ClipboardList}
          />
          <StatsCard
            title="Recent Audits"
            value={statsData?.auditsLast30Days || 0}
            description="Last 30 days"
            icon={ClipboardList}
          />
          <StatsCard
            title="Discrepancies"
            value={statsData?.itemsWithDiscrepancies || 0}
            description="Items with issues"
            icon={AlertTriangle}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Items */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Items</CardTitle>
              <CardDescription>Latest inventory items added</CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : itemsData?.data && itemsData.data.length > 0 ? (
                <div className="space-y-4">
                  {itemsData.data.map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.category.replace(/_/g, " ")} • {item.location}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No items yet. Add your first item!
                </p>
              )}
              <Link href="/items">
                <Button variant="outline" className="w-full mt-4">
                  View All Items
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Audits */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Audits</CardTitle>
              <CardDescription>Latest audit log entries</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : recentAudits.length > 0 ? (
                <div className="space-y-4">
                  {recentAudits.map((audit) => (
                    <div
                      key={audit.id}
                      className="flex items-center justify-between p-2 rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {audit.item?.name || "Unknown Item"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Discrepancy: {audit.discrepancy > 0 ? "+" : ""}
                          {audit.discrepancy}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          audit.discrepancy === 0
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {audit.discrepancy === 0 ? "✓ Match" : "⚠ Issue"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No audits yet. Create your first audit!
                </p>
              )}
              <Link href="/audits">
                <Button variant="outline" className="w-full mt-4">
                  View All Audits
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
