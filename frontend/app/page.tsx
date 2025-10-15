"use client";

import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { PackageIcon, Zap, Shield } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  const user = useUser();

  // Redirect to dashboard if already logged in
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg md:text-xl">
            <PackageIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="hidden sm:inline">EventForge Inventory</span>
            <span className="sm:hidden">EventForge</span>
          </div>
          <Link href="/handler/sign-in">
            <Button variant="outline" className="min-h-[44px]">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Event Inventory Management{" "}
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 px-4">
            Streamline your event inventory tracking with AI-ready
            infrastructure. Track items, manage audits, and integrate with AI
            assistants via MCP.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Link href="/handler/sign-up" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto min-h-[48px] md:min-h-[56px] text-base md:text-lg"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="text-center p-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <PackageIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Inventory Tracking
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Complete CRUD operations for your event items. Track quantity,
              location, and category with ease.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <Shield className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              Audit Logging
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              Track discrepancies, maintain audit trails, and keep detailed
              notes on every inventory check.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-xl">
                <Zap className="h-8 w-8 md:h-10 md:w-10 text-primary" />
              </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2">
              AI Integration
            </h3>
            <p className="text-sm md:text-base text-muted-foreground">
              MCP-ready APIs let you connect Claude or ChatGPT to query and
              manage inventory via AI assistants.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-12 md:py-16 border-t">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
            Join today and start managing your event inventory more efficiently.
          </p>
          <Link
            href="/handler/sign-up"
            className="inline-block w-full sm:w-auto"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto min-h-[48px] md:min-h-[56px] text-base md:text-lg"
            >
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm text-muted-foreground">
          <p>
            © 2025 EventForge Inventory. Built with Next.js, Fastify, and Neon.
          </p>
        </div>
      </footer>
    </div>
  );
}
