import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, FileUp, Loader2, MessageSquare, Sparkles, Upload, X } from "lucide-react";
import { DashShell } from "@/components/dash-shell";
import { useAuth } from "@/hooks/use-auth";
import {
  useEditorAssignments,
  useAssignmentDetail,
  type Assignment,
  type EditorStatus,
  type FileKind,
} from "@/hooks/use-editor-data";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/editor")({
  head: () => ({ meta: [{ title: "Editor workspace — LensLink AI" }] }),
  component: EditorDash,
});

const STATUS_STYLES: Record<EditorStatus, string> = {
  open: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_review: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

function EditorDash() {
  const { user } = useAuth();
  const [active, setActive] = useState<Assignment | null>(null);

  return (
    <DashShell
      title="Editor workspace"
      subtitle={`Signed in${user?.email ? ` as ${user.email}` : ""}. Claim work, deliver versions, resolve revisions.`}
    >
      {active ? (
        <ProjectDetail assignment={active} onBack={() => setActive(null)} />
      ) : (
        <Tabs defaultValue="mine">
          <TabsList className="grid grid-cols-2 w-full md:w-auto bg-card/60">
            <TabsTrigger value="mine">My projects</TabsTrigger>
            <TabsTrigger value="pool">Open pool</TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-6"><MyProjects onOpen={setActive} /></TabsContent>
          <TabsContent value="pool" className="mt-6"><OpenPool /></TabsContent>
        </Tabs>
      )}
    </DashShell>
  );
}

function MyProjects({ onOpen }: { onOpen: (a: Assignment) => void }) {
  const { mine, loading } = useEditorAssignments();
  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (mine.length === 0) return <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">No claimed projects yet. Browse the open pool to find work.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {mine.map((a) => (
        <button key={a.id} onClick={() => onOpen(a)} className="text-left rounded-xl border border-border bg-card/60 p-5 hover:border-primary/50 transition">
          <div className="flex items-start justify-between gap-3">
            <div className="font-medium">{a.title}</div>
            <span className={`text-xs rounded-full border px-2 py-0.5 ${STATUS_STYLES[a.status]}`}>{a.status.replace("_", " ")}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{a.category ?? "—"} · {a.deadline ? `Due ${a.deadline}` : "No deadline"} {a.budget_inr ? `· ${formatINR(a.budget_inr)}` : ""}</div>
          {a.brief && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{a.brief}</p>}
        </button>
      ))}
    </div>
  );
}

function OpenPool() {
  const { user } = useAuth();
  const { openPool, loading, refresh } = useEditorAssignments();
  const [claiming, setClaiming] = useState<string | null>(null);
  const claim = async (id: string) => {
    if (!user) return;
    setClaiming(id);
    const { error } = await supabase
      .from("editor_assignments")
      .update({ editor_user_id: user.id, status: "in_progress" })
      .eq("id", id);
    setClaiming(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Project claimed");
    refresh();
  };
  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (openPool.length === 0) return <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">No open projects right now. Check back soon.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {openPool.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-card/60 p-5">
          <div className="font-medium">{a.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{a.category ?? "—"} · {a.deadline ? `Due ${a.deadline}` : "No deadline"} {a.budget_inr ? `· ${formatINR(a.budget_inr)}` : ""}</div>
          {a.brief && <p className="text-sm text-muted-foreground mt-3 line-clamp-4">{a.brief}</p>}
          <button onClick={() => claim(a.id)} disabled={claiming === a.id} className="mt-4 inline-flex items-center gap-2 rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-1.5 text-sm font-medium disabled:opacity-50">
            {claiming === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Claim project
          </button>
        </div>
      ))}
    </div>
  );
}

function ProjectDetail({ assignment, onBack }: { assignment: Assignment; onBack: () => void }) {
  const { user } = useAuth();
  const { files, revisions, loading, refresh } = useAssignmentDetail(assignment.id);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<FileKind>("draft");
  const [message, setMessage] = useState("");

  const nextVersion = (files[0]?.version ?? 0) + 1;

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${assignment.id}/v${nextVersion}-${Date.now()}-${file.name}`;
    const up = await supabase.storage.from("deliverables").upload(path, file);
    if (up.error) { toast.error(up.error.message); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("deliverables").createSignedUrl(path, 60 * 60 * 24 * 7);
    const url = signed?.signedUrl ?? path;
    const { error } = await supabase.from("project_files").insert({
      assignment_id: assignment.id,
      version: nextVersion,
      kind,
      file_url: url,
      note: note.trim() || null,
      uploaded_by: user.id,
    });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`v${nextVersion} uploaded`);
    setNote("");
    refresh();
  };

  const setStatus = async (status: EditorStatus) => {
    const { error } = await supabase.from("editor_assignments").update({ status }).eq("id", assignment.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked ${status.replace("_", " ")}`);
    assignment.status = status;
  };

  const addRevision = async () => {
    if (!user || !message.trim()) return;
    const { error } = await supabase.from("project_revisions").insert({
      assignment_id: assignment.id,
      author_id: user.id,
      message: message.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setMessage("");
    refresh();
  };

  const resolve = async (id: string, resolved: boolean) => {
    const { error } = await supabase.from("project_revisions").update({ resolved }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back to projects</button>
        <span className={`text-xs rounded-full border px-2 py-0.5 ${STATUS_STYLES[assignment.status]}`}>{assignment.status.replace("_", " ")}</span>
      </div>

      <div className="rounded-xl border border-border bg-card/60 p-6">
        <h2 className="font-display text-2xl">{assignment.title}</h2>
        <div className="text-sm text-muted-foreground mt-1">
          {assignment.category ?? "—"} · {assignment.deadline ? `Due ${assignment.deadline}` : "No deadline"} {assignment.budget_inr ? `· ${formatINR(assignment.budget_inr)}` : ""}
        </div>
        {assignment.brief && <p className="text-sm mt-4 whitespace-pre-wrap">{assignment.brief}</p>}
        <div className="flex flex-wrap gap-2 mt-5">
          <button onClick={() => setStatus("in_progress")} className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-card">Mark in progress</button>
          <button onClick={() => setStatus("in_review")} className="text-xs rounded-md border border-border px-3 py-1.5 hover:bg-card">Send for review</button>
          <button onClick={() => setStatus("delivered")} className="text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 inline-flex items-center gap-1">
            <Check className="h-3 w-3" /> Deliver
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card/60 p-6">
          <div className="flex items-center gap-2 font-medium"><FileUp className="h-4 w-4" /> Upload v{nextVersion}</div>
          <div className="mt-3 space-y-3">
            <select value={kind} onChange={(e) => setKind(e.target.value as FileKind)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="revision">Revision</option>
              <option value="delivery">Final delivery</option>
              <option value="source">Source files</option>
            </select>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Version note (optional)" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm cursor-pointer hover:border-primary/50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading…" : "Choose a file"}
              <input type="file" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </label>
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-3">Version history</div>
            {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : files.length === 0 ? (
              <div className="text-sm text-muted-foreground">No files yet.</div>
            ) : (
              <ul className="space-y-2">
                {files.map((f) => (
                  <li key={f.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">v{f.version} · <span className="text-xs uppercase tracking-wide text-muted-foreground">{f.kind}</span></div>
                      <a href={f.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open</a>
                    </div>
                    {f.note && <div className="text-xs text-muted-foreground mt-1">{f.note}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString("en-IN")}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/60 p-6">
          <div className="flex items-center gap-2 font-medium"><MessageSquare className="h-4 w-4" /> Revisions & notes</div>
          <div className="mt-3 flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Add a note or request a change…" className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <button onClick={addRevision} disabled={!message.trim()} className="rounded-md bg-[image:var(--gradient-gold)] text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-50">Post</button>
          </div>
          <ul className="mt-4 space-y-2">
            {revisions.length === 0 ? (
              <li className="text-sm text-muted-foreground">No revisions yet.</li>
            ) : revisions.map((r) => (
              <li key={r.id} className={`rounded-md border p-3 text-sm ${r.resolved ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={r.resolved ? "line-through text-muted-foreground" : ""}>{r.message}</p>
                  <button onClick={() => resolve(r.id, !r.resolved)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    {r.resolved ? <><X className="h-3 w-3" /> Reopen</> : <><Check className="h-3 w-3" /> Resolve</>}
                  </button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString("en-IN")}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
