import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, ArrowUpRight, ArrowDownLeft, Users, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GroupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>({});
  const [settlements, setSettlements] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteGroup = async () => {
    try {
      setDeleting(true);
      await apiFetch(`/groups/${id}/`, {
        method: "DELETE"
      });
      setIsDeleteOpen(false);
      navigate("/groups");
    } catch (err) {
      console.error(err);
      alert("Failed to delete group.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [meData, groupData, expensesData, balancesData, settlementsData] = await Promise.all([
          apiFetch("/auth/me/"),
          apiFetch(`/groups/${id}/`),
          apiFetch(`/expenses/?group=${id}`),
          apiFetch(`/groups/${id}/balance_summary/`),
          apiFetch(`/groups/${id}/settlements/`)
        ]);
        setActiveUser(meData);
        setGroup(groupData);
        setExpenses(expensesData);
        setBalances(balancesData);
        setSettlements(settlementsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-8 text-center animate-in fade-in duration-300">
        <h2 className="text-xl font-bold">Group not found</h2>
        <Button onClick={() => navigate("/groups")} className="mt-4">Back to Groups</Button>
      </div>
    );
  }

  const activeMember = group.members?.find((m: any) => m.user_id === activeUser?.id);
  const activeMemberId = activeMember?.id;

  const myBalanceDetails = balances[String(activeMemberId || "")] || { paid: 0, share: 0, balance: 0 };
  const netBalance = Number(myBalanceDetails.balance);
  const totalOwedToYou = netBalance > 0 ? netBalance : 0;
  const totalYouOwe = netBalance < 0 ? Math.abs(netBalance) : 0;

  // Build chart data for last 6 months
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { name: months[d.getMonth()], monthIdx: d.getMonth(), total: 0 };
  }).reverse();

  expenses.forEach((exp: any) => {
    const date = new Date(exp.expense_date);
    const mIdx = date.getMonth();
    const bucket = chartData.find(item => item.monthIdx === mIdx);
    if (bucket) {
      bucket.total += Number(exp.amount);
    }
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <Users size={14} /> {group.members?.length || 0} Members
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300">
                <Trash2 size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2">
                  <Trash2 size={20} /> Delete Group
                </DialogTitle>
                <DialogDescription className="pt-2">
                  Are you sure you want to delete <strong>{group.name}</strong>? This action is permanent and will delete all expenses, settlements, and history for this group.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 mt-4">
                <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteGroup} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  {deleting ? "Deleting..." : "Delete Group"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => navigate(`/groups/${id}/add-expense`)} size="sm">
            <PlusCircle size={16} className="mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="flex-1 mt-4">
          {expenses.length === 0 ? (
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
              {expenses.map((exp) => {
                const payer = group.members?.find((m: any) => m.id === exp.paid_by);
                const payerName = payer ? (payer.id === activeMemberId ? "You" : payer.name) : "Unknown";

                const myParticipant = exp.participants?.find((p: any) => p.member === activeMemberId);
                const isPaidByMe = exp.paid_by === activeMemberId;

                // Count participants who are NOT the payer (i.e. people the payer lent money to)
                const othersParticipants = exp.participants?.filter((p: any) => p.member !== exp.paid_by) ?? [];
                const othersShareTotal = othersParticipants.reduce((sum: number, p: any) => sum + Number(p.share_amount), 0);

                let effect = "";
                let effectType = "neutral";

                if (isPaidByMe) {
                  if (othersShareTotal > 0) {
                    effect = `You lent ₹${othersShareTotal.toFixed(2)} to ${othersParticipants.length} other${othersParticipants.length > 1 ? "s" : ""}`;
                    effectType = "positive";
                  } else {
                    effect = "You paid for yourself";
                    effectType = "neutral";
                  }
                } else if (myParticipant) {
                  effect = `You owe ${payerName} ₹${Number(myParticipant.share_amount).toFixed(2)}`;
                  effectType = "negative";
                } else {
                  effect = "Not involved";
                  effectType = "neutral";
                }


                return (
                  <div 
                    key={exp.id} 
                    className="flex flex-col space-y-2 max-w-md bg-card border rounded-xl p-4 shadow-sm mx-auto w-full md:max-w-full cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{exp.description}</div>
                        <div className="text-sm text-muted-foreground">{payerName} paid ₹{Number(exp.amount).toFixed(2)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{exp.expense_date}</div>
                    </div>
                    <div className={`text-sm font-medium p-2 rounded ${
                      effectType === 'positive' ? 'bg-green-50 text-green-700' : 
                      effectType === 'negative' ? 'bg-red-50 text-red-700' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {effect}
                    </div>

                    {expandedId === exp.id && (
                      <div className="mt-4 pt-4 border-t border-dashed space-y-2 text-sm animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Title</span><span className="font-medium text-right">{exp.description}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Date</span><span className="font-medium text-right">{exp.expense_date}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Total Amount</span><span className="font-medium text-right">₹{Number(exp.amount).toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Paid By</span><span className="font-medium text-right">{payerName}</span></div>
                        <div className="flex justify-between items-center border-t pt-2 mt-2"><span className="font-semibold">Splits:</span></div>
                        {exp.participants?.map((part: any) => {
                          const mem = group.members?.find((m: any) => m.id === part.member);
                          return (
                            <div key={part.id} className="flex justify-between items-center text-xs">
                              <span>{mem ? (mem.id === activeMemberId ? "You" : mem.name) : "Unknown"}</span>
                              <span>₹{Number(part.share_amount).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
                <div className="text-2xl font-bold text-green-500">₹{totalOwedToYou.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total You Owe</CardTitle>
                <ArrowDownLeft className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">₹{totalYouOwe.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Positions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(balances).map(([memberId, b]: [string, any]) => {
                  const bal = Number(b.balance);
                  const isSelf = String(memberId) === String(activeMemberId);
                  const displayName = isSelf ? `${b.name} (You)` : b.name;
                  if (bal === 0) {
                    return (
                      <div key={memberId} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                        <span className="font-medium text-muted-foreground">{displayName}</span>
                        <span className="text-muted-foreground text-sm font-semibold">Settled up</span>
                      </div>
                    );
                  }
                  return (
                    <div key={memberId} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                      <span className="font-medium">{displayName}</span>
                      <span className={`font-bold text-sm ${bal > 0 ? "text-green-500" : "text-red-500"}`}>
                        {bal > 0 ? `Owed ₹${bal.toFixed(2)}` : `Owes ₹${Math.abs(bal).toFixed(2)}`}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggested Settlements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settlements.map((settle: any, idx: number) => {
                  const isPayerMe = String(settle.payer_id) === String(activeMemberId);
                  const isReceiverMe = String(settle.receiver_id) === String(activeMemberId);
                  const payerDisplayName = isPayerMe ? "You" : settle.payer_name;
                  const receiverDisplayName = isReceiverMe ? "You" : settle.receiver_name;

                  return (
                    <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-b-0">
                      <div>
                        <span className="font-semibold">{payerDisplayName}</span>
                        <span className="text-muted-foreground mx-1">pays</span>
                        <span className="font-semibold">{receiverDisplayName}</span>
                      </div>
                      <span className="font-bold text-primary">₹{Number(settle.amount).toFixed(2)}</span>
                    </div>
                  );
                })}
                {settlements.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">No settlements needed!</div>
                )}
              </CardContent>
            </Card>
          </div>

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
