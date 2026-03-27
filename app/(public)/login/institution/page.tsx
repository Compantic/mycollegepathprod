"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

export default function InstitutionLoginPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-4">
      <div className="rounded-2xl border border-bg-border bg-white p-8 max-w-sm text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 mb-4">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-text-primary">College Log In</h1>
        <p className="mt-2 text-sm text-text-muted">Institution login is coming soon.</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-primary-500 hover:underline">
          ← Back to Student Sign In
        </Link>
      </div>
    </div>
  );
}
