import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useListMatchMessages,
  useSendMatchMessage,
  useListEmployerMatchMessages,
  useSendEmployerMatchMessage,
  useListEmployerCompanies,
  useUpdateQuickReplies,
  getListMatchMessagesQueryKey,
  getListEmployerMatchMessagesQueryKey,
  getListEmployerCompaniesQueryKey,
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

  const companiesQuery = useListEmployerCompanies({
    query: { enabled: open && side === "employer" },
  });
  const company = companiesQuery.data?.find((c) => c.id === companyId);
  const quickReplies = company?.quickReplies ?? [];
  const [manageOpen, setManageOpen] = useState(false);

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

        {side === "employer" && (
          <div className="border-t border-border/50 px-3 pt-2 pb-1 bg-background flex items-center gap-2 overflow-x-auto">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {quickReplies.length === 0 ? (
              <span className="text-xs text-muted-foreground flex-shrink-0">No quick replies yet</span>
            ) : (
              quickReplies.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDraft(q)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover-elevate text-foreground whitespace-nowrap flex-shrink-0 max-w-[180px] truncate"
                  title={q}
                  data-testid={`quick-reply-${i}`}
                >
                  {q}
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="ml-auto text-xs font-medium text-primary hover:underline whitespace-nowrap flex-shrink-0"
              data-testid="button-manage-quick-replies"
            >
              Manage
            </button>
          </div>
        )}

        <div className={`${side === "employer" ? "" : "border-t border-border/50"} p-3 bg-background flex items-end gap-2`}>
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
      {side === "employer" && companyId && (
        <ManageQuickRepliesDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          companyId={companyId}
          initial={quickReplies}
        />
      )}
    </Dialog>
  );
}

function ManageQuickRepliesDialog({
  open,
  onOpenChange,
  companyId,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  initial: string[];
}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) {
      setItems(initial);
      setDraft("");
    }
  }, [open, initial]);

  const save = useUpdateQuickReplies({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEmployerCompaniesQueryKey() });
        toast.success("Quick replies saved");
        onOpenChange(false);
      },
      onError: () => toast.error("Could not save"),
    },
  });

  const addItem = () => {
    const v = draft.trim();
    if (!v) return;
    setItems((prev) => [...prev, v].slice(0, 20));
    setDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col rounded-3xl">
        <DialogHeader>
          <DialogTitle>Quick replies</DialogTitle>
          <DialogDescription>
            Save canned messages your team uses often. Tap one in chat to drop it into the input.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No templates yet. Add one below.
            </div>
          )}
          {items.map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2 rounded-xl bg-muted/40 border border-border/50"
              data-testid={`template-${i}`}
            >
              <Textarea
                rows={2}
                value={q}
                onChange={(e) =>
                  setItems((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                }
                className="text-sm resize-none min-h-[40px]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-muted-foreground hover:text-destructive flex-shrink-0"
                data-testid={`button-delete-template-${i}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Input
              placeholder="Add a new quick reply…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              data-testid="input-new-template"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addItem}
              disabled={!draft.trim() || items.length >= 20}
              data-testid="button-add-template"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <DialogFooter className="flex-row sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const cleaned = items.map((s) => s.trim()).filter((s) => s.length > 0);
              save.mutate({ companyId, data: { quickReplies: cleaned } });
            }}
            disabled={save.isPending}
            data-testid="button-save-templates"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
