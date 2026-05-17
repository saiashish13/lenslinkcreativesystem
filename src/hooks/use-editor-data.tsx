import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type EditorStatus = "open" | "in_progress" | "in_review" | "delivered" | "cancelled";
export type FileKind = "source" | "draft" | "revision" | "delivery";

export type Assignment = {
  id: string;
  booking_id: string | null;
  creator_user_id: string;
  editor_user_id: string | null;
  title: string;
  brief: string | null;
  category: string | null;
  deadline: string | null;
  status: EditorStatus;
  budget_inr: number | null;
  created_at: string;
};

export type ProjectFile = {
  id: string;
  assignment_id: string;
  version: number;
  kind: FileKind;
  file_url: string;
  note: string | null;
  uploaded_by: string;
  created_at: string;
};

export type Revision = {
  id: string;
  assignment_id: string;
  author_id: string;
  message: string;
  resolved: boolean;
  created_at: string;
};

export function useEditorAssignments() {
  const { user } = useAuth();
  const [openPool, setOpenPool] = useState<Assignment[]>([]);
  const [mine, setMine] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setOpenPool([]); setMine([]); setLoading(false); return; }
    const [pool, claimed] = await Promise.all([
      supabase.from("editor_assignments").select("*").is("editor_user_id", null).eq("status", "open").order("created_at", { ascending: false }),
      supabase.from("editor_assignments").select("*").eq("editor_user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setOpenPool((pool.data ?? []) as Assignment[]);
    setMine((claimed.data ?? []) as Assignment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { openPool, mine, loading, refresh };
}

export function useCreatorAssignments() {
  const { user } = useAuth();
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("editor_assignments")
      .select("*")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data ?? []) as Assignment[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, refresh };
}

export function useAssignmentDetail(assignmentId: string | null) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!assignmentId) { setFiles([]); setRevisions([]); return; }
    setLoading(true);
    const [f, r] = await Promise.all([
      supabase.from("project_files").select("*").eq("assignment_id", assignmentId).order("created_at", { ascending: false }),
      supabase.from("project_revisions").select("*").eq("assignment_id", assignmentId).order("created_at", { ascending: false }),
    ]);
    setFiles((f.data ?? []) as ProjectFile[]);
    setRevisions((r.data ?? []) as Revision[]);
    setLoading(false);
  }, [assignmentId]);

  useEffect(() => { refresh(); }, [refresh]);
  return { files, revisions, loading, refresh };
}
