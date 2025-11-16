"use client";

import { useEffect, useState } from "react";
import GradientButton from "@/components/ui/GradientButton";
import { ShieldAlert, CheckCircle, XCircle, Ban } from "lucide-react";
import type { UserReportUI } from "@/types/userReport";

export default function UserReportsTab() {
  const [reports, setReports] = useState<UserReportUI[]>([]);

  async function load() {
    const res = await fetch("/api/admin/reports");
    const data = await res.json();
    setReports(data);
  }

  async function takeAction(id: string, action: string) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> User Reports
      </h1>

      {reports.length === 0 ? (
        <p className="text-gray-500">No user reports 🎉</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="p-4 border rounded-xl bg-white shadow-sm space-y-2"
            >
              <div className="text-sm">
                <strong>Reporter:</strong> {r.reporter.name} ({r.reporter.email})
              </div>

              <div className="text-sm">
                <strong>Reported User:</strong>{" "}
                {r.reportedUser.name} ({r.reportedUser.email})
              </div>

              <div className="text-sm">
                <strong>Reason:</strong> {r.reason}
              </div>

              {r.listingId && (
                <div className="text-xs text-gray-600">
                  Listing: {r.listingId.title}
                </div>
              )}

              {r.threadId && (
                <div className="text-xs text-gray-600">
                  Thread ID: {r.threadId._id}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <GradientButton
                  label="Resolve"
                  variant="muted"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => takeAction(r._id, "resolve")}
                />

                <GradientButton
                  label="Reject"
                  variant="danger"
                  icon={<XCircle className="w-4 h-4" />}
                  onClick={() => takeAction(r._id, "reject")}
                />

                <GradientButton
                  label="Ban User"
                  variant="danger"
                  icon={<Ban className="w-4 h-4" />}
                  onClick={() => takeAction(r._id, "ban")}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
