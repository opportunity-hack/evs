import { LoaderArgs, json } from "~/remix.ts";
import { useLoaderData } from "~/remix.ts";
import { prisma } from "~/utils/db.server.ts";
import { requireAdmin } from "~/utils/permissions.server.ts";
import { DataTable } from "~/components/ui/data_table.tsx";
import { columns } from "./columns.tsx";

export const loader = async ({ request }: LoaderArgs) => {
  requireAdmin(request)
  return json(
    await prisma.user.findMany()
  );
};

export default function users() {
 const data = useLoaderData<typeof loader>()
 return ( 
  <div>
    <h1 className="text-5xl text-center">Users</h1>
    <div className="container pt-10 max-h-[80vh] overflow-scroll">
      <DataTable columns={columns} data={data}/>
    </div>
  </div>
  )
}
