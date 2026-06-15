import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function Summary() {
  const chartData = [
    { name: "Jan", total: 12000 },
    { name: "Feb", total: 9500 },
    { name: "Mar", total: 15000 },
    { name: "Apr", total: 8200 },
    { name: "May", total: 10400 },
    { name: "Jun", total: 23900 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Global Summary</h1>
        <p className="text-muted-foreground">Overview of your finances across all groups.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Owed To You</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-500">₹8,450.00</div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">Across 3 active groups</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Total You Owe</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">₹1,200.00</div>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Across 2 active groups</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Person-wise Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="font-medium text-lg">Rahul</span>
              <p className="text-xs text-muted-foreground">In Goa Trip, Office Lunch</p>
            </div>
            <span className="text-green-500 font-bold">owes you ₹1,200</span>
          </div>
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <span className="font-medium text-lg">Priya</span>
              <p className="text-xs text-muted-foreground">In Roommates</p>
            </div>
            <span className="text-red-500 font-bold">you owe ₹800</span>
          </div>
          <div className="flex justify-between items-center pb-3">
            <div>
              <span className="font-medium text-lg">Anjali</span>
              <p className="text-xs text-muted-foreground">In Goa Trip</p>
            </div>
            <span className="text-green-500 font-bold">owes you ₹500</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Chart (All Groups)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
