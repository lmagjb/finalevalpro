"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-depedBg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        {/* header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-depedBlue rounded-2xl shadow-lg mb-4">
            <span className="text-white text-4xl font-extrabold">E</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            EvalPro
          </h1>
        </div>

        {/* login card design */}
        <div className="bg-white rounded-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] border border-gray-100 p-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Log in</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[60px] px-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none transition-all text-lg text-gray-900 placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-lg font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[60px] px-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-depedBlue/20 focus:border-depedBlue outline-none transition-all text-lg text-gray-900 placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="text-left -mt-2">
              <a
                href="#"
                className="text-lg font-semibold text-depedBlue hover:text-blue-800 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {error && (
              <p className="text-base font-semibold text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[60px] bg-depedBlue text-white text-xl font-extrabold rounded-xl hover:bg-blue-800 transition-colors shadow-md flex items-center justify-center mt-8 disabled:opacity-60"
            >
              {isSubmitting ? "Logging in…" : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-base text-gray-500">
            No account yet?{" "}
            <Link href="/register" className="font-semibold text-depedBlue hover:text-blue-800">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
