"use client";

import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Zap, BookOpen } from "lucide-react";

export default function ApiDocsPage() {
  // Dynamically determine API URL based on current host
  const getApiUrl = () => {
    if (typeof window !== "undefined") {
      const currentHost = window.location.hostname;
      return `http://${currentHost}:3001`;
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  };

  const apiUrl = getApiUrl();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
          <p className="text-muted-foreground">
            Complete API reference and MCP integration guide
          </p>
        </div>

        <Tabs defaultValue="swagger" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="swagger">
              <BookOpen className="h-4 w-4 mr-2" />
              OpenAPI
            </TabsTrigger>
            <TabsTrigger value="mcp">
              <Zap className="h-4 w-4 mr-2" />
              MCP Guide
            </TabsTrigger>
            <TabsTrigger value="examples">
              <Code2 className="h-4 w-4 mr-2" />
              Examples
            </TabsTrigger>
          </TabsList>

          {/* OpenAPI/Swagger Tab */}
          <TabsContent value="swagger" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>REST API Documentation</CardTitle>
                <CardDescription>
                  Interactive API documentation powered by OpenAPI/Swagger
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={`${apiUrl}/docs`}
                    className="w-full h-[800px]"
                    title="API Documentation"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MCP Guide Tab */}
          <TabsContent value="mcp" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Context Protocol (MCP)</CardTitle>
                <CardDescription>
                  Connect AI assistants like Claude Desktop to your inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Start</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Generate an API key in{" "}
                      <a href="/settings" className="text-primary underline">
                        Settings
                      </a>
                    </li>
                    <li>Open Claude Desktop</li>
                    <li>Go to Settings → Add Custom Connector</li>
                    <li>
                      Enter:
                      <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                        <li>
                          <strong>Name:</strong> EventForge Inventory
                        </li>
                        <li>
                          <strong>Remote MCP server URL:</strong>{" "}
                          <code className="bg-muted px-1 py-0.5 rounded">
                            {apiUrl}/mcp
                          </code>
                        </li>
                        <li>
                          <strong>Header Name:</strong> x-api-key
                        </li>
                        <li>
                          <strong>API Key:</strong> [Your generated key]
                        </li>
                      </ul>
                    </li>
                    <li>Click &quot;Add&quot; and test with a query!</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Available Tools
                  </h3>
                  <div className="space-y-3">
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">list_inventory_items</h4>
                      <p className="text-sm text-muted-foreground">
                        Get a list of inventory items with optional filters
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">get_item_details</h4>
                      <p className="text-sm text-muted-foreground">
                        Get detailed information about a specific item
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">create_audit_log</h4>
                      <p className="text-sm text-muted-foreground">
                        Create an audit log entry for an inventory item
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">get_inventory_stats</h4>
                      <p className="text-sm text-muted-foreground">
                        Get inventory and audit statistics
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-4">
                      <h4 className="font-semibold">search_items_by_name</h4>
                      <p className="text-sm text-muted-foreground">
                        Search for items by name (fuzzy match)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Example Queries
                  </h3>
                  <div className="space-y-2 text-sm bg-muted p-4 rounded-lg">
                    <p>
                      &quot;Show me all furniture items in my inventory&quot;
                    </p>
                    <p>&quot;What are my current inventory statistics?&quot;</p>
                    <p>
                      &quot;Create an audit log for the folding chairs&quot;
                    </p>
                    <p>&quot;Search for items in Warehouse A&quot;</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Examples</CardTitle>
                <CardDescription>
                  Common API usage examples with curl
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">List Items</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -X GET "${apiUrl}/api/v1/items?page=1&limit=20" \\
  -H "Content-Type: application/json"`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Create Item (Auth Required)
                  </h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -X POST "${apiUrl}/api/v1/items" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "name": "Folding Chair",
    "category": "FURNITURE",
    "quantity": 50,
    "location": "Warehouse A",
    "description": "Standard metal folding chairs"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Create Audit (Auth Required)
                  </h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -X POST "${apiUrl}/api/v1/audits" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "itemId": "item-uuid-here",
    "expectedQuantity": 50,
    "actualQuantity": 48,
    "notes": "2 chairs missing"
  }'`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">MCP Request (API Key)</h3>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`curl -X POST "${apiUrl}/mcp" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_inventory_items",
      "arguments": {
        "category": "FURNITURE",
        "limit": 10
      }
    }
  }'`}</code>
                  </pre>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Authentication
                  </h4>
                  <p className="text-sm text-blue-800">
                    <strong>Web Users:</strong> Use JWT token in{" "}
                    <code>Authorization: Bearer TOKEN</code> header
                    <br />
                    <strong>AI/MCP Access:</strong> Use API key in{" "}
                    <code>x-api-key: KEY</code> header
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
