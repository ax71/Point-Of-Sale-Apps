"use client";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LineCharts from "@/components/common/line-chart";
import { useEffect, useState } from "react";
import { convertIDR } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  const { data: orders } = useQuery({
    queryKey: ["orders-per-day"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("created_at")
        .eq("status", "settled")
        .gte("created_at", lastWeek.toISOString())
        .order("created_at");

      const counts: Record<string, number> = {};

      (data ?? []).forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString("en-CA");
        counts[date] = (counts[date] || 0) + 1;
      });
      return Object.entries(counts).map(([name, total]) => ({
        name,
        total,
      }));
    },
  });

  const thisMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const lastMonth = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const { data: revenue } = useQuery({
    queryKey: ["revenue"],
    queryFn: async () => {
      const { data: dataThisMonth } = await supabase
        .from("orders_menus")
        .select("nominal, created_at")
        .gte("created_at", thisMonth);

      const { data: dataLastMonth } = await supabase
        .from("orders_menus")
        .select("nominal, created_at")
        .gte("created_at", lastMonth)
        .lt("created_at", thisMonth);

      const totalRevenueThisMonth = (dataThisMonth ?? []).reduce(
        (sum, item) => {
          return sum + item.nominal;
        },
        0
      );

      const totalRevenueLastMonth = (dataLastMonth ?? []).reduce(
        (sum, item) => {
          return sum + item.nominal;
        },
        0
      );

      const growthRate = (
        ((totalRevenueThisMonth - totalRevenueLastMonth) /
          totalRevenueLastMonth) *
        100
      ).toFixed(2);

      const daysInData = new Set(
        (dataThisMonth ?? []).map((item) =>
          new Date(item.created_at).toISOString().slice(0, 10)
        )
      ).size;

      const AverageRevenueThisMonth =
        daysInData > 0 ? totalRevenueThisMonth / daysInData : 0;

      return {
        totalRevenueThisMonth,
        totalRevenueLastMonth,
        growthRate,
        AverageRevenueThisMonth,
      };
    },
  });

  const { data: totalOrder } = useQuery({
    queryKey: ["total-order"],
    queryFn: async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact" })
        .eq("status", "settled")
        .gte("created_at", thisMonth);

      return count;
    },
  });

  const { data: lastOrder } = useQuery({
    queryKey: ["last-order"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_id, customer_name, status, tables(name, id)")
        .eq("status", "process")
        .limit(5)
        .order("created_at", { ascending: false });

      return data;
    },
  });
  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row mb-4 gap-2 justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {convertIDR(revenue?.totalRevenueThisMonth ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <div className="text-muted-foreground text-sm">
              <p>*Revenue this month</p>
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avarage Revenue</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {convertIDR(revenue?.AverageRevenueThisMonth ?? 0)}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <div className="text-muted-foreground text-sm">
              <p>*Avarage per day</p>
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Order</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {totalOrder ?? 0}
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <div className="text-muted-foreground text-sm">
              <p>*Order settled this month</p>
            </div>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Growth rate</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {revenue?.growthRate ?? 0}%
            </CardTitle>
          </CardHeader>
          <CardFooter>
            <div className="text-muted-foreground text-sm">
              <p>*Compared to last month</p>
            </div>
          </CardFooter>
        </Card>
      </div>
      <div className=" flex flex-col lg:flex-row gap-4">
        <Card className="w-full lg:w-2/3">
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
        <Card className="w-full lg:w-1/3">
          <CardHeader>
            <CardTitle>Active Order</CardTitle>
            <CardDescription>Showing last 5 active orders</CardDescription>
          </CardHeader>
          <div className="px-6">
            {lastOrder ? (
              lastOrder.map((order) => (
                <div
                  key={order?.id}
                  className="flex items-center  justify-between mb-4"
                >
                  <div>
                    <h3 className="font-semibold">{order?.customer_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Table:{" "}
                      {(order?.tables as unknown as { name: string })?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Order ID: {order?.order_id}
                    </p>
                  </div>
                  <Link href={`/order/${order?.order_id}`}>
                    <Button className="mt-2" size="sm">
                      Detail
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p>No active Orders</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
