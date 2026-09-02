import StaffNav from "@/components/StaffNav";
import StaffDashboard from "@/components/StaffDashboard";

export default function PSDSDashboard() {
  return (
    <div className="bg-depedBg min-h-screen text-slate-800">
      <StaffNav subtitle="PSDS Dashboard" />
      <StaffDashboard
        config={{
          eyebrow: "District overview",
          title: "All schools and principals under the district",
          actionLabel: "Export district summary",
          statLabels: ["Schools", "Pending validation", "Ready for HR", "Returned"],
          statEmptyHints: [
            "No entries yet",
            "No district review yet",
            "No endorsed cases",
            "No remarks issued",
          ],
          gridRatio: "xl:grid-cols-[1.8fr_1.2fr]",
          queueTitle: "Applications pending district validation",
          queueEmptyTitle: "No applications pending",
          queueEmptyBody:
            "District validation records will appear here once AO II submissions start flowing in.",
          sideTitle: "Validate or contest evaluation",
          sideSubtitle: "Review principal evaluation and issue remarks.",
          checklistLabel: "Validation checklist will appear when records arrive",
          remarksLabel: "District remarks",
          remarksEmpty: "No remarks have been issued yet.",
          forwardLabel: "Endorse to HR",
          returnLabel: "Return to Observer",
          lowerGridRatio: "lg:grid-cols-[1.4fr_1fr]",
          lowerLeftTitle: "District grading / ranking sheet",
          lowerLeftSubtitle: "Detailed below for district-level review.",
          lowerLeftEmpty: "No district ranking data available yet.",
          lowerRightTitle: "RFSPP handling",
          lowerRightSubtitle: "For principal-level candidate review.",
          lowerRightEmpty:
            "RFSPP review queue will appear here when a principal-level application is submitted.",
          bottomSections: [
            {
              title: "District-level status report",
              empty: "No district activity to report yet.",
            },
          ],
        }}
      />
    </div>
  );
}
