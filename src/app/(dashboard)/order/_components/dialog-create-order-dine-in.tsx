import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Table } from "@/validations/table-validations";
import { OrderForm, orderFormSchema } from "@/validations/order-validation";
import {
  INITIAL_ORDER,
  INITIAL_STATE_ORDER,
  STATUS_CREATE_ORDER,
} from "@/constants/order-constants";
import { createOrder } from "../action";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import FormInput from "@/components/common/form-input";
import FormSelect from "@/components/common/form-select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DialogCreateOrderDineIn({
  tables,
  closeDialog,
}: {
  tables: Table[] | undefined | null;
  closeDialog: () => void;
}) {
  const form = useForm<OrderForm>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: INITIAL_ORDER,
  });

  const [createOrderState, createOrderAction, isPandingCreateOrder] =
    useActionState(createOrder, INITIAL_STATE_ORDER);

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      createOrderAction(formData);
    });
  });

  useEffect(() => {
    if (createOrderState.status === "error") {
      toast.error("Create Order Field", {
        description: createOrderState.errors?._form?.[0],
      });
    }

    if (createOrderState.status === "success") {
      toast.success("Create Order Success");
      form.reset();
      closeDialog();
    }
  }, [createOrderState]);

  return (
    <DialogContent className="sm:max-w-[425px]">
      <Form {...form}>
        <DialogHeader>
          <DialogTitle>Create Order Dine In</DialogTitle>
          <DialogDescription>Add a new order from customer</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-4 max-h-[48vh] p-1 overflow-y-auto">
            <FormInput
              form={form}
              name="customer_name"
              label="Customer Name"
              placeholder="Insert customer name here"
            />

            <FormSelect
              form={form}
              name={"table_id"}
              label="Table"
              selectItem={(tables ?? []).map((table: Table) => ({
                value: `${table.id}`,
                label: `${table.name} - ${table.status} (${table.capacity})`,
                disabled: table.status !== "available",
              }))}
            />

            <FormSelect
              form={form}
              name={"status"}
              label="Status"
              selectItem={STATUS_CREATE_ORDER}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              {isPandingCreateOrder ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
