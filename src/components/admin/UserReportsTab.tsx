"use client";

import { useEffect, useState } from "react";
import GradientButton from "@/components/ui/GradientButton";
import { ShieldAlert, CheckCircle, XCircle, Ban } from "lucide-react";
import type { UserReportUI } from "@/types/userReport";

export default function UserReportsTab() {
  const [reports, setReports] = useState<UserReportUI[]>([]);

  async function load() {
    const res = await fetch("/api/admin/reports");
    const data: UserReportUI[] = await res.json();
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

  function StatusBadge({ status }: { status: string }) {
    const base =
      "px-2 py-0.5 rounded-full text-xs font-semibold capitalize inline-block";

    if (status === "pending")
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>
          Pending
        </span>
      );

    if (status === "resolved")
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          Resolved
        </span>
      );

    if (status === "rejected")
      return (
        <span className={`${base} bg-red-100 text-red-700`}>
          Rejected
        </span>
      );

    return <span className={base}>{status}</span>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="text-red-500" /> User Reports
      </h1>

      {reports.length === 0 ? (
        <p className="text-gray-500">No reports 🎉</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="p-4 border rounded-xl bg-white shadow-sm space-y-2"
            >
              {/* Status row */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm">
                  <strong>Status:</strong> <StatusBadge status={report.status} />
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Reporter */}
              <div className="text-sm">
                <strong>Reporter:</strong>{" "}
                {report.reporter?.name || "Unknown"} (
                {report.reporter?.email || "No email"})
              </div>

              {/* Reported User */}
              <div className="text-sm">
                <strong>Reported User:</strong>{" "}
                {report.reportedUser?.name || "Unknown"} (
                {report.reportedUser?.email || "No email"})
              </div>

              {/* Reason */}
              <div className="text-sm">
                <strong>Reason:</strong> {report.reason || "N/A"}
              </div>

              {/* Related context */}
              {report.listingId && (
                <div className="text-sm">
                  <strong>Listing ID:</strong> {report.listingId._id}
                </div>
              )}
              {report.threadId && (
                <div className="text-sm">
                  <strong>Thread ID:</strong> {report.threadId._id}
                </div>
              )}

              {/* ACTIONS */}
              {report.status === "pending" ? (
                <div className="flex gap-2 pt-2">
                  <GradientButton
                    label="Resolve"
                    variant="muted"
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => takeAction(report._id, "resolve")}
                  />

                  <GradientButton
                    label="Reject"
                    variant="danger"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => takeAction(report._id, "reject")}
                  />

                  <GradientButton
                    label="Ban User"
                    variant="danger"
                    icon={<Ban className="w-4 h-4" />}
                    onClick={() => takeAction(report._id, "ban")}
                  />
                </div>
              ) : (
                <p className="pt-2 text-xs text-gray-500 italic">
                  This report has already been processed.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
