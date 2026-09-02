"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "teacher" | "principal" | "ao_ii" | "psds" | "hr_ao_iv" | "admin_officer";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "principal", label: "Principal" },
  { value: "ao_ii", label: "AO II" },
  { value: "psds", label: "PSDS" },
  { value: "hr_ao_iv", label: "HR - AO IV" },
  { value: "admin_officer", label: "AO (Evaluation)" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("teacher");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Registration failed.");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      router.push("/login");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-depedBg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-depedBlue rounded-2xl shadow-lg mb-4">
            <span className="text-white text-4xl font-extrabold">E</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            EvalPro
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 p-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create an account
          </h2>
          <p className="text-base text-gray-500 mb-8">
            Register with your DepEd role to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-[60px] px-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none transition-all text-lg text-gray-900"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[60px] px-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none transition-all text-lg text-gray-900"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[60px] px-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none transition-all text-lg text-gray-900"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`rounded-xl border px-3 py-3 text-base font-semibold transition ${
                      role === opt.value
                        ? "border-depedBlue bg-depedBlue/5 text-depedBlue"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-base font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[60px] bg-depedBlue text-white text-xl font-extrabold rounded-xl hover:bg-blue-800 transition-colors shadow-md flex items-center justify-center mt-4 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-depedBlue hover:text-blue-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
