"use client";

import { useUser } from "@stackframe/stack";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Copy,
  Terminal,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function TestTokenPage() {
  const user = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      setLoading(true);
      if (typeof window === "undefined") {
        setLoading(false);
        return null;
      }

      // Try multiple methods to get the token
      try {
        // Method 1: Try to get from stack-access cookie (JSON array format)
        const cookies = document.cookie.split(";");
        const accessCookie = cookies.find((c) => c.trim().startsWith("stack-access="));
        
        if (accessCookie) {
          try {
            const cookieValue = accessCookie.split("=")[1];
            const decoded = decodeURIComponent(cookieValue);
            const tokenArray = JSON.parse(decoded);
            // Access token is the second element in the array
            if (tokenArray && tokenArray[1]) {
              setToken(tokenArray[1]);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error("Error parsing stack-access cookie:", parseError);
          }
        }

        // Method 2: Try old pattern (for backwards compatibility)
        const patterns = [
          /stack-.*-access-token=/,
          /stack.*access.*token=/i,
        ];

        for (const pattern of patterns) {
          const tokenCookie = cookies.find((c) => pattern.test(c.trim()));
          if (tokenCookie) {
            const cookieValue = tokenCookie.split("=")[1];
            if (cookieValue && cookieValue.length > 20) {
              const decodedToken = decodeURIComponent(cookieValue);
              setToken(decodedToken);
              setLoading(false);
              return;
            }
          }
        }

        // Method 2: Try localStorage
        const localStorageKeys = Object.keys(localStorage);
        const tokenKey = localStorageKeys.find(
          (key) => key.includes("stack") && key.includes("token")
        );
        if (tokenKey) {
          const storedToken = localStorage.getItem(tokenKey);
          if (storedToken) {
            setToken(storedToken);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error getting token:", error);
        setError("Error getting token");
      }

      setLoading(false);
      setToken(null);
    };

    getToken();
  }, [user]);

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyCommand = () => {
    if (token) {
      const command = `npx tsx test-api.ts ${token}`;
      navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const extractViaConsole = () => {
    const script = `// Paste this in the Console (F12 > Console tab)
const cookies = document.cookie.split(';');
const tokenCookie = cookies.find(c => c.trim().startsWith('stack-access='));
if (tokenCookie) {
  const cookieValue = tokenCookie.split('=')[1];
  const decoded = decodeURIComponent(cookieValue);
  const tokenArray = JSON.parse(decoded);
  const token = tokenArray[1]; // Access token is second element
  console.log('✓ Token found:', token.substring(0, 50) + '...');
  const cmd = \`npx tsx test-api.ts \${token}\`;
  console.log('Test command:', cmd);
  navigator.clipboard.writeText(cmd);
  console.log('\\n✓ Command copied to clipboard!');
  alert('✅ Command copied!\\nPaste in terminal and press Enter.');
} else {
  console.log('❌ stack-access cookie not found');
  console.log('Available cookies:', cookies);
}`;
    
    navigator.clipboard.writeText(script);
    alert("✓ Console script copied!\n\n1. Press F12 to open DevTools\n2. Go to Console tab\n3. Paste and press Enter");
  };

  if (!user) {
    return (
      <div className="container mx-auto p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access your API token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to be logged in to view your authentication token.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">API Testing Helper</h1>
        <p className="text-muted-foreground">
          Get your authentication token to test the API endpoints
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Logged in as</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Email:</span>{" "}
              {user.primaryEmail || "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">User ID:</span> {user.id}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Token Display */}
      <Card>
        <CardHeader>
          <CardTitle>Your Authentication Token</CardTitle>
          <CardDescription>
            Use this token to test authenticated API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading token...</span>
            </div>
          ) : token ? (
            <>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs break-all whitespace-pre-wrap max-h-32">
                  {token}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={copyToken}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Token
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Test Command:</p>
                <div className="relative">
                  <pre className="bg-secondary/50 p-4 rounded-lg overflow-x-auto text-xs">
                    npx tsx test-api.ts {token.substring(0, 30)}...
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={copyCommand}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Terminal className="h-4 w-4 mr-2" />
                        Copy Command
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {error ||
                        "No token found. Try refreshing the page or logging out and back in."}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      The cookie might be httpOnly. Use the console method
                      below.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">
                  Alternative: Extract via Browser Console
                </p>
                <Button onClick={extractViaConsole} className="w-full">
                  <Terminal className="h-4 w-4 mr-2" />
                  Copy Console Script
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will copy a script. Press F12, go to Console, paste and
                  press Enter.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Step 1: Copy the Command</h3>
            <p className="text-sm text-muted-foreground">
              Click the &quot;Copy Command&quot; button above to copy the full
              test command to your clipboard.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Step 2: Run in Terminal</h3>
            <p className="text-sm text-muted-foreground">
              Open your terminal in the project root directory and paste the
              command:
            </p>
            <pre className="bg-muted p-3 rounded-lg text-xs mt-2">
              cd /Users/eridhobufferyrollian/Documents/Project/event-inventory
              <br />
              npx tsx test-api.ts [your-token]
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Step 3: Review Results</h3>
            <p className="text-sm text-muted-foreground">
              The test suite will run all authenticated endpoint tests and show
              you the results in the terminal.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Manual API Testing</CardTitle>
          <CardDescription>Test endpoints manually with curl</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Example: Get Your Events</h3>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {`curl -X GET "http://localhost:3001/api/v1/events" \\
  -H "Authorization: Bearer ${
    token ? token.substring(0, 30) + "..." : "[your-token]"
  }" \\
  -H "Content-Type: application/json"`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Example: Create Event</h3>
            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
              {`curl -X POST "http://localhost:3001/api/v1/events" \\
  -H "Authorization: Bearer ${
    token ? token.substring(0, 30) + "..." : "[your-token]"
  }" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My Test Event",
    "description": "Testing the API",
    "location": "Test Location"
  }'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-600 hover:underline"
          >
            📚 API Documentation (Swagger)
          </a>
          <a
            href="/api-docs"
            className="block text-sm text-blue-600 hover:underline"
          >
            📖 API Reference
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
