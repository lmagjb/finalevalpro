import StaffNav from "@/components/StaffNav";
import StaffDashboard from "@/components/StaffDashboard";

export default function HRAOIVDashboard() {
  return (
    <div className="bg-depedBg min-h-screen text-slate-800">
      <StaffNav subtitle="HR - AO IV Dashboard" />
      <StaffDashboard
        config={{
          eyebrow: "HR Processing Queue",
          title: "Applications pending HR processing (division-wide)",
          actionLabel: "Export processing report",
          statLabels: [
            "Pending processing",
            "QS verification",
            "Ready for HRMPSB",
            "Deficiency remarks",
          ],
          statEmptyHints: [
            "No entries yet",
            "No QS checks pending",
            "No packets compiled",
            "No remarks issued",
          ],
          gridRatio: "xl:grid-cols-[1.8fr_1.2fr]",
          queueTitle: "Applications pending HR processing",
          queueEmptyTitle: "No applications pending",
          queueEmptyBody:
            "Applications validated by PSDS will appear here for HR qualification-standards processing.",
          sideTitle: "Qualification Standards (QS) verification checklist",
          sideSubtitle: "Verify Education, Training, Experience, and Eligibility.",
          checklistLabel: "QS checklist will appear when records arrive",
          remarksLabel: "Deficiency remarks",
          remarksEmpty: "No deficiency remarks issued yet.",
          forwardLabel: "Forward to HRMPSB",
          returnLabel: "Return with remarks",
          lowerGridRatio: "lg:grid-cols-[1.4fr_1fr]",
          lowerLeftTitle: "Personal Data Sheet (PDS) cross-check",
          lowerLeftSubtitle: "Cross-reference declared records against the PDS.",
          lowerLeftEmpty: "No PDS records available for cross-check yet.",
          lowerRightTitle: "Compile application packet for HRMPSB review",
          lowerRightSubtitle: "Bundle verified records for board deliberation.",
          lowerRightEmpty: "No applicant selected for packet compilation.",
          bottomSections: [
            {
              title: "Forward to HRMPSB or return with deficiency remarks",
              subtitle: "Final decision point: endorse to HRMPSB or return for corrections.",
              empty: "No applicant selected for decision.",
              variant: "decision",
            },
            {
              title: "Division-wide promotion tracking report",
              empty: "No division-wide processing activity to report yet.",
            },
          ],
        }}
      />
    </div>
  );
}
