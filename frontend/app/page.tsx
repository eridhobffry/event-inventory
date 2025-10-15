"use client";

import { useUser } from "@stackframe/stack";
import { SignIn } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import { PackageIcon, Zap, Shield, Layers } from "lucide-react";
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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <PackageIcon className="h-6 w-6" />
            EventForge Inventory
          </div>
          <Link href="/handler/sign-in">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Event Inventory Management{" "}
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Streamline your event inventory tracking with AI-ready
            infrastructure. Track items, manage audits, and integrate with AI
            assistants via MCP.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/handler/sign-up">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/api-docs">
              <Button size="lg" variant="outline">
                View API Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 border-t">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <PackageIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Inventory Tracking</h3>
            <p className="text-muted-foreground">
              Complete CRUD operations for your event items. Track quantity,
              location, and category with ease.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">Audit Logging</h3>
            <p className="text-muted-foreground">
              Track discrepancies, maintain audit trails, and keep detailed
              notes on every inventory check.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Integration</h3>
            <p className="text-muted-foreground">
              MCP-ready APIs let you connect Claude or ChatGPT to query and
              manage inventory via AI assistants.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8">
            Join today and start managing your event inventory more efficiently.
          </p>
          <Link href="/handler/sign-up">
            <Button size="lg">Create Your Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2025 EventForge Inventory. Built with Next.js, Fastify, and Neon.
          </p>
        </div>
      </footer>
    </div>
  );
}
