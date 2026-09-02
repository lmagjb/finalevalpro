import StaffNav from "@/components/StaffNav";
import StaffDashboard from "@/components/StaffDashboard";

export default function PrincipalDashboard() {
  return (
    <div className="bg-depedBg min-h-screen text-slate-800">
      <StaffNav subtitle="Classroom Observation" />
      <StaffDashboard
        config={{
          eyebrow: "Classroom observation",
          title: "Applications awaiting classroom observation",
          actionLabel: "Export school summary",
          statLabels: ["Total queue", "Pending review", "Endorsed", "Returned"],
          statEmptyHints: [
            "No entries yet",
            "No pending reviews",
            "No endorsed cases",
            "No remarks issued",
          ],
          gridRatio: "xl:grid-cols-[1.8fr_1.2fr]",
          queueTitle: "Applications pending first-level review",
          queueEmptyTitle: "No applications pending",
          queueEmptyBody:
            "Applications submitted by teachers will appear here for classroom observation and rating.",
          sideTitle: "Rate and endorse",
          sideSubtitle: "Rate COI/NCOI indicators and verify submitted MOVs.",
          checklistLabel: "Evaluation checklist will appear when records arrive",
          remarksLabel: "Observer remarks",
          remarksEmpty: "No remarks have been issued yet.",
          forwardLabel: "Endorse to AO II",
          returnLabel: "Return to Teacher",
          lowerGridRatio: "lg:grid-cols-[1.4fr_1fr]",
          lowerLeftTitle: "Observation ranking sheet",
          lowerLeftSubtitle: "Detailed below for observation-level review.",
          lowerLeftEmpty: "No observation ranking data available yet.",
          lowerRightTitle: "RFTP handling",
          lowerRightSubtitle: "Reclassification Form for Teacher Positions.",
          lowerRightEmpty: "No RFTP candidate pending review.",
          bottomSections: [
            {
              title: "Observation status report",
              empty: "No observation activity to report yet.",
            },
          ],
          showEvaluation: true,
        }}
      />
    </div>
  );
}
