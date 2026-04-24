import { AppLayout } from "@/components/AppLayout"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Database,
  Cpu,
  LogOut,
  Github,
  Globe,
  Terminal,
} from "lucide-react"

export default function Settings() {
  const { user, logout } = useAuth()

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and system preferences.</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar ?? ""} />
                <AvatarFallback className="text-lg">{user?.name?.[0] ?? "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-lg">{user?.name ?? "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
                <Badge variant="secondary" className="mt-1 capitalize">{user?.role ?? "user"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" /> System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Platform</p>
                <p className="font-medium">BRX AI System</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Version</p>
                <p className="font-medium">2.0.0-open-source</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Stack</p>
                <p className="font-medium">React + tRPC + Drizzle + MySQL</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">License</p>
                <p className="font-medium">MIT / Open Source</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Open Source Ecosystem */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="h-4 w-4" /> Integrated Open Source Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ollama</span>
                </div>
                <span className="text-muted-foreground">Local LLM inference</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">llama.cpp</span>
                </div>
                <span className="text-muted-foreground">C++ inference engine</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">vLLM</span>
                </div>
                <span className="text-muted-foreground">High-throughput serving</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">LangChain / LangGraph</span>
                </div>
                <span className="text-muted-foreground">Agent orchestration</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ChromaDB / Qdrant</span>
                </div>
                <span className="text-muted-foreground">Vector databases</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">MCP (Model Context Protocol)</span>
                </div>
                <span className="text-muted-foreground">Anthropic standard</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <Button variant="destructive" className="w-full gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
