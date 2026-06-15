import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  // Toggle this to test empty state
  const [hasExpenses, setHasExpenses] = useState(true);

  const mockExpenses = [
    { id: 1, desc: "Dinner at Olive", amount: 3000, paidBy: "Rahul", effect: "You owe Rahul ₹500", effectType: "negative", date: "Today" },
    { id: 2, desc: "Cab to Airport", amount: 800, paidBy: "You", effect: "Rahul owes you ₹300", effectType: "positive", date: "Yesterday" },
    { id: 3, desc: "Hotel Booking", amount: 15000, paidBy: "You", effect: "Priya owes you ₹5000", effectType: "positive", date: "2 days ago" },
  ];

  const chartData = [
    { name: "Jan", total: 4000 },
    { name: "Feb", total: 3000 },
    { name: "Mar", total: 2000 },
    { name: "Apr", total: 8000 },
    { name: "May", total: 1890 },
    { name: "Jun", total: 2390 },
  ];

  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Goa Trip</h1>
          <p className="text-muted-foreground text-sm">5 Members</p>
        </div>
        {hasExpenses && (
          <Button onClick={() => navigate(`/groups/${id}/add-expense`)} size="sm">
            <PlusCircle size={16} className="mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      <Tabs defaultValue="expenses" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="flex-1 mt-4">
          {!hasExpenses ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg border-muted">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <PlusCircle size={40} className="text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-xl font-bold mb-2">No Expenses Added Yet</h2>
              <p className="text-muted-foreground mb-6">Start sharing expenses with your group.</p>
              <Button onClick={() => navigate(`/groups/${id}/add-expense`)}>
                Add First Expense
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockExpenses.map((exp) => (
                <div 
                  key={exp.id} 
                  className="flex flex-col space-y-2 max-w-md bg-card border rounded-xl p-4 shadow-sm mx-auto w-full md:max-w-full cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{exp.desc}</div>
                      <div className="text-sm text-muted-foreground">{exp.paidBy} paid ₹{exp.amount}</div>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{exp.date}</div>
                  </div>
                  <div className={`text-sm font-medium p-2 rounded bg-muted/50 ${exp.effectType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                    {exp.effect}
                  </div>

                  {expandedId === exp.id && (
                    <div className="mt-4 pt-4 border-t border-dashed space-y-2 text-sm animate-in slide-in-from-top-2 duration-200">
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Title</span><span className="font-medium text-right">{exp.desc}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Date</span><span className="font-medium text-right">{exp.date}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Amount</span><span className="font-medium text-right">₹{exp.amount}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Paid By</span><span className="font-medium text-right">{exp.paidBy}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Amount per person (5)</span><span className="font-medium text-right">₹{exp.amount / 5}</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Owed To You</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">₹5,300.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total You Owe</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">₹500.00</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Member Balances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Rahul</span>
                <span className="text-green-500 font-bold">owes you ₹300</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Priya</span>
                <span className="text-red-500 font-bold">you owe ₹500</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="font-medium">Anjali</span>
                <span className="text-green-500 font-bold">owes you ₹5000</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Expense Chart</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
