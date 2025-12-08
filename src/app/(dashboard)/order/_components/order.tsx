"use client";

import DataTable from "@/components/common/data-table";
import DropdownAction from "@/components/common/dropdown-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { HEADER_TABLE_ORDER } from "@/constants/order-constants";
import useDataTable from "@/hooks/use-data-table";
import { createClientSupabase } from "@/lib/supabase/default";
import { cn } from "@/lib/utils";
import { Table } from "@/validations/table-validations";
import { useQuery } from "@tanstack/react-query";
import { Ban, Link2Icon, Package, ScrollText, Utensils } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { updateReservation } from "../action";
import { INITIAL_STATE_ACTION } from "@/constants/general-constant";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import DialogCreateOrderDineIn from "./dialog-create-order-dine-in";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import DialogCreateOrderTakeaway from "./dialog-create-orde-takeaway";

export default function OrderManagement() {
  const supabase = createClientSupabase();
  const {
    currentPage,
    currentLimit,
    currentSearch,
    handleChangePage,
    handleChangeLimit,
    handleChangeSearch,
  } = useDataTable();

  const profile = useAuthStore((state) => state.profile);

  const {
    data: orders,
    isLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orders", currentPage, currentLimit, currentSearch],
    queryFn: async () => {
      const query = supabase
        .from("orders")
        .select(
          `id, order_id,customer_name,status, payment_token, tables(name, id)`,
          { count: "exact" }
        )
        .range((currentPage - 1) * currentLimit, currentPage * currentLimit - 1)
        .order("created_at");

      if (currentSearch) {
        query.or(
          `order_id.ilike.%${currentSearch}%,customer_name.ilike.%${currentSearch}%`
        );
      }

      const result = await query;

      if (result.error)
        toast.error("Get Order data Failed", {
          description: result.error.message,
        });

      return result;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("change-order")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          refetchOrders();
          refetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const { data: tables, refetch: refetchTables } = useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const result = await supabase
        .from("tables")
        .select("*")
        .order("created_at")
        .order("status");

      return result.data;
    },
  });

  const totalPages = useMemo(() => {
    return orders && orders.count !== null
      ? Math.ceil(orders.count / currentLimit)
      : 0;
  }, [orders]);

  const [reservedState, reservedAction] = useActionState(
    updateReservation,
    INITIAL_STATE_ACTION
  );

  const handleReservation = async ({
    id,
    table_id,
    status,
  }: {
    id: string;
    table_id: string;
    status: string;
  }) => {
    const formData = new FormData();
    Object.entries({ id, table_id, status }).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startTransition(() => {
      reservedAction(formData);
    });
  };

  useEffect(() => {
    if (reservedState.status === "error") {
      toast.error("Update reserved Field", {
        description: reservedState.errors?._form?.[0],
      });
    }

    if (reservedState.status === "success") {
      toast.success("Update reserved Success");
      refetchOrders();
    }
  }, [reservedState]);

  const reservedActionList = [
    {
      label: (
        <span className="flex items-center gap-2">
          <Link2Icon />
          Process
        </span>
      ),
      action: (id: string, table_id: string) => {
        handleReservation({ id, table_id, status: "process" });
      },
    },
    {
      label: (
        <span className="flex items-center gap-2">
          <Ban />
          Cancel
        </span>
      ),
      action: (id: string, table_id: string) => {
        handleReservation({ id, table_id, status: "canceled" });
      },
    },
  ];

  const filteredData = useMemo(() => {
    return (orders?.data || []).map((order, index) => {
      return [
        currentLimit * (currentPage - 1) + index + 1,
        order.order_id,
        order.customer_name,
        (order.tables as unknown as { name: string })?.name || "Takeaway",
        <div
          className={cn("px-2 py 2 rounded-full text-white w-fit capitalize", {
            "bg-lime-600": order.status === "settled",
            "bg-sky-600": order.status === "process",
            "bg-amber-600": order.status === "reserved",
            "bg-red-600": order.status === "canceled",
          })}
        >
          {order.status}
        </div>,
        <DropdownAction
          menu={
            order.status === "reserved" && profile.role !== "kitchen"
              ? reservedActionList.map((item) => ({
                  label: item.label,
                  action: () =>
                    item.action(
                      order.id,
                      (order.tables as unknown as { id: string })?.id
                    ),
                }))
              : [
                  {
                    label: (
                      <Link
                        href={`/order/${order.order_id}`}
                        className="flex items-center gap-2"
                      >
                        <ScrollText />
                        Detail
                      </Link>
                    ),
                    type: "link",
                  },
                ]
          }
        />,
      ];
    });
  }, [orders]);

  const [openCreatedOrder, setOpenCreatedOrder] = useState(false);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row mb-4 gap-2 justify-between">
        <p className="text-2xl font-bold">Order Management</p>
        <div className="flex gap-2">
          <Input
            placeholder="Search..."
            onChange={(e) => handleChangeSearch(e.target.value)}
          />
          {profile.role !== "kitchen" && (
            <DropdownMenu
              open={openCreatedOrder}
              onOpenChange={setOpenCreatedOrder}
            >
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Create</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="font-bold">
                  Create Order
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Dialog>
                  <DialogTrigger className="flex items-center gap-2 text-sm p-2 w-full hover:bg-muted rounded-md">
                    <Utensils className="size-4" />
                    Dine In
                  </DialogTrigger>
                  <DialogCreateOrderDineIn
                    tables={tables}
                    closeDialog={() => setOpenCreatedOrder(false)}
                  />
                </Dialog>
                <Dialog>
                  <DialogTrigger className="flex items-center gap-2 text-sm p-2 w-full hover:bg-muted rounded-md">
                    <Package className="size-4" />
                    Takeaway
                  </DialogTrigger>
                  <DialogCreateOrderTakeaway
                    closeDialog={() => setOpenCreatedOrder(false)}
                  />
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <DataTable
        header={HEADER_TABLE_ORDER}
        data={filteredData}
        isLoading={isLoading}
        totalPages={totalPages}
        currentPage={currentPage}
        currentLimit={currentLimit}
        onChangePage={handleChangePage}
        onChangeLimit={handleChangeLimit}
      />
    </div>
  );
}
