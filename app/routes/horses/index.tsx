import { type ActionArgs, type DataFunctionArgs, Form, json, useActionData , useLoaderData } from "~/remix.ts";
import { prisma } from "~/utils/db.server.ts";
import { requireAdmin } from "~/utils/permissions.server.ts";
import { DataTable } from "~/components/ui/data_table.tsx";
import { columns } from "./columns.tsx";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog.tsx";
import { Button } from "~/components/ui/button.tsx";
import { useState } from "react";
import { Label } from "~/components/ui/label.tsx";
import { Input } from "~/components/ui/input.tsx";
import { Textarea } from "~/components/ui/textarea.tsx";
import { parse } from '@conform-to/zod'
import { useResetCallback } from "~/lib/utils.ts"
import { useToast } from "~/components/ui/use-toast.ts";
import { Plus } from "lucide-react";

const horseFormSchema = z.object({
  name: z.string(),
  notes: z.string(),
  status: z.string(),
})

export const loader = async ({ request }: DataFunctionArgs) => {
  await requireAdmin(request)
  return json(
    await prisma.horse.findMany()
  );
};

export default function Horses() {
  const data = useLoaderData<typeof loader>()
  return ( 
  <div className="container">
    <h1 className="text-5xl text-center">Horses</h1>
    <CreateHorseDialog />
    <div className="pt-2 max-h-[80vh] overflow-scroll">
      <DataTable columns={columns} data={data}/>
    </div>
  </div>
  )
}

export const action = async({ request }: ActionArgs) => {
  await requireAdmin(request)
  const formData = await request.formData();
  const submission = parse(formData, { schema: horseFormSchema })
  if (!submission.value) {
    return json(
      { status: 'error',
        submission,
      } as const,
      { status: 400},
    )
  }

  await prisma.horse.create({
    data: {
      name: submission.value.name,
      notes: submission.value.notes,
      status: submission.value.status,
    }
  })

  return json(
  {
    status: 'ok',
    submission,
  },
  { status: 200},
  )
}

function CreateHorseDialog() {
  const [open, setOpen] = useState(false)
  const actionData = useActionData<typeof action>()
  const { toast } = useToast();
  useResetCallback(actionData, () => {
      if (!actionData) {
        return
      }
      if (actionData.status == "ok") {
        toast({
          title: "Success",
          description: `Created horse "${actionData.submission?.value?.name}".`
        })
        setOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error creating horse",
          description: "Failed to create horse. There was an unexpected error."
        })
      }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-5">
          <Plus size="20"/>Register new horse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
        <DialogTitle>Register new horse</DialogTitle>
        <DialogDescription>
          Fill out this form to add a new horse to the database.
        </DialogDescription>
        </DialogHeader>
        <Form method="post">
          <Label htmlFor="name">Name</Label>
          <Input type="text" name="name" required></Input>

          <Label htmlFor="status">Status</Label>
          <Input type="textarea" name="status"></Input>

          <Label htmlFor="notes">Notes</Label>
          <Textarea name="notes" />
        <DialogFooter className="mt-4">
          <Button type="submit">
            Save
          </Button>
        </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
