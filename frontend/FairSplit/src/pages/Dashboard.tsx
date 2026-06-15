import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, ArrowUpRight } from "lucide-react";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({ pending_balance: 0, total_expenses_owed: 0 });
  const [groups, setGroups] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await apiFetch("/dashboard/");
        setStats(statsData);
        
        const groupsData = await apiFetch("/groups/");
        setGroups(groupsData);

        const me = await apiFetch("/auth/me/");
        setCurrentUser(me);

        const expensesData = await apiFetch("/expenses/");
        setExpenses(expensesData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Chart data for past months expenses
  const expenseData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: months[d.getMonth()], monthIdx: d.getMonth(), amount: 0 };
    }).reverse();

    console.log("DEBUG CHART INITIAL:", {
      currentUserExists: !!currentUser,
      groupsLength: groups.length,
      expensesLength: expenses.length
    });

    if (!currentUser || !groups.length || !expenses.length) {
      return chartData;
    }

    const userGroupIds = new Set(groups.map((g: any) => g.id));
    console.log("DEBUG CHART GROUP IDs:", Array.from(userGroupIds));

    expenses.forEach((exp: any) => {
      if (userGroupIds.has(exp.group)) {
        const amount = Number(exp.amount || 0);
        
        let dateObj: Date | null = null;
        if (exp.expense_date) {
          const parts = exp.expense_date.split('-');
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
            bucket.amount += amount;
          }
        }
      }
    });

    console.log("DEBUG CHART FINAL DATA:", chartData);
    return chartData.map(({ month, amount }) => ({ month, amount }));
  }, [currentUser, groups, expenses]);

  // Helper to determine bar color based on amount (shades of green)
  const getBarColor = (amount: number) => {
    if (amount < 1000) return "#dcfce7"; // Very light green
    if (amount < 2000) return "#86efac"; // Light green
    if (amount < 3000) return "#22c55e"; // Green
    return "#114b30"; // Dark green
  };

  const displayGroups = useMemo(() => {
    return groups.map((g: any) => {
      const balanceVal = Number(g.balance ?? 0);
      let balanceText = "Settled up";
      let isOwed: boolean | null = null;
      if (balanceVal > 0) {
        balanceText = `+ ₹${balanceVal.toLocaleString()}`;
        isOwed = true;
      } else if (balanceVal < 0) {
        balanceText = `- ₹${Math.abs(balanceVal).toLocaleString()}`;
        isOwed = false;
      } else {
        balanceText = "Settled";
        isOwed = null;
      }
      return {
        id: g.id,
        name: g.name,
        members: g.members?.length || 0,
        balance: balanceText,
        isOwed: isOwed,
      };
    });
  }, [groups]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back! Here's your financial overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/groups')} 
            className="bg-[#114b30] hover:bg-[#155436] text-white rounded-full px-5 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none mb-[2px]">+</span> Create Group
          </button>
          <button 
            onClick={() => navigate('/import')} 
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-full px-5 py-2 text-sm font-semibold transition-colors shadow-sm"
          >
            Import Data
          </button>
        </div>
      </div>

      {/* Top Balances as styled cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Amount to get: Dark Green Card */}
        <div 
          onClick={() => navigate('/expenses')}
          className="bg-[#114b30] rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-[#114b30]/20 cursor-pointer hover:opacity-95 hover:scale-[1.02] transition-all"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white/80 font-medium">Amount to get</h3>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors pointer-events-none">
              <ArrowUpRight size={14} className="text-white" />
            </button>
          </div>
          <div className="text-5xl font-bold mb-2">₹{stats.pending_balance ?? 0}</div>
        </div>

        {/* Amount you owe: Light Card */}
        <div 
          onClick={() => navigate('/expenses')}
          className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm cursor-pointer hover:bg-gray-50 hover:scale-[1.02] transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-900 font-bold">Amount you owe</h3>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors pointer-events-none">
              <ArrowUpRight size={14} className="text-gray-600" />
            </button>
          </div>
          <div className="text-5xl font-bold mb-2">₹{stats.total_expenses_owed ?? 0}</div>
        </div>
      </div>

      {/* Expense Chart */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
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

      {/* Groups List */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4">Your Groups</h3>
        <div className="space-y-3">
          {displayGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-medium">
              No groups joined yet. Create one to get started!
            </div>
          ) : (
            displayGroups.map((group) => (
              <div key={group.id} onClick={() => navigate(`/groups/${group.id}`)} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-green-100 hover:bg-green-50/30 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#114b30]/10 rounded-full flex items-center justify-center text-[#114b30]">
                    <Users size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{group.name}</h4>
                    <p className="text-xs text-gray-500">{group.members} members</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${group.isOwed === true ? 'text-green-500' : group.isOwed === false ? 'text-red-500' : 'text-gray-400'}`}>
                    {group.balance}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
