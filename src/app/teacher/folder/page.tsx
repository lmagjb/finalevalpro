import { redirect } from "next/navigation";

// MOVs are not a separate artefact: per DO 024 s.2025, NCOIs are assessed
// from the applicant's annotations on the MOVs in their PMES portfolio,
// via the Portfolio Annotations Form. MOV upload therefore lives with the
// NCOI evaluation rather than in a standalone folder.
export default function TeacherFolderRedirect() {
  redirect("/teacher/ncoi");
}
