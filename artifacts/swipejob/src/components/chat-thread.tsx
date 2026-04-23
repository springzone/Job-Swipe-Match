import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useListMatchMessages,
  useSendMatchMessage,
  useListEmployerMatchMessages,
  useSendEmployerMatchMessage,
  getListMatchMessagesQueryKey,
  getListEmployerMatchMessagesQueryKey,
  type Message,
} from "@workspace/api-client-react";

type Side = "candidate" | "employer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  side: Side;
  companyId?: string;
  title: string;
  subtitle?: string;
};

export function ChatThread({
  open,
  onOpenChange,
  matchId,
  side,
  companyId,
  title,
  subtitle,
}: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const candidateQuery = useListMatchMessages(matchId, {
    query: { enabled: open && side === "candidate", refetchInterval: open ? 4000 : false },
  });
  const employerQuery = useListEmployerMatchMessages(companyId ?? "", matchId, {
    query: {
      enabled: open && side === "employer" && !!companyId,
      refetchInterval: open ? 4000 : false,
    },
  });
  const data: Message[] | undefined = side === "candidate" ? candidateQuery.data : employerQuery.data;
  const isLoading = side === "candidate" ? candidateQuery.isLoading : employerQuery.isLoading;

  const invalidate = () => {
    if (side === "candidate") {
      queryClient.invalidateQueries({ queryKey: getListMatchMessagesQueryKey(matchId) });
    } else if (companyId) {
      queryClient.invalidateQueries({
        queryKey: getListEmployerMatchMessagesQueryKey(companyId, matchId),
      });
    }
  };

  const candidateSend = useSendMatchMessage({
    mutation: { onSuccess: () => { setDraft(""); invalidate(); } },
  });
  const employerSend = useSendEmployerMatchMessage({
    mutation: { onSuccess: () => { setDraft(""); invalidate(); } },
  });
  const sending = candidateSend.isPending || employerSend.isPending;

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current?.querySelector<HTMLDivElement>("[data-radix-scroll-area-viewport]");
    if (el) el.scrollTop = el.scrollHeight;
  }, [data, open]);

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    const onError = () => toast.error("Could not send message", { description: "Please try again." });
    if (side === "candidate") {
      candidateSend.mutate({ matchId, data: { body } }, { onError });
    } else if (companyId) {
      employerSend.mutate({ companyId, matchId, data: { body } }, { onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl gap-0">
        <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/30">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>

        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3 min-h-[280px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-muted-foreground">
              <div className="text-sm font-medium mb-1">Say hi 👋</div>
              <div className="text-xs">
                Messages here are private between you and{" "}
                {side === "candidate" ? "the employer" : "the candidate"}.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.map((m) => {
                const mine = m.sender === side;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${m.id}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug whitespace-pre-wrap break-words ${
                        mine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <div>{m.body}</div>
                      <div
                        className={`text-[10px] mt-1 ${
                          mine ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/50 p-3 bg-background flex items-end gap-2">
          <Textarea
            rows={1}
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className="resize-none min-h-[40px] max-h-32"
            data-testid="input-message"
          />
          <Button
            onClick={submit}
            disabled={!draft.trim() || sending}
            size="icon"
            className="rounded-full flex-shrink-0"
            data-testid="button-send-message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
