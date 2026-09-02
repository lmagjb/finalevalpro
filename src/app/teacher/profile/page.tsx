"use client";

import { useEffect, useState } from "react";
import TeacherNav from "@/components/TeacherNav";

interface Profile {
  full_name: string;
  email: string;
  employee_number: string | null;
  school: string | null;
  division: string | null;
  contact_number: string | null;
  sex: "male" | "female" | null;
  birth_date: string | null;
  salary_grade: number | null;
  school_level: string | null;
  current_position: string | null;
  years_of_service: number;
}

const TABS = [
  { key: "profile", label: "Profile Information" },
  { key: "security", label: "Account & Security" },
] as const;

export default function TeacherProfilePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [school, setSchool] = useState("");
  const [division, setDivision] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [salaryGrade, setSalaryGrade] = useState("");
  const [schoolLevel, setSchoolLevel] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile);
        setSchool(data.profile?.school ?? "");
        setDivision(data.profile?.division ?? "");
        setEmail(data.profile?.email ?? "");
        setContactNumber(data.profile?.contact_number ?? "");
        setSex(data.profile?.sex ?? "");
        setBirthDate(data.profile?.birth_date ? data.profile.birth_date.slice(0, 10) : "");
        setSalaryGrade(data.profile?.salary_grade ? String(data.profile.salary_grade) : "");
        setSchoolLevel(data.profile?.school_level ?? "");
        setLoading(false);
      });
  }, []);

  const initials = (profile?.full_name ?? "--")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "--";

  async function saveProfile() {
    setSaving(true);
    setSaveMessage(null);
    await fetch("/api/teacher/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ school, division, email, contactNumber, sex: sex || undefined, birthDate: birthDate || undefined, salaryGrade: salaryGrade || undefined, schoolLevel: schoolLevel || undefined }),
    });
    setSaving(false);
    setSaveMessage("Saved.");
  }

  async function changePassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordSaving(true);
    const res = await fetch("/api/teacher/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPasswordSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPasswordError(data.error ?? "Could not change password.");
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="bg-depedBg min-h-screen flex flex-col">
      <TeacherNav subtitle="Teacher Dashboard" backHref="/teacher/dashboard" />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-10 py-10">
        <header className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900">Profile &amp; Account Settings</h2>
          <p className="text-xl text-textMuted font-semibold mt-2">
            Manage your personal information and account security.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-4 space-y-2 sticky top-10">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full text-left px-5 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-3 border ${
                    tab === t.key
                      ? "bg-depedBlue/5 text-depedBlue border-depedBlue/20"
                      : "text-gray-700 hover:bg-gray-50 border-transparent"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {loading && <p className="text-textMuted text-sm">Loading…</p>}

            {!loading && tab === "profile" && profile && (
              <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h3>

                <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="w-24 h-24 rounded-full bg-depedBlue flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
                    {initials}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{profile.full_name}</p>
                    <p className="text-sm text-textMuted mt-1">{profile.current_position ?? "Position not set"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      value={profile.full_name}
                      readOnly
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Position</label>
                    <input
                      value={profile.current_position ?? "Not set"}
                      readOnly
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Years of Service</label>
                    <input
                      value={profile.years_of_service}
                      readOnly
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">School</label>
                    <input
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Division</label>
                    <input
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Contact Number</label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Sex</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as "male" | "female" | "")}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 bg-white focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Salary Grade</label>
                    <input
                      type="number"
                      min={1}
                      max={33}
                      value={salaryGrade}
                      onChange={(e) => setSalaryGrade(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Level</label>
                    <select
                      value={schoolLevel}
                      onChange={(e) => setSchoolLevel(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 bg-white focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    >
                      <option value="">Not set</option>
                      <option value="Elementary">Elementary</option>
                      <option value="Junior High School">Junior High School</option>
                      <option value="Senior High School">Senior High School</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                    {saveMessage && <span className="text-sm font-semibold text-green-600">{saveMessage}</span>}
                    <button
                      onClick={saveProfile}
                      disabled={saving}
                      className="bg-depedBlue text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors shadow-md disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && tab === "security" && (
              <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h3>
                <div className="grid grid-cols-1 gap-6 max-w-lg">
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                    <p className="text-sm text-textMuted mt-1">At least 8 characters.</p>
                  </div>
                  <div>
                    <label className="block text-lg font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-[60px] px-5 border border-gray-300 rounded-xl text-lg text-gray-900 focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none"
                    />
                  </div>

                  {passwordError && <p className="text-sm font-semibold text-red-600">{passwordError}</p>}
                  {passwordSuccess && <p className="text-sm font-semibold text-green-600">Password updated.</p>}

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                      onClick={changePassword}
                      disabled={passwordSaving}
                      className="bg-depedBlue text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors shadow-md disabled:opacity-60"
                    >
                      {passwordSaving ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
