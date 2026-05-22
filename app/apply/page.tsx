import type { Metadata } from "next";
import Link from "next/link";
import { ApplicationForm } from "@/components/vendor/ApplicationForm";

export const metadata: Metadata = {
  title: "Vendor Application",
  description: "Apply to be a vendor at Magic City Plant-A-Palooza.",
};

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-sage-50 dark:bg-sage-950">
      <div className="mx-auto max-w-prose-narrow px-4 py-12 sm:px-6">
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:text-sage-900 dark:text-sage-300 dark:hover:text-cream-50"
          >
            Back to home
          </Link>
          <h1 className="font-display text-3xl font-semibold text-sage-900 dark:text-cream-50">
            Become a Vendor
          </h1>
          <p className="mt-2 text-muted dark:text-sage-300">
            Tell us about your business. Applications are reviewed within 2 weeks.
            You will receive an email when a decision is made.
          </p>
        </header>
        <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8 dark:bg-sage-900 dark:border-sage-700">
          <ApplicationForm />
        </div>
      </div>
    </div>
  );
}
