"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@stackframe/stack";
import { useCreateItem } from "@/hooks/useItems";
import { Navbar } from "@/components/Navbar";
import { ItemForm } from "@/components/ItemForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NewItemPage() {
  const user = useUser({ or: "redirect" });
  const router = useRouter();
  const createMutation = useCreateItem();

  if (!user) {
    redirect("/");
  }

  const handleSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
    router.push("/items");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/items">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Items
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
              <CardDescription>
                Create a new inventory item for your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemForm
                onSubmit={handleSubmit}
                isSubmitting={createMutation.isPending}
                submitLabel="Create Item"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
