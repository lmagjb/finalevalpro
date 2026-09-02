"use client";

import { useEffect, useState } from "react";

interface ReviewDoc {
  id: number;
  domain: number | null;
  indicator_type: "COI" | "NCOI";
  file_name: string;
  status: "pending" | "verified" | "rejected";
  remarks: string | null;
  uploaded_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function DocumentReviewPanel({ applicationId }: { applicationId: number }) {
  const [documents, setDocuments] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/staff/applications/${applicationId}/documents`);
    const data = await res.json();
    setDocuments(data.documents ?? []);
    setLoading(false);
  }

  async function review(docId: number, status: "verified" | "rejected") {
    setBusyId(docId);
    await fetch(`/api/staff/documents/${docId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    load();
  }

  if (loading) {
    return <p className="text-sm text-textMuted py-3">Loading documents…</p>;
  }

  if (documents.length === 0) {
    return <p className="text-sm text-textMuted py-3">No documents uploaded yet.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded bg-gray-100 text-gray-600">
              {doc.indicator_type}
            </span>
            <span className="text-xs text-gray-400">Domain {doc.domain ?? "—"}</span>
            <a
              href={`/api/documents/${doc.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-gray-800 hover:text-depedBlue"
            >
              {doc.file_name}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${STATUS_STYLES[doc.status]}`}>
              {doc.status}
            </span>
            {doc.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => review(doc.id, "verified")}
                  disabled={busyId === doc.id}
                  className="text-xs font-semibold text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-50 disabled:opacity-60"
                >
                  Verify
                </button>
                <button
                  onClick={() => review(doc.id, "rejected")}
                  disabled={busyId === doc.id}
                  className="text-xs font-semibold text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
