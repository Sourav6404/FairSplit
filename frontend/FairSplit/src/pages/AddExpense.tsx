import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const expenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Valid amount is required"),
  date: z.string(),
  paidBy: z.string().min(1, "Payer is required"),
  splitType: z.enum(["equal", "percentage", "share", "amount"]),
});

export function AddExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<any[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      paidBy: "",
      splitType: "equal",
    },
  });

  const splitType = form.watch("splitType");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [meData, groupData] = await Promise.all([
          apiFetch("/auth/me/"),
          apiFetch(`/groups/${id}/`)
        ]);
        setGroup(groupData);
        
        const myMember = groupData.members?.find((m: any) => m.user_id === meData.id);
        const parts = (groupData.members || []).map((m: any) => ({
          id: String(m.id),
          name: m.user_id === meData.id ? `${m.name} (You)` : m.name,
          selected: true,
          value: ""
        }));
        setParticipants(parts);

        if (myMember) {
          form.setValue("paidBy", String(myMember.id));
        } else if (groupData.members?.length > 0) {
          form.setValue("paidBy", String(groupData.members[0].id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleParticipantToggle = (participantId: string) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, selected: !p.selected } : p
    ));
  };

  const handleValueChange = (participantId: string, value: string) => {
    setParticipants(participants.map(p => 
      p.id === participantId ? { ...p, value } : p
    ));
  };

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    try {
      const amountVal = Number(values.amount);
      const selectedParts = participants.filter(p => p.selected);
      
      if (selectedParts.length === 0) {
        alert("Please select at least one participant.");
        return;
      }

      let splitTypeApi = "equal";
      let payloadParticipants: any[] = [];

      if (values.splitType === "equal") {
        splitTypeApi = "equal";
        payloadParticipants = selectedParts.map(p => Number(p.id));
      } else if (values.splitType === "percentage") {
        splitTypeApi = "percentage";
        const totalPct = selectedParts.reduce((acc, p) => acc + Number(p.value || 0), 0);
        if (Math.abs(totalPct - 100) > 0.01) {
          alert("Total percentage must equal 100%");
          return;
        }
        payloadParticipants = selectedParts.map(p => ({
          member_id: Number(p.id),
          percentage: Number(p.value)
        }));
      } else if (values.splitType === "amount") {
        splitTypeApi = "exact";
        const totalAmount = selectedParts.reduce((acc, p) => acc + Number(p.value || 0), 0);
        if (Math.abs(totalAmount - amountVal) > 0.01) {
          alert(`Total exact shares (₹${totalAmount}) must equal total expense amount (₹${amountVal})`);
          return;
        }
        payloadParticipants = selectedParts.map(p => ({
          member_id: Number(p.id),
          share_amount: Number(p.value)
        }));
      } else if (values.splitType === "share") {
        splitTypeApi = "exact";
        const totalShares = selectedParts.reduce((acc, p) => acc + Number(p.value || 1), 0);
        if (totalShares <= 0) {
          alert("Total shares must be greater than 0");
          return;
        }

        let sumRounded = 0;
        const tempParts = selectedParts.map((p) => {
          const shareVal = Number(p.value || 1);
          const computed = Math.round((shareVal / totalShares) * amountVal * 100) / 100;
          sumRounded += computed;
          return {
            member_id: Number(p.id),
            share_amount: computed
          };
        });

        const diff = amountVal - sumRounded;
        if (Math.abs(diff) > 0.001) {
          tempParts[0].share_amount = Number((tempParts[0].share_amount + diff).toFixed(2));
        }

        payloadParticipants = tempParts;
      }

      await apiFetch("/expenses/create_with_participants/", {
        method: "POST",
        body: JSON.stringify({
          group: Number(id),
          paid_by: Number(values.paidBy),
          description: values.description,
          amount: amountVal,
          currency: "INR",
          expense_date: values.date,
          split_type: splitTypeApi,
          participants: payloadParticipants
        })
      });

      navigate(`/groups/${id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to add expense.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Expense to {group?.name || "Group"}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="e.g. Dinner, Uber" {...form.register("description")} />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" step="any" placeholder="0.00" {...form.register("amount")} />
                {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paid By</Label>
              <Select onValueChange={(val) => form.setValue("paidBy", val)} value={form.watch("paidBy")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label>Split Options</Label>
              <Select onValueChange={(val: any) => form.setValue("splitType", val)} value={form.watch("splitType")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select split type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">Equally (=)</SelectItem>
                  <SelectItem value="percentage">By Percentages (%)</SelectItem>
                  <SelectItem value="share">By Shares (1, 2, 3)</SelectItem>
                  <SelectItem value="amount">By Exact Amounts (₹)</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                <Label className="text-sm text-muted-foreground">Participants</Label>
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Checkbox 
                      id={`p-${p.id}`} 
                      checked={p.selected} 
                      onCheckedChange={() => handleParticipantToggle(p.id)}
                      disabled={splitType !== "equal" && !p.selected}
                    />
                    <Label htmlFor={`p-${p.id}`} className="flex-1 font-medium cursor-pointer">
                      {p.name}
                    </Label>
                    
                    {p.selected && splitType !== "equal" && (
                      <Input 
                        placeholder={splitType === "percentage" ? "%" : splitType === "share" ? "shares" : "₹"} 
                        className="w-24 h-8"
                        value={p.value}
                        onChange={(e) => handleValueChange(p.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg mt-8 shadow-md">
              <Save className="mr-2" size={20} />
              Save Expense
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
