import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageSquare,
  Send,
  Plus,
  Trash2,
  Archive,
  Bot,
  User,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useParams } from "react-router"

export default function Chat() {
  const { id } = useParams()
  const { data: models } = trpc.ai.modelList.useQuery()
  const { data: conversations, refetch } = trpc.ai.conversationList.useQuery({ archived: false })
  const createConv = trpc.ai.createConversation.useMutation({ onSuccess: () => refetch() })
  const deleteConv = trpc.ai.deleteConversation.useMutation({ onSuccess: () => refetch() })
  const archiveConv = trpc.ai.updateConversation.useMutation({ onSuccess: () => refetch() })
  const sendMsg = trpc.ai.sendMessage.useMutation()
  const generate = trpc.ai.generate.useMutation()

  const [activeConvId, setActiveConvId] = useState<number | null>(id ? parseInt(id) : null)
  const [input, setInput] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations?.find((c) => c.id === activeConvId)

  useEffect(() => {
    if (id) setActiveConvId(parseInt(id))
  }, [id])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [localMessages])

  const handleNewChat = async () => {
    if (!selectedModel) return
    const result = await createConv.mutateAsync({
      title: "New Conversation",
      modelId: selectedModel,
      systemPrompt: systemPrompt || undefined,
    })
    if (result && Array.isArray(result) && result[0]?.id) {
      setActiveConvId(result[0].id)
      setLocalMessages([])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConvId) return
    const userContent = input.trim()
    setInput("")
    setLocalMessages((prev) => [...prev, { role: "user", content: userContent }])

    await sendMsg.mutateAsync({
      conversationId: activeConvId,
      content: userContent,
      role: "user",
    })

    setIsGenerating(true)
    try {
      const result = await generate.mutateAsync({
        type: "text",
        prompt: userContent,
        modelId: activeConv?.modelId ?? selectedModel,
      })
      setLocalMessages((prev) => [...prev, { role: "assistant", content: result.result }])
      await sendMsg.mutateAsync({
        conversationId: activeConvId,
        content: result.result,
        role: "assistant",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-7rem)] flex gap-4">
        {/* Sidebar */}
        <Card className="w-64 hidden md:flex flex-col">
          <div className="p-4 border-b space-y-3">
            <Button className="w-full gap-2" onClick={handleNewChat} disabled={!selectedModel || createConv.isPending}>
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.modelId} value={m.modelId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm ${
                    activeConvId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setActiveConvId(conv.id)
                    setLocalMessages([])
                  }}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <div className="hidden group-hover:flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        archiveConv.mutate({ id: conv.id, isArchived: true })
                      }}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConv.mutate({ id: conv.id })
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col">
          {activeConv ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{activeConv.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    Model: {models?.find((m) => m.modelId === activeConv.modelId)?.name ?? activeConv.modelId}
                  </p>
                </div>
                <Badge variant="outline">{activeConv.modelId}</Badge>
              </div>

              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {localMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary animate-spin" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground">
                        Generating response...
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    className="min-h-[60px] resize-none"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                  <Button
                    className="shrink-0"
                    disabled={!input.trim() || isGenerating}
                    onClick={handleSend}
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Select or start a conversation</p>
              <div className="flex gap-2">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Choose a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {models?.map((m) => (
                      <SelectItem key={m.modelId} value={m.modelId}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleNewChat} disabled={!selectedModel || createConv.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
              <Textarea
                placeholder="System prompt (optional)..."
                className="w-[400px] min-h-[80px]"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
