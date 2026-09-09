import data from "@/data/seed/org-brain.seed.json";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/modules/work/columns";
import { WorkItem } from "@/types/org-brain";

export default function WorkComponent() {
  const { workItems } = data;

  return (
    <div className={"p-4 w-full h-full flex justify-center items-center"}>
      <DataTable data={workItems as WorkItem[]} columns={columns} />
    </div>
  );
}
