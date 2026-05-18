import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMessages, useSendMessage } from "@/hooks/use-messaging";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ChatPanel({ bookingId, title }: { bookingId: string; title?: string }) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(bookingId);
  const send = useSendMessage(bookingId);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    send.mutate(text, { onSuccess: () => setText("") });
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 flex flex-col h-[420px]">
      {title && <div className="px-4 py-3 border-b border-border text-sm font-medium">{title}</div>}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : messages?.length === 0 ? (
          <div className="text-sm text-muted-foreground">No messages yet. Say hello 👋</div>
        ) : (
          messages?.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {m.body}
                  <div className={`text-[10px] mt-1 opacity-70`}>
                    {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={submit} className="p-3 border-t border-border flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" size="icon" disabled={send.isPending || !text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}