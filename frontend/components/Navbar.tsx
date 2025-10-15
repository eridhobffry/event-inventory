"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  PackageIcon,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Plus,
  Calendar,
  Menu,
  LogOut,
} from "lucide-react";
import { useEventContext } from "@/contexts/EventContext";
import { useEvents } from "@/hooks/useEvents";
import { useEffect, useState } from "react";

export function Navbar() {
  const user = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { currentEventId, setCurrentEventId, events } = useEventContext();
  const { data: eventsData } = useEvents();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load events into context when they're fetched
  useEffect(() => {
    if (eventsData?.data) {
      // Events are already set in the useEvents hook
    }
  }, [eventsData]);

  if (!user) return null;

  const handleEventChange = (value: string) => {
    if (value === "create") {
      router.push("/events/new");
    } else {
      setCurrentEventId(value);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/events", label: "Events", icon: Calendar },
    { href: "/items", label: "Items", icon: PackageIcon },
    { href: "/audits", label: "Audits", icon: ClipboardList },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden min-h-[44px] min-w-[44px]"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <PackageIcon className="h-5 w-5" />
                      EventForge
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 flex flex-col gap-4">
                    {/* Event Selector in Mobile Menu */}
                    {events.length > 0 && (
                      <div className="pb-4 border-b">
                        <p className="text-sm font-medium mb-2">
                          Current Event
                        </p>
                        <Select
                          value={currentEventId || undefined}
                          onValueChange={(value) => {
                            handleEventChange(value);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <SelectTrigger className="w-full min-h-[44px]">
                            <SelectValue placeholder="Select event" />
                          </SelectTrigger>
                          <SelectContent>
                            {events.map((event) => (
                              <SelectItem key={event.id} value={event.id}>
                                {event.name}
                              </SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectItem value="create">
                              <div className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Event
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Mobile Navigation Links */}
                    <nav className="flex flex-col gap-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={
                              isActive(link.href) ? "secondary" : "ghost"
                            }
                            className="w-full justify-start min-h-[44px] text-base"
                          >
                            <link.icon className="h-5 w-5 mr-3" />
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </nav>

                    {/* Mobile Menu Footer */}
                    <div className="mt-auto pt-4 border-t space-y-2">
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start min-h-[44px] text-base"
                        >
                          <Settings className="h-5 w-5 mr-3" />
                          Settings
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full justify-start min-h-[44px] text-base"
                        onClick={() => {
                          user.signOut();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Logo */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-bold text-lg md:text-xl"
              >
                <PackageIcon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="hidden sm:inline">EventForge</span>
              </Link>

              {/* Desktop Event Selector */}
              {events.length > 0 && (
                <Select
                  value={currentEventId || undefined}
                  onValueChange={handleEventChange}
                >
                  <SelectTrigger className="hidden md:flex w-[180px] lg:w-[220px] min-h-[44px]">
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                    <SelectSeparator />
                    <SelectItem value="create">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Event
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive(link.href) ? "secondary" : "ghost"}
                      size="sm"
                      className="min-h-[44px]"
                    >
                      <link.icon className="h-4 w-4 mr-2" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Settings & User */}
            <div className="flex items-center gap-2">
              <Link href="/settings" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {user.displayName || user.primaryEmail}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => user.signOut()}
                  className="min-h-[44px]"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex-1">
              <Button
                variant={isActive(link.href) ? "secondary" : "ghost"}
                size="sm"
                className="w-full flex-col h-auto py-2 min-h-[56px] gap-1"
              >
                <link.icon
                  className={`h-5 w-5 ${
                    isActive(link.href) ? "text-primary" : ""
                  }`}
                />
                <span className="text-xs">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
