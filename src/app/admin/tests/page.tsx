import { TestBuilder } from "@/components/admin/TestBuilder";

export default function AdminTests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">Tests and questions</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-600">
          Create a test, upload its questions from a spreadsheet, and publish it for students.
        </p>
      </div>
      <TestBuilder />
    </div>
  );
}
