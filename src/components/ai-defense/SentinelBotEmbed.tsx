import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, Sparkles, Shield, Search, BarChart3, Trash2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  { icon: Shield, text: "What are the latest critical threats?", label: "Critical Threats" },
  { icon: Search, text: "Analyze recent APT activity patterns", label: "APT Analysis" },
  { icon: BarChart3, text: "Give me threat statistics for today", label: "Statistics" },
  { icon: Sparkles, text: "What security recommendations do you have?", label: "Recommendations" },
];

interface SentinelBotEmbedProps {
  externalMessage?: string;
  onMessageProcessed?: () => void;
}

const SentinelBotEmbed = ({ externalMessage, onMessageProcessed }: SentinelBotEmbedProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m SentinelBot, your AI cybersecurity analyst. I have direct access to your threat intelligence database and can:\n\n🔍 Analyze threats in real-time\n📊 Generate statistics and insights\n🎯 Find attack patterns and correlations\n💡 Provide actionable recommendations\n\nHow can I help with your threat analysis today?'
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (externalMessage) {
      handleSend(externalMessage);
      onMessageProcessed?.();
    }
  }, [externalMessage]);

  const handleSend = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);
    setToolsUsed([]);

    try {
      const { data, error } = await supabase.functions.invoke('chat-with-sentinel', {
        body: {
          message: userMessage,
          conversationHistory: messages
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
      
      if (data.tools_used && data.tools_used.length > 0) {
        setToolsUsed(data.tools_used);
        setTimeout(() => setToolsUsed([]), 5000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error("Failed to get response from SentinelBot");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared. How can I help with your threat analysis?'
      }
    ]);
    setToolsUsed([]);
  };

  return (
    <Card className="glass border-border/50 h-[600px] flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-lg animate-pulse" />
              <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <span className="gradient-text">SentinelBot</span>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {toolsUsed.length > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 animate-pulse gap-1">
                <Zap className="h-3 w-3" />
                {toolsUsed.join(', ')}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-powered threat analysis with live database access
        </p>
      </CardHeader>

      <CardContent className="relative flex-1 flex flex-col p-0 overflow-hidden">
        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleSend(prompt.text)}
                disabled={isLoading}
                className="gap-1.5 text-xs bg-secondary/50 hover:bg-primary/10 hover:border-primary/50 transition-all"
              >
                <prompt.icon className="h-3 w-3 text-primary" />
                {prompt.label}
              </Button>
            ))}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-secondary/70 text-secondary-foreground border border-border/50'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">SentinelBot</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary/70 border border-border/50 rounded-2xl p-3 flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-pulse" />
                    <Loader2 className="relative h-4 w-4 animate-spin text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Analyzing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-secondary/30 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about threats, vulnerabilities, attack patterns..."
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-br from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentinelBotEmbed;
