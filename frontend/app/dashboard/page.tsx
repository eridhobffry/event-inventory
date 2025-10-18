"use client";

import { useMemo } from "react";
import { useUser } from "@stackframe/stack";
import { useItems } from "@/hooks/useItems";
import { useAuditStats } from "@/hooks/useAudits";
import { useEventContext } from "@/contexts/EventContext";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { PendingInvitationsCard } from "@/components/PendingInvitationsCard";
import { RoleBadge } from "@/components/RoleBadge";
import { ExpiringItemsWidget } from "@/components/dashboard/ExpiringItemsWidget";
import { LowStockWidget } from "@/components/dashboard/LowStockWidget";
import { SupplierPerformanceWidget } from "@/components/dashboard/SupplierPerformanceWidget";
import { WasteSummaryWidget } from "@/components/dashboard/WasteSummaryWidget";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { Role } from "@/hooks/useInvitations";
import { useWasteLogs } from "@/hooks/useWaste";
import {
  buildWasteSummary,
  createEmptyWasteSummary,
  THIRTY_DAYS_MS,
} from "@/lib/utils/waste";

export default function DashboardPage() {
  const user = useUser({ or: "redirect" });
  const { currentEvent, events } = useEventContext();
  const { data: itemsData, isLoading: itemsLoading } = useItems({ limit: 100 });
  const { data: statsData, isLoading: statsLoading } = useAuditStats();
  const thirtyDaysAgoIso = useMemo(
    () => new Date(Date.now() - THIRTY_DAYS_MS).toISOString(),
    []
  );
  const nowIso = useMemo(() => new Date().toISOString(), []);
  const { data: wasteLogsData, isLoading: wasteLogsLoading } = useWasteLogs({
    limit: 100,
    startDate: thirtyDaysAgoIso,
    endDate: nowIso,
  });

  if (!user) {
    redirect("/");
  }

  const totalItems = itemsData?.pagination?.total || 0;
  const recentAudits = statsData?.recentAudits || [];
  const items = useMemo(() => itemsData?.data ?? [], [itemsData?.data]);
  const recentItems = useMemo(() => items.slice(0, 5), [items]);
  const wasteLogs = useMemo(
    () => wasteLogsData?.data ?? [],
    [wasteLogsData?.data]
  );
  const wasteSummary = useMemo(() => {
    if (wasteLogs.length === 0) {
      return createEmptyWasteSummary();
    }
    return buildWasteSummary(wasteLogs);
  }, [wasteLogs]);
  const showFnbInsights = useMemo(
    () =>
      items.some(
        (item) => item.category === "FOOD_BEVERAGE" || item.isPerishable
      ),
    [items]
  );

  // Show message if no event is selected
  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-6 md:py-8">
          {/* Pending Invitations - Always show even without events */}
          <div className="mb-6">
            <PendingInvitationsCard />
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
              <PackageIcon className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">
                No Event Selected
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {events.length > 0
                  ? "Select an event from the dropdown above to view your dashboard"
                  : "Create your first event or accept an invitation to get started"}
              </p>
              <Link href="/events/new" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto min-h-[44px]">
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

  const isLoadingData = itemsLoading || statsLoading || wasteLogsLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold truncate">
                  {currentEvent.name}
                </h1>
                {currentEvent.role === "owner" && (
                  <Link href={`/events/${currentEvent.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                <p className="text-sm md:text-base text-muted-foreground">
                  Welcome back, {user.displayName || "there"}!
                </p>
                <RoleBadge role={currentEvent.role.toUpperCase() as Role} />
              </div>
            </div>
            <Link href="/items/new" className="flex-shrink-0">
              <Button className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>

          {/* Pending Invitations */}
          <div className="mb-6">
            <PendingInvitationsCard />
          </div>

          {/* Event Details */}
          <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
            {currentEvent.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{currentEvent.location}</span>
              </div>
            )}
            {currentEvent.startDate && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>
                  {new Date(currentEvent.startDate).toLocaleDateString()}
                  {currentEvent.endDate &&
                    ` - ${new Date(currentEvent.endDate).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoadingData ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Recent Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Items</CardTitle>
                  <CardDescription>
                    Latest inventory items added
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : recentItems.length > 0 ? (
                    <div className="space-y-3">
                      {recentItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}`}
                          className="block"
                        >
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors min-h-[60px]">
                            <div className="flex-1 min-w-0 mr-3">
                              <p className="font-medium truncate">
                                {item.name}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.category.replace(/_/g, " ")} •{" "}
                                {item.location}
                              </p>
                            </div>
                            <div className="text-sm font-medium flex-shrink-0">
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
                  <Link href="/items" className="block">
                    <Button
                      variant="outline"
                      className="w-full mt-4 min-h-[44px]"
                    >
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
                    <div className="space-y-3">
                      {recentAudits.map((audit) => (
                        <div
                          key={audit.id}
                          className="flex items-center justify-between p-3 rounded-lg border min-h-[60px]"
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <p className="font-medium truncate">
                              {audit.item?.name || "Unknown Item"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Discrepancy: {audit.discrepancy > 0 ? "+" : ""}
                              {audit.discrepancy}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-medium flex-shrink-0 ${
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
                  <Link href="/audits" className="block">
                    <Button
                      variant="outline"
                      className="w-full mt-4 min-h-[44px]"
                    >
                      View All Audits
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
            {showFnbInsights && (
              <section className="mt-8 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    Food &amp; Beverage Insights
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Monitor perishables, supplier performance, and waste trends.
                  </p>
                </div>
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <ExpiringItemsWidget items={items} isLoading={itemsLoading} />
                  <LowStockWidget items={items} isLoading={itemsLoading} />
                  <WasteSummaryWidget
                    summary={wasteSummary}
                    isLoading={wasteLogsLoading}
                  />
                  <SupplierPerformanceWidget
                    items={items}
                    isLoading={itemsLoading}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
