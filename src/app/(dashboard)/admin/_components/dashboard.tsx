"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LineCharts from "@/components/common/line-chart";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const supabase = createClient();

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 6);
  lastWeek.setHours(0, 0, 0, 0);

  useEffect(() => {
    const start = new Date();
    const end = new Date();
    start.setDate(start.getDate() - 6);

    setDateRange({
      start: start.toLocaleDateString(),
      end: end.toLocaleDateString(),
    });
  }, []);

  const {
    data: orders,
    isLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orders-per-day"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("created_at")
        .gte("created_at", lastWeek.toISOString())
        .order("created_at");

      const counts: Record<string, number> = {};

      (data ?? []).forEach((order) => {
        const date = new Date(order.created_at).toISOString().slice(0, 10);
        counts[date] = (counts[date] || 0) + 1;
      });
      return Object.entries(counts).map(([name, total]) => ({
        name,
        total,
      }));
    },
  });
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row mb-4 gap-2 justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Orders create per week</CardTitle>
          <CardDescription>
            {dateRange.start && dateRange.end
              ? `Showing order from ${dateRange.start} to ${dateRange.end}`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <div className="w-full h-64 p-6">
          <LineCharts data={orders} />
        </div>
      </Card>
    </div>
  );
}
