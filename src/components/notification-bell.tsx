import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/use-messaging";

export function NotificationBell() {
  const { data } = useNotifications();
  const mark = useMarkNotificationsRead();
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  return (
    <DropdownMenu onOpenChange={(o) => { if (o && unread > 0) mark.mutate(); }}>
      <DropdownMenuTrigger asChild>
        <button className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border border-border hover:bg-card transition" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 max-h-96 overflow-y-auto">
        <div className="px-3 py-2 border-b border-border text-sm font-medium">Notifications</div>
        {(!data || data.length === 0) ? (
          <div className="p-4 text-sm text-muted-foreground">You're all caught up.</div>
        ) : (
          <ul>
            {data.map((n) => (
              <li key={n.id} className={`px-3 py-2 border-b border-border/50 ${n.read_at ? "" : "bg-muted/40"}`}>
                <Link to={n.link ?? "/app"} className="block">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("en-IN")}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}