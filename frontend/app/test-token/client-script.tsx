"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Terminal, AlertCircle } from "lucide-react";

export function TokenExtractor() {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allCookies, setAllCookies] = useState<string[]>([]);

  useEffect(() => {
    // Get all cookies
    const cookies = document.cookie.split(";").map(c => c.trim());
    setAllCookies(cookies);

    // Try multiple patterns to find the token
    const patterns = [
      /stack-.*-access-token=/,
      /stack.*access.*token=/i,
      /.+-access-token=/,
    ];

    let foundToken: string | null = null;

    for (const pattern of patterns) {
      const tokenCookie = cookies.find((c) => pattern.test(c));
      if (tokenCookie) {
        const cookieValue = tokenCookie.split("=")[1];
        if (cookieValue && cookieValue.length > 20) {
          foundToken = decodeURIComponent(cookieValue);
          break;
        }
      }
    }

    setToken(foundToken);
  }, []);

  const copyToClipboard = (text: string, type: "token" | "command") => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const extractTokenFromConsole = () => {
    const script = `
// Copy this entire block and paste it in the browser console
const cookies = document.cookie.split(';');
console.log('All cookies:', cookies);

const tokenCookie = cookies.find(c => c.trim().match(/stack-.*-access-token=/));
if (tokenCookie) {
  const token = decodeURIComponent(tokenCookie.split('=')[1]);
  console.log('\\n=== YOUR TOKEN ===\\n');
  console.log(token);
  console.log('\\n=== COPY THIS COMMAND ===\\n');
  console.log(\`npx tsx test-api.ts \${token}\`);
  navigator.clipboard.writeText(\`npx tsx test-api.ts \${token}\`);
  console.log('\\n✓ Command copied to clipboard!\\n');
} else {
  console.log('No token cookie found. Cookies:', cookies);
}`;
    
    navigator.clipboard.writeText(script);
    alert("Script copied! Open DevTools Console (F12), paste and press Enter.");
  };

  return (
    <div className="space-y-6">
      {/* Token Display */}
      <Card>
        <CardHeader>
          <CardTitle>Your Authentication Token</CardTitle>
          <CardDescription>
            Use this token to test authenticated API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {token ? (
            <>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs break-all whitespace-pre-wrap max-h-32">
                  {token}
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(token, "token")}
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
                    onClick={() => copyToClipboard(`npx tsx test-api.ts ${token}`, "command")}
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
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Token not accessible via JavaScript
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      The Stack Auth cookie might be marked as httpOnly. Use the console method below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Alternative Method: Browser Console</p>
                <Button onClick={extractTokenFromConsole} className="w-full">
                  <Terminal className="h-4 w-4 mr-2" />
                  Copy Console Script
                </Button>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>After clicking the button above:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Press F12 to open DevTools</li>
                    <li>Go to the Console tab</li>
                    <li>Paste (Ctrl/Cmd+V) and press Enter</li>
                    <li>The command will be copied to your clipboard</li>
                    <li>Paste it in your terminal</li>
                  </ol>
                </div>
              </div>

              {/* Debug info */}
              {allCookies.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Debug: View all cookies ({allCookies.length})
                  </summary>
                  <div className="mt-2 bg-muted p-2 rounded text-xs space-y-1">
                    {allCookies.map((cookie, i) => (
                      <div key={i} className="font-mono break-all">
                        {cookie.substring(0, 100)}
                        {cookie.length > 100 ? "..." : ""}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
