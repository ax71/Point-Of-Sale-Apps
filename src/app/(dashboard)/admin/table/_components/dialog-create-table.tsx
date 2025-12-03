import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createTable } from "../action";
import { toast } from "sonner";
import { Preview } from "@/types/general";
import { TableForm, tableFormSchema } from "@/validations/table-validations";
import { INITIAL_STATE_TABLE, INITIAL_TABLE } from "@/constants/table-constant";
import FormTable from "./form-table";

export default function DialogCreateTable({
  refetch,
}: {
  refetch: () => void;
}) {
  const form = useForm<TableForm>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: INITIAL_TABLE,
  });

  const [createTableState, createTableAction, isPandingCreateTable] =
    useActionState(createTable, INITIAL_STATE_TABLE);

  const [preview, setPreview] = useState<Preview | undefined>(undefined);

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      createTableAction(formData);
    });
  });

  useEffect(() => {
    if (createTableState.status === "error") {
      toast.error("Create Table Field", {
        description: createTableState.errors?._form?.[0],
      });
    }

    if (createTableState.status === "success") {
      toast.success("Create Table Success");
      form.reset();
      document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
      refetch();
    }
  }, [createTableState]);

  return (
    <FormTable
      form={form}
      onSubmit={onSubmit}
      isLoading={isPandingCreateTable}
      type="Create"
    />
  );
}
