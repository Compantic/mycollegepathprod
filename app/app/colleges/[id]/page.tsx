import { CollegeDetail } from "@/components/colleges/CollegeDetail";

export default async function CollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return (
      <div className="rounded-card border border-bg-border bg-bg-card p-8 text-center text-text-secondary">
        Invalid college ID.
      </div>
    );
  }
  return <CollegeDetail collegeId={id} basePath="/app/colleges" />;
}
