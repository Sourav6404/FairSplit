import { useMemo, useState, useEffect } from "react";
import { User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";

export function Expenses() {
  const [stats, setStats] = useState<any>({ pending_balance: 0, total_expenses_owed: 0, personal_expense: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await apiFetch("/dashboard/");
        setStats(statsData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  // Mock data matching the dashboard totals (Get: 4250, Owe: 850)
  const expensesList = stats.personal_expense > 0 || stats.pending_balance > 0 ? [
    { id: 1, name: "Rahul Sharma", amount: 2000, type: "get", group: "Goa Trip" },
    { id: 2, name: "Priya Patel", amount: 1500, type: "get", group: "Roommates" },
    { id: 3, name: "Amit Kumar", amount: 750, type: "get", group: "Goa Trip" },
    { id: 4, name: "Sneha Gupta", amount: 500, type: "owe", group: "Office Lunch" },
    { id: 5, name: "Vikram Singh", amount: 350, type: "owe", group: "Roommates" },
  ] : [];

  // Chart data for past months expenses
  const expenseData = stats.personal_expense > 0 ? [
    { month: "Jan", amount: 1200 },
    { month: "Feb", amount: 2500 },
    { month: "Mar", amount: 800 },
    { month: "Apr", amount: 3500 },
    { month: "May", amount: 1500 },
    { month: "Jun", amount: 4200 },
  ] : [
    { month: "Jan", amount: 0 },
    { month: "Feb", amount: 0 },
    { month: "Mar", amount: 0 },
    { month: "Apr", amount: 0 },
    { month: "May", amount: 0 },
    { month: "Jun", amount: 0 },
  ];

  // Helper to determine bar color based on amount (shades of green)
  const getBarColor = (amount: number) => {
    if (amount < 1000) return "#dcfce7"; // Very light green
    if (amount < 2000) return "#86efac"; // Light green
    if (amount < 3000) return "#22c55e"; // Green
    return "#114b30"; // Dark green
  };

  // Sort expenses by amount descending (largest first)
  const sortedExpenses = useMemo(() => {
    return [...expensesList].sort((a, b) => b.amount - a.amount);
  }, [expensesList]);

  const totalToGet = expensesList.filter(e => e.type === "get").reduce((acc, curr) => acc + curr.amount, 0);
  const totalToOwe = expensesList.filter(e => e.type === "owe").reduce((acc, curr) => acc + curr.amount, 0);

  // If there are no expenses at all, we would show the empty state
  if (expensesList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center py-20">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-500 max-w-sm">You haven't added any expenses yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Expenses</h1>
      </div>

      {/* Top Balances (No background color) */}
      <div className="flex flex-col md:flex-row gap-12 items-center justify-center py-6">
        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-gray-500 mb-2 tracking-wide uppercase">Amount to get</p>
          <h2 className="text-5xl font-bold text-green-500 tracking-tight">₹{totalToGet.toLocaleString()}</h2>
        </div>

        <div className="hidden md:block w-px h-16 bg-gray-200"></div>

        <div className="flex flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-gray-500 mb-2 tracking-wide uppercase">Amount you owe</p>
          <h2 className="text-5xl font-bold text-red-500 tracking-tight">₹{totalToOwe.toLocaleString()}</h2>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="expenses" className="font-semibold">Expenses</TabsTrigger>
            <TabsTrigger value="summary" className="font-semibold">Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="expenses" className="animate-in fade-in-50 duration-500">
          {/* People List */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 text-lg border-b pb-2">People & Balances</h3>
            <div className="flex flex-col gap-3">
              {sortedExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${expense.type === 'get' ? 'bg-green-500' : 'bg-red-500'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{expense.name}</h4>
                      <p className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                        {expense.group}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold text-xl ${expense.type === 'get' ? 'text-green-500' : 'text-red-500'}`}>
                      {expense.type === 'get' ? '+' : '-'} ₹{expense.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {expense.type === 'get' ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="animate-in fade-in-50 duration-500">
          {/* Expense Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mt-4">
            <h3 className="font-bold text-gray-900 mb-6">Past Months Expenses</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    cursor={{fill: '#f3f4f6'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 6, 6]} barSize={40}>
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.amount)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
