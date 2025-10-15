"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@stackframe/stack";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/useApiKeys";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Key, Check } from "lucide-react";
import { redirect } from "next/navigation";
import { toast } from "sonner";

const apiKeyFormSchema = z.object({
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "Name must be less than 100 characters"),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

export default function SettingsPage() {
  const user = useUser({ or: "redirect" });
  const { data: apiKeysData, isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
    },
  });

  if (!user) {
    redirect("/");
  }

  const handleCreateKey = async (values: ApiKeyFormValues) => {
    const result = await createMutation.mutateAsync({ name: values.name });
    setNewKey(result.key || null);
    form.reset();
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCloseNewKeyDialog = () => {
    setNewKey(null);
    setDialogOpen(false);
    form.reset();
  };

  const handleDeleteKey = async () => {
    if (deleteKeyId) {
      await deleteMutation.mutateAsync(deleteKeyId);
      setDeleteKeyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          {/* User Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Display Name</Label>
                <p className="text-lg">{user.displayName || "Not set"}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-lg">{user.primaryEmail}</p>
              </div>
              <Button variant="outline" onClick={() => user.signOut()}>
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* API Keys Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for external access (AI assistants, MCP,
                    etc.)
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    {!newKey ? (
                      <>
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Generate a new API key for external access
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form
                            onSubmit={form.handleSubmit(handleCreateKey)}
                            className="space-y-4 py-4"
                          >
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Key Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Claude Desktop"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    A friendly name to identify this key
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setDialogOpen(false);
                                  form.reset();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={createMutation.isPending}
                              >
                                {createMutation.isPending
                                  ? "Creating..."
                                  : "Create Key"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </>
                    ) : (
                      <>
                        <DialogHeader>
                          <DialogTitle>API Key Created!</DialogTitle>
                          <DialogDescription>
                            Save this key securely. It will not be shown again.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Your API Key</Label>
                            <div className="flex gap-2">
                              <Input
                                value={newKey}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleCopyKey(newKey)}
                              >
                                {copiedKey ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-900">
                              <strong>Warning:</strong> This is the only time
                              you will see this key. Make sure to copy and save
                              it securely.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCloseNewKeyDialog}>
                            Done
                          </Button>
                        </DialogFooter>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading API keys...
                </p>
              ) : apiKeysData?.data && apiKeysData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeysData.data.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            {apiKey.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {apiKey.lastUsed
                            ? new Date(apiKey.lastUsed).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          {apiKey.isActive ? (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-50 text-gray-700"
                            >
                              Revoked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {apiKey.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteKeyId(apiKey.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No API keys yet. Create one to enable external access.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteKeyId}
        onOpenChange={() => setDeleteKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke this API key. Any applications using
              this key will lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className="bg-destructive text-destructive-foreground"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
