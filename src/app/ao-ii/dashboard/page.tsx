import StaffNav from "@/components/StaffNav";
import StaffDashboard from "@/components/StaffDashboard";

export default function AOIIDashboard() {
  return (
    <div className="bg-depedBg min-h-screen text-slate-800">
      <StaffNav subtitle="AO II Dashboard" />
      <StaffDashboard
        config={{
          eyebrow: "Incoming applications queue",
          title: "Division-wide promotion applications",
          actionLabel: "+ Add new application",
          statLabels: ["Total queue", "Pending review", "For PSDS", "Returned"],
          statEmptyHints: ["No entries yet", "No pending reviews", "No forwarded cases", "No remarks issued"],
          gridRatio: "xl:grid-cols-[1.7fr_1fr]",
          queueTitle: "Application queue",
          queueEmptyTitle: "No applications in queue",
          queueEmptyBody:
            "Applications endorsed after classroom observation will appear here for division-level intake.",
          sideTitle: "Document completeness check",
          sideSubtitle: "Checklist-style validation, not scoring.",
          checklistLabel: "Awaiting application entry",
          checklistLabel2: "Checklist will appear once records are submitted",
          remarksLabel: "Validation notes",
          remarksEmpty: "No document review has started yet.",
          forwardLabel: "Forward to PSDS",
          returnLabel: "Return with remarks",
          asideExtra: {
            title: "Encode / log application",
            rows: [
              { label: "Division record no.", fallback: "Not assigned" },
              { label: "Routing status", fallback: "Ready for intake" },
            ],
          },
          lowerGridRatio: "lg:grid-cols-[1.2fr_1fr]",
          lowerLeftTitle: "Audit trail",
          lowerLeftEmpty: "No activity has been logged yet.",
          lowerRightTitle: "Basic status report",
          lowerRightEmpty: "No school activity to report yet.",
          bottomSections: [],
        }}
      />
    </div>
  );
}
