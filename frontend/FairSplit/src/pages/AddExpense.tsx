import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  paidBy: z.string(),
  splitType: z.enum(["equal", "percentage", "share", "amount"]),
});

export function AddExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState([
    { id: "1", name: "You", selected: true, value: "" },
    { id: "2", name: "Rahul", selected: true, value: "" },
    { id: "3", name: "Priya", selected: true, value: "" },
  ]);

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      paidBy: "1",
      splitType: "equal",
    },
  });

  const splitType = form.watch("splitType");

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

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    console.log("Expense added:", values, participants);
    navigate(`/groups/${id}`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add Expense</h1>
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
                <Input type="number" placeholder="0.00" {...form.register("amount")} />
                {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paid By</Label>
              <Select onValueChange={(val) => form.setValue("paidBy", val)} defaultValue={form.getValues("paidBy")}>
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
              <Select onValueChange={(val: any) => form.setValue("splitType", val)} defaultValue={form.getValues("splitType")}>
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
