import { useMemo, useState, useEffect } from "react";
import { User } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";

export function Expenses() {
  const [stats, setStats] = useState<any>({ pending_balance: 0, total_expenses_owed: 0, personal_expense: 0 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const statsData = await apiFetch("/dashboard/");
        setStats(statsData);

        const me = await apiFetch("/auth/me/");
        setCurrentUser(me);

        const groupsData = await apiFetch("/groups/");
        setGroups(groupsData);

        const expensesData = await apiFetch("/expenses/");
        setExpenses(expensesData);

        // Fetch settlements for all groups in parallel to construct dynamic balance details
        const settlementsPromises = groupsData.map((g: any) =>
          apiFetch(`/groups/${g.id}/settlements/`).then((settlements: any[]) => ({
            groupName: g.name,
            groupId: g.id,
            settlements,
            groupMembers: g.members || []
          }))
        );
        const allSettlementsResults = await Promise.all(settlementsPromises);

        const list: any[] = [];
        let idCounter = 1;

        allSettlementsResults.forEach(({ groupName, settlements, groupMembers }) => {
          const myMember = groupMembers.find((m: any) => m.user_id === me.id);
          const myMemberId = myMember?.id;

          settlements.forEach((s: any) => {
            const isPayer = s.payer_id === myMemberId || (me.username && s.payer_phone === me.username);
            const isReceiver = s.receiver_id === myMemberId || (me.username && s.receiver_phone === me.username);

            if (isPayer) {
              list.push({
                id: idCounter++,
                name: s.receiver_name,
                amount: Number(s.amount),
                type: "owe",
                group: groupName
              });
            } else if (isReceiver) {
              list.push({
                id: idCounter++,
                name: s.payer_name,
                amount: Number(s.amount),
                type: "get",
                group: groupName
              });
            }
          });
        });

        setExpensesList(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Chart data for past months expenses
  const expenseData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: months[d.getMonth()], monthIdx: d.getMonth(), totalAmount: 0, personalAmount: 0 };
    }).reverse();

    if (!currentUser || !groups.length || !expenses.length) {
      return chartData;
    }

    const userGroupIds = new Set(groups.map((g: any) => Number(g.id)));

    const myMemberIdsByGroupId = new Map<number, number>();
    groups.forEach((g: any) => {
      const myMember = g.members?.find((m: any) => Number(m.user_id) === Number(currentUser.id));
      if (myMember) {
        myMemberIdsByGroupId.set(Number(g.id), Number(myMember.id));
      }
    });

    expenses.forEach((exp: any) => {
      const groupId = Number(exp.group);
      if (userGroupIds.has(groupId)) {
        const totalAmountVal = Number(exp.amount || 0);

        let personalAmountVal = 0;
        const myMemberId = myMemberIdsByGroupId.get(groupId);
        if (myMemberId !== undefined) {
          const part = exp.participants?.find((p: any) => Number(p.member) === myMemberId);
          if (part) {
            personalAmountVal = Number(part.share_amount || 0);
          }
        }
        
        let dateObj: Date | null = null;
        if (exp.expense_date) {
          const parts = exp.expense_date.split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) {
              dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            } else {
              dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            }
          }
        }

        if (dateObj && !isNaN(dateObj.getTime())) {
          const mIdx = dateObj.getMonth();
          const bucket = chartData.find(item => item.monthIdx === mIdx);
          if (bucket) {
            bucket.totalAmount += totalAmountVal;
            bucket.personalAmount += personalAmountVal;
          }
        }
      }
    });

    return chartData.map(({ month, totalAmount, personalAmount }) => ({ month, totalAmount, personalAmount }));
  }, [currentUser, groups, expenses]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114b30]"></div>
      </div>
    );
  }

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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="totalAmount" name="Total Group Expenses" fill="#114b30" radius={[4, 4, 4, 4]} barSize={16} />
                  <Bar dataKey="personalAmount" name="Your Personal Share" fill="#22c55e" radius={[4, 4, 4, 4]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
