import { redirect } from "next/navigation";
import { getSessionUserFromCookies } from "@/lib/firebase/serverAuth";
import Link from "next/link";

export default async function DeadlinesPage() {
  const user = await getSessionUserFromCookies();
  if (!user) redirect("/login?from=/app/deadlines");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Deadlines</h1>
      <p className="text-text-muted">Track application and financial aid deadlines for the colleges on your list.</p>
      <div className="rounded-xl border border-bg-border bg-bg-card p-8 text-center">
        <p className="text-text-muted">No upcoming deadlines. Add colleges to your list to see their deadlines.</p>
        <Link href="/app/colleges" className="mt-4 inline-block text-primary-500 hover:underline">View College List →</Link>
      </div>
    </div>
  );
}
