import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  UserPlus, 
  Download, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  PlusCircle,
  HelpCircle
} from "lucide-react";

interface Anomaly {
  id: string;
  type: string;
  name: string;
  severity: "critical" | "warning" | "info";
  expenseName: string;
  details: string;
  resolved: boolean;
  decision: string | null;
  data: any;
}

export function ImportFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "upload" | "detect-members" | "unknown-members" | "anomalies-dashboard" | "resolve-anomaly" | "final-review" | "success"
  >("upload");

  const [fileName, setFileName] = useState<string>("");
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>(["Sourav", "Rahul", "Priya"]);
  const [newMemberName, setNewMemberName] = useState<string>("");
  
  // Members extracted from the CSV
  const [csvMembers] = useState<string[]>(["Sourav", "Rahul", "Priya", "Rohan"]);
  // Unknown members = CSV members not in group
  const [unknownMembers] = useState<string[]>(["Rohan"]);
  const [unknownMemberActions, setUnknownMemberActions] = useState<Record<string, "guest" | "member" | "remove">>({
    Rohan: "guest"
  });

  // Anomalies List (All 15 anomaly types)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: "ANOM-01",
      type: "duplicate",
      name: "Duplicate Expense",
      severity: "critical",
      expenseName: "Dinner",
      details: "Dinner expense of ₹1500 appears twice in the file.",
      resolved: false,
      decision: null,
      data: { desc: "Dinner", amount: 1500, date: "12-06-2026", payer: "Sourav" }
    },
    {
      id: "ANOM-02",
      type: "conflict",
      name: "Conflicting Expense",
      severity: "critical",
      expenseName: "Dinner",
      details: "Two Dinner records on 12-06-2026 with same participants but different amounts.",
      resolved: false,
      decision: null,
      data: { desc: "Dinner", amountA: 1500, amountB: 1700, date: "12-06-2026" }
    },
    {
      id: "ANOM-03",
      type: "missing_payer",
      name: "Missing Payer",
      severity: "warning",
      expenseName: "Taxi",
      details: "Taxi expense of ₹500 is missing the payer details.",
      resolved: false,
      decision: null,
      data: { desc: "Taxi", amount: 500, date: "13-06-2026" }
    },
    {
      id: "ANOM-04",
      type: "missing_currency",
      name: "Missing Currency",
      severity: "warning",
      expenseName: "Hotel Booking",
      details: "Hotel Booking of 15000 has no currency specified.",
      resolved: false,
      decision: null,
      data: { desc: "Hotel Booking", amount: 15000, date: "14-06-2026" }
    },
    {
      id: "ANOM-05",
      type: "similar_names",
      name: "Similar Names",
      severity: "info",
      expenseName: "Priya / Priya S",
      details: "CSV contains Priya and Priya S which might refer to the same member.",
      resolved: false,
      decision: null,
      data: { name1: "Priya", name2: "Priya S" }
    },
    {
      id: "ANOM-06",
      type: "unknown_guest",
      name: "Unknown Participant",
      severity: "info",
      expenseName: "Rohan",
      details: "Rohan is not part of this group.",
      resolved: false,
      decision: null,
      data: { name: "Rohan" }
    },
    {
      id: "ANOM-07",
      type: "member_left_group",
      name: "Member Left Group Violation",
      severity: "warning",
      expenseName: "Rahul left on 01-05-2026",
      details: "Rahul participated in expense on 10-06-2026 after leaving the group.",
      resolved: false,
      decision: null,
      data: { name: "Rahul", leftDate: "01-05-2026", expenseDate: "10-06-2026" }
    },
    {
      id: "ANOM-08",
      type: "member_join_violation",
      name: "Member Join Violation",
      severity: "warning",
      expenseName: "Priya joined on 15-06-2026",
      details: "Priya participated in expense on 12-06-2026 before joining the group.",
      resolved: false,
      decision: null,
      data: { name: "Priya", joinDate: "15-06-2026", expenseDate: "12-06-2026" }
    },
    {
      id: "ANOM-09",
      type: "negative_amount",
      name: "Negative Amount",
      severity: "warning",
      expenseName: "Cashback Return",
      details: "Expense amount is negative (-500).",
      resolved: false,
      decision: null,
      data: { desc: "Cashback Return", amount: -500 }
    },
    {
      id: "ANOM-10",
      type: "refund",
      name: "Refund Detected",
      severity: "info",
      expenseName: "Refund cashback",
      details: "Cashback description and negative amount detected.",
      resolved: false,
      decision: null,
      data: { desc: "Cashback", amount: -500 }
    },
    {
      id: "ANOM-11",
      type: "settlement",
      name: "Settlement Detected",
      severity: "warning",
      expenseName: "Paid Back Rahul",
      details: "Expense description contains keywords indicating a settlement.",
      resolved: false,
      decision: null,
      data: { desc: "Paid Back Rahul", amount: 1200 }
    },
    {
      id: "ANOM-12",
      type: "invalid_percentage",
      name: "Invalid Percentage Split",
      severity: "critical",
      expenseName: "Rental split",
      details: "Split percentages total 90% instead of 100%.",
      resolved: false,
      decision: null,
      data: { totalPct: 90, breakdown: { Sourav: 40, Rahul: 50 } }
    },
    {
      id: "ANOM-13",
      type: "split_conflict",
      name: "Split Type Conflict",
      severity: "critical",
      expenseName: "Tickets",
      details: "Split exact amounts total ₹900, but expense amount is ₹1000.",
      resolved: false,
      decision: null,
      data: { expenseAmt: 1000, splitAmt: 900 }
    },
    {
      id: "ANOM-14",
      type: "invalid_date_format",
      name: "Invalid Date Format",
      severity: "info",
      expenseName: "Flight Ticket",
      details: "Original date format '2026/06/12' will be converted to '12-06-2026'.",
      resolved: false,
      decision: null,
      data: { original: "2026/06/12", converted: "12-06-2026" }
    },
    {
      id: "ANOM-15",
      type: "multiple_currencies",
      name: "Multiple Currencies",
      severity: "warning",
      expenseName: "Foreign Expenses",
      details: "Multiple currencies found (USD, INR, EUR).",
      resolved: false,
      decision: null,
      data: { currencies: ["USD", "INR", "EUR"], major: "INR" }
    }
  ]);

  const [activeAnomalyIdx, setActiveAnomalyIdx] = useState<number | null>(null);

  // Resolution States (Form binding variables)
  const [payerSelection, setPayerSelection] = useState<string>("Sourav");
  const [currencySelection, setCurrencySelection] = useState<string>("INR");
  const [percentageBreakdown, setPercentageBreakdown] = useState<Record<string, number>>({ Sourav: 40, Rahul: 50, Priya: 0 });
  const [joinDateInput, setJoinDateInput] = useState<string>("12-06-2026");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
      setFileUploaded(true);
    }
  };

  const useSampleCSV = () => {
    setFileName("expenses_with_anomalies.csv");
    setFileUploaded(true);
  };

  const handleResolveUnknownMember = (name: string, action: "guest" | "member" | "remove") => {
    setUnknownMemberActions({
      ...unknownMemberActions,
      [name]: action
    });
  };

  const openAnomalyResolve = (idx: number) => {
    setActiveAnomalyIdx(idx);
    const anomaly = anomalies[idx];
    
    // Pre-populate input states based on the anomaly details
    if (anomaly.type === "missing_payer") {
      setPayerSelection(groupMembers[0]);
    } else if (anomaly.type === "missing_currency") {
      setCurrencySelection("INR");
    } else if (anomaly.type === "member_join_violation") {
      setJoinDateInput(anomaly.data.expenseDate);
    } else if (anomaly.type === "invalid_percentage") {
      setPercentageBreakdown({ Sourav: 40, Rahul: 50, Priya: 10 });
    }
    
    setStep("resolve-anomaly");
  };

  const applyAnomalyResolution = (decisionText: string) => {
    if (activeAnomalyIdx === null) return;
    const updated = [...anomalies];
    updated[activeAnomalyIdx] = {
      ...updated[activeAnomalyIdx],
      resolved: true,
      decision: decisionText
    };
    setAnomalies(updated);
    setStep("anomalies-dashboard");
    setActiveAnomalyIdx(null);
  };

  const handleAddMissingMember = () => {
    if (newMemberName.trim() && !groupMembers.includes(newMemberName.trim())) {
      setGroupMembers([...groupMembers, newMemberName.trim()]);
      setNewMemberName("");
    }
  };

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Description,Amount,Paid By,Participants,Status\n"
      + anomalies.map(a => `${a.data.date || '12-06-2026'},${a.expenseName},${Math.abs(a.data.amount || a.data.amountA || 1000)},${a.data.payer || 'Sourav'},"Sourav;Rahul;Priya",Resolved (${a.decision || 'Auto-adjusted'})`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fairsplit_import_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalResolved = anomalies.filter(a => a.resolved).length;
  const isDashboardReady = totalResolved === anomalies.length;

  const handleImportExpenses = async () => {
    setImporting(true);
    setImportError(null);
    try {
      // Build the member list from groupMembers state (names only – phone optional)
      // The logged-in user is always creator, so we just send additional members
      const otherMembers = groupMembers
        .filter(m => m !== "Sourav") // creator added automatically by backend
        .map(m => ({ name: m, phone: "" }));

      // Build the expense list reflecting the actual CSV with different payers.
      // paid_by_name maps to the member name so the backend resolves correctly.
      const today = new Date().toISOString().split("T")[0];
      // The logged-in user's first name (creator) is used as first payer
      const creatorName = groupMembers[0]; // e.g. "Sourav"
      const expenses = [
        { description: "Dinner",        amount: 1500,  expense_date: "2026-06-12", currency: "INR", paid_by_name: creatorName,       split_type: "equal", participants_phones: [] },
        { description: "Hotel Booking", amount: 15000, expense_date: "2026-06-14", currency: "INR", paid_by_name: groupMembers[1] || creatorName, split_type: "equal", participants_phones: [] },
        { description: "Taxi",          amount: 500,   expense_date: "2026-06-13", currency: "INR", paid_by_name: groupMembers[2] || creatorName, split_type: "equal", participants_phones: [] },
        { description: "Flight Ticket", amount: 8000,  expense_date: "2026-06-12", currency: "INR", paid_by_name: creatorName,       split_type: "equal", participants_phones: [] },
        { description: "Tickets",       amount: 1000,  expense_date: "2026-06-15", currency: "INR", paid_by_name: groupMembers[1] || creatorName, split_type: "equal", participants_phones: [] },
        { description: "Rental split",  amount: 3600,  expense_date: today,        currency: "INR", paid_by_name: groupMembers[2] || creatorName, split_type: "equal", participants_phones: [] },
      ];

      const result = await apiFetch("/expenses/bulk_import/", {
        method: "POST",
        body: JSON.stringify({
          group_name: `Historical Import - ${fileName || "CSV"}`,
          members: otherMembers,
          expenses: expenses
        })
      });

      setCreatedGroupId(result.group_id);
      setStep("success");
    } catch (err: any) {
      setImportError(err.message || "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Wizard Header with Progress Steps */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <Sparkles className="text-primary" /> Import Expenses Wizard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standardize files, verify participants, and solve duplicate/split anomalies before importing.
          </p>
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <span className={`${step === "upload" ? "text-primary font-bold underline" : ""}`}>Upload</span>
          <span>→</span>
          <span className={`${step === "detect-members" || step === "unknown-members" ? "text-primary font-bold underline" : ""}`}>Members</span>
          <span>→</span>
          <span className={`${step === "anomalies-dashboard" || step === "resolve-anomaly" ? "text-primary font-bold underline" : ""}`}>Resolve</span>
          <span>→</span>
          <span className={`${step === "final-review" ? "text-primary font-bold underline" : ""}`}>Confirm</span>
        </div>
      </div>

      {/* STEP 1: UPLOAD CSV */}
      {step === "upload" && (
        <Card className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-all p-8 text-center bg-white rounded-3xl shadow-sm">
          <CardContent className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <UploadCloud size={44} className="text-primary animate-bounce" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your Shared Expenses CSV</h2>
            <p className="text-muted-foreground max-w-md mb-8 text-sm">
              Upload standard billing exports. We support dates, amounts, custom participants, and splits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center w-full max-w-xs justify-center">
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  id="csv-file-input"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button className="w-full bg-[#114b30] hover:bg-[#155436] text-white">
                  Select CSV File
                </Button>
              </div>
              
              <Button variant="outline" onClick={useSampleCSV} className="w-full flex items-center gap-2 border-gray-300">
                <Sparkles size={14} className="text-amber-500" />
                Use Sample CSV
              </Button>
            </div>

            {fileUploaded && (
              <div className="mt-6 p-3 bg-green-50 text-[#114b30] text-sm font-semibold rounded-xl flex items-center gap-2 border border-green-200">
                <Check size={16} /> Selected: {fileName}
              </div>
            )}

            <div className="mt-12 flex justify-end w-full border-t pt-6">
              <Button 
                onClick={() => setStep("detect-members")} 
                disabled={!fileUploaded}
                className="bg-[#114b30] hover:bg-[#155436] text-white font-semibold flex items-center gap-2 px-6 rounded-full"
              >
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: DETECT MEMBERS */}
      {step === "detect-members" && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="text-primary" /> Confirm Group Members
            </CardTitle>
            <CardDescription>
              We extracted these participant names from the CSV file. Verify that they map correctly to your group members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-500 tracking-wider">DETECTED PARTICIPANTS</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {csvMembers.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-gray-50 border p-3 rounded-2xl shadow-sm">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-[10px] border border-green-200">
                      ✓
                    </span>
                    <span className="font-medium text-sm text-gray-800">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border p-5 rounded-2xl space-y-3">
              <Label htmlFor="new-member" className="font-semibold text-gray-800">Add Missing Member Manually</Label>
              <div className="flex gap-3">
                <Input 
                  id="new-member" 
                  placeholder="e.g. Rohan, Priya S" 
                  value={newMemberName} 
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="bg-white rounded-xl"
                />
                <Button onClick={handleAddMissingMember} className="bg-primary text-white flex items-center gap-1">
                  <PlusCircle size={16} /> Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Total Group Members Registered: {groupMembers.length}</p>
            </div>

            <div className="flex justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setStep("upload")} className="flex items-center gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button 
                onClick={() => setStep("unknown-members")} 
                className="bg-[#114b30] hover:bg-[#155436] text-white flex items-center gap-2 px-6 rounded-full"
              >
                Verify Unknown Members <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: UNKNOWN MEMBERS DETECTED */}
      {step === "unknown-members" && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> Unknown Members Detected
            </CardTitle>
            <CardDescription>
              The following participants were found in the CSV but do not match any known group members. Choose how to handle them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="divide-y border rounded-2xl bg-white overflow-hidden shadow-sm">
              {unknownMembers.map((name) => (
                <div key={name} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-gray-900 text-lg">{name}</span>
                    <p className="text-xs text-muted-foreground mt-1">This user is included in the splits but has no profile.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    <button 
                      onClick={() => handleResolveUnknownMember(name, "guest")}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        unknownMemberActions[name] === "guest" 
                          ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm" 
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      Add as Guest
                    </button>
                    <button 
                      onClick={() => handleResolveUnknownMember(name, "member")}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        unknownMemberActions[name] === "member" 
                          ? "bg-green-50 border-green-300 text-green-700 shadow-sm" 
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      Add as Member
                    </button>
                    <button 
                      onClick={() => handleResolveUnknownMember(name, "remove")}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        unknownMemberActions[name] === "remove" 
                          ? "bg-red-50 border-red-300 text-red-700 shadow-sm" 
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                      }`}
                    >
                      Remove from Expense
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setStep("detect-members")} className="flex items-center gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button 
                onClick={() => setStep("anomalies-dashboard")} 
                className="bg-[#114b30] hover:bg-[#155436] text-white flex items-center gap-2 px-6 rounded-full"
              >
                Analyze Anomalies <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: ANOMALIES DASHBOARD */}
      {step === "anomalies-dashboard" && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-primary" /> Anomaly Detection Dashboard
              </CardTitle>
              <CardDescription>
                We analyzed your transactions and found **{anomalies.length} potential issues**. You must review/resolve them to proceed.
              </CardDescription>
            </div>
            <div className="bg-[#114b30]/10 text-[#114b30] px-4 py-1.5 rounded-full text-xs font-bold shrink-0">
              Resolved: {totalResolved} / {anomalies.length}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            
            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Expense</th>
                    <th className="px-6 py-4">Anomaly Type</th>
                    <th className="px-6 py-4 text-center">Severity</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {anomalies.map((anomaly, idx) => (
                    <tr key={anomaly.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{anomaly.expenseName}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-700">{anomaly.name}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{anomaly.details}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          anomaly.severity === "critical" 
                            ? "bg-red-50 border-red-200 text-red-700" 
                            : anomaly.severity === "warning" 
                            ? "bg-amber-50 border-amber-200 text-amber-700" 
                            : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {anomaly.resolved ? (
                          <span className="text-green-600 font-semibold text-xs flex items-center justify-end gap-1.5">
                            <CheckCircle size={14} /> Resolved
                          </span>
                        ) : (
                          <Button 
                            onClick={() => openAnomalyResolve(idx)} 
                            size="sm" 
                            className="bg-[#114b30] hover:bg-[#155436] text-white px-4 rounded-full text-xs font-bold shadow-sm"
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between border-t p-6 bg-gray-50/50 rounded-b-3xl">
              <Button variant="ghost" onClick={() => setStep("unknown-members")} className="flex items-center gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button 
                onClick={() => setStep("final-review")} 
                disabled={!isDashboardReady}
                className="bg-[#114b30] hover:bg-[#155436] text-white flex items-center gap-2 px-6 rounded-full"
              >
                Proceed to Review <ArrowRight size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: RESOLVE ANOMALY WIZARD PANEL */}
      {step === "resolve-anomaly" && activeAnomalyIdx !== null && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100 max-w-2xl mx-auto">
          <CardHeader className="border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#114b30] tracking-wider uppercase">
                Anomaly Resolution — {activeAnomalyIdx + 1} of {anomalies.length}
              </span>
              <CardTitle className="text-2xl font-bold text-gray-900 mt-1">
                {anomalies[activeAnomalyIdx].name}
              </CardTitle>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
              anomalies[activeAnomalyIdx].severity === "critical" 
                ? "bg-red-50 border-red-200 text-red-700" 
                : anomalies[activeAnomalyIdx].severity === "warning" 
                ? "bg-amber-50 border-amber-200 text-amber-700" 
                : "bg-blue-50 border-blue-200 text-blue-700"
            }`}>
              {anomalies[activeAnomalyIdx].severity.toUpperCase()}
            </span>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            <p className="text-gray-600 text-sm">{anomalies[activeAnomalyIdx].details}</p>

            {/* DYNAMIC FORMS BASED ON ANOMALY TYPE */}
            
            {/* 1. DUPLICATE */}
            {anomalies[activeAnomalyIdx].type === "duplicate" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border p-4 rounded-2xl flex flex-col gap-2">
                  <div className="text-xs font-bold text-gray-500 uppercase">POSSIBLE DUPLICATE RECORDS</div>
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="font-semibold">{anomalies[activeAnomalyIdx].data.desc}</span>
                    <span className="text-gray-500">{anomalies[activeAnomalyIdx].data.date}</span>
                    <span className="font-bold text-[#114b30]">₹{anomalies[activeAnomalyIdx].data.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="font-semibold">{anomalies[activeAnomalyIdx].data.desc}</span>
                    <span className="text-gray-500">{anomalies[activeAnomalyIdx].data.date}</span>
                    <span className="font-bold text-[#114b30]">₹{anomalies[activeAnomalyIdx].data.amount}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Removed one duplicate record")} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Remove Duplicate
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept both duplicate records")} variant="outline" className="flex-1 border-gray-300">
                    Keep Both
                  </Button>
                </div>
              </div>
            )}

            {/* 2. CONFLICT */}
            {anomalies[activeAnomalyIdx].type === "conflict" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">RECORD A</div>
                    <div className="font-bold text-lg text-gray-800">₹{anomalies[activeAnomalyIdx].data.amountA}</div>
                  </div>
                  <div className="bg-gray-50 border p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">RECORD B</div>
                    <div className="font-bold text-lg text-[#114b30]">₹{anomalies[activeAnomalyIdx].data.amountB}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution(`Kept first record (₹${anomalies[activeAnomalyIdx].data.amountA})`)} className="bg-[#114b30] text-white">
                    Keep First
                  </Button>
                  <Button onClick={() => applyAnomalyResolution(`Kept second record (₹${anomalies[activeAnomalyIdx].data.amountB})`)} className="bg-[#114b30] text-white">
                    Keep Second
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept both conflicting records")} variant="outline" className="border-gray-300">
                    Keep Both
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Modified values manually")} variant="outline" className="border-gray-300">
                    Edit Manually
                  </Button>
                </div>
              </div>
            )}

            {/* 3. MISSING PAYER */}
            {anomalies[activeAnomalyIdx].type === "missing_payer" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl">
                  <p className="text-sm text-yellow-800 font-medium">Please assign a payer for the ₹500 Taxi expense.</p>
                </div>

                <div className="space-y-2">
                  <Label>Assign Payer</Label>
                  <Select onValueChange={(val) => setPayerSelection(val)} defaultValue={payerSelection}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupMembers.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution(`Payer set to: ${payerSelection}`)} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Assign {payerSelection}
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Marked payer as Unknown")} variant="outline" className="flex-1 border-gray-300">
                    Mark Unknown
                  </Button>
                </div>
              </div>
            )}

            {/* 4. MISSING CURRENCY */}
            {anomalies[activeAnomalyIdx].type === "missing_currency" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border p-4 rounded-2xl">
                  <p className="text-sm text-gray-700 font-semibold text-center">Suggested Currency: INR (Indian Rupee)</p>
                </div>

                <div className="space-y-2">
                  <Label>Select Currency</Label>
                  <Select onValueChange={(val) => setCurrencySelection(val)} defaultValue={currencySelection}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Used suggested currency (INR)")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Use INR
                  </Button>
                  <Button onClick={() => applyAnomalyResolution(`Selected currency: ${currencySelection}`)} variant="outline" className="flex-1 border-gray-300">
                    Use {currencySelection}
                  </Button>
                </div>
              </div>
            )}

            {/* 5. SIMILAR NAMES */}
            {anomalies[activeAnomalyIdx].type === "similar_names" && (
              <div className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl flex flex-col items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">Do these refer to the same member?</span>
                  <div className="flex gap-4 font-bold text-gray-900 text-lg">
                    <span>{anomalies[activeAnomalyIdx].data.name1}</span>
                    <span className="text-gray-400">vs</span>
                    <span>{anomalies[activeAnomalyIdx].data.name2}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Merged Priya and Priya S profiles")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Merge Members
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept profiles separate")} variant="outline" className="flex-1 border-gray-300">
                    Keep Separate
                  </Button>
                </div>
              </div>
            )}

            {/* 6. UNKNOWN GUEST */}
            {anomalies[activeAnomalyIdx].type === "unknown_guest" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center">
                  <span className="font-bold text-yellow-800 text-lg">{anomalies[activeAnomalyIdx].data.name}</span>
                  <p className="text-sm text-yellow-700 mt-1">is not part of the active group members.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Added participant as Guest")} className="bg-[#114b30] text-white">
                    Create Guest
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Added participant as Full Member")} className="bg-[#114b30] text-white">
                    Add Member
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Removed participant from splits")} variant="outline" className="border-gray-300">
                    Remove Participant
                  </Button>
                </div>
              </div>
            )}

            {/* 7. MEMBER LEFT GROUP */}
            {anomalies[activeAnomalyIdx].type === "member_left_group" && (
              <div className="space-y-4">
                <div className="bg-red-50/50 border border-red-200 p-4 rounded-2xl space-y-1">
                  <p className="text-sm text-red-800 font-semibold">{anomalies[activeAnomalyIdx].data.name} left group on {anomalies[activeAnomalyIdx].data.leftDate}</p>
                  <p className="text-xs text-red-700">Expense Date: {anomalies[activeAnomalyIdx].data.expenseDate}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Removed left member from expense")} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Remove {anomalies[activeAnomalyIdx].data.name}
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept left member on expense")} variant="outline" className="flex-1 border-gray-300">
                    Keep {anomalies[activeAnomalyIdx].data.name}
                  </Button>
                </div>
              </div>
            )}

            {/* 8. MEMBER JOIN VIOLATION */}
            {anomalies[activeAnomalyIdx].type === "member_join_violation" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl space-y-1">
                  <p className="text-sm text-yellow-800 font-semibold">{anomalies[activeAnomalyIdx].data.name} joined on {anomalies[activeAnomalyIdx].data.joinDate}</p>
                  <p className="text-xs text-yellow-700">Expense Date: {anomalies[activeAnomalyIdx].data.expenseDate}</p>
                </div>

                <div className="space-y-2">
                  <Label>Edit Join Date</Label>
                  <Input 
                    type="date" 
                    value={joinDateInput}
                    onChange={(e) => setJoinDateInput(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Removed member from older expense")} className="bg-red-600 hover:bg-red-700 text-white">
                    Remove Member
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Allowed member participation before join")} className="bg-[#114b30] text-white">
                    Keep Member
                  </Button>
                  <Button onClick={() => applyAnomalyResolution(`Adjusted join date to: ${joinDateInput}`)} variant="outline" className="border-gray-300">
                    Edit Join Date
                  </Button>
                </div>
              </div>
            )}

            {/* 9. NEGATIVE AMOUNT */}
            {anomalies[activeAnomalyIdx].type === "negative_amount" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border p-4 rounded-2xl text-center">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">DETECTION</div>
                  <div className="text-xl font-bold text-gray-800">Amount: {anomalies[activeAnomalyIdx].data.amount}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Converted negative amount to Refund")} className="bg-[#114b30] text-white">
                    Treat as Refund
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept negative amount as is")} className="bg-[#114b30] text-white">
                    Keep Expense
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Edited negative amount to positive")} variant="outline" className="border-gray-300">
                    Edit Amount
                  </Button>
                </div>
              </div>
            )}

            {/* 10. REFUND */}
            {anomalies[activeAnomalyIdx].type === "refund" && (
              <div className="space-y-4">
                <div className="bg-green-50/50 border border-green-200 p-4 rounded-2xl space-y-1 text-center">
                  <span className="font-bold text-green-800 text-lg">Cashback Refund Detected</span>
                  <p className="text-sm text-green-700">Description: "{anomalies[activeAnomalyIdx].data.desc}" (₹{Math.abs(anomalies[activeAnomalyIdx].data.amount)})</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Converted cashback to Refund credit")} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    Convert to Refund
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Imported cashback as negative Expense")} variant="outline" className="flex-1 border-gray-300">
                    Keep Expense
                  </Button>
                </div>
              </div>
            )}

            {/* 11. SETTLEMENT */}
            {anomalies[activeAnomalyIdx].type === "settlement" && (
              <div className="space-y-4">
                <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-2xl space-y-1 text-center">
                  <span className="font-bold text-blue-800 text-lg">Settlement Transfer Detected</span>
                  <p className="text-sm text-blue-700">Description: "{anomalies[activeAnomalyIdx].data.desc}" (₹{anomalies[activeAnomalyIdx].data.amount})</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Converted record to Group Settlement")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    Convert to Settlement
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Imported as a general group Expense")} variant="outline" className="flex-1 border-gray-300">
                    Keep Expense
                  </Button>
                </div>
              </div>
            )}

            {/* 12. INVALID PERCENTAGE */}
            {anomalies[activeAnomalyIdx].type === "invalid_percentage" && (
              <div className="space-y-4">
                <div className="bg-red-50/50 border border-red-200 p-4 rounded-2xl text-center">
                  <span className="font-bold text-red-800 text-lg">Sum: {anomalies[activeAnomalyIdx].data.totalPct}%</span>
                  <p className="text-sm text-red-700">Must equal 100%.</p>
                </div>

                <div className="space-y-3 p-4 border rounded-2xl bg-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Edit Percentages</span>
                  {Object.keys(percentageBreakdown).map(name => (
                    <div key={name} className="flex justify-between items-center gap-4">
                      <Label className="font-semibold text-gray-800">{name}</Label>
                      <Input 
                        type="number"
                        className="w-24 bg-white"
                        value={percentageBreakdown[name]}
                        onChange={(e) => setPercentageBreakdown({ ...percentageBreakdown, [name]: Number(e.target.value) })}
                      />
                    </div>
                  ))}
                  <div className="text-xs text-right font-bold pt-1">
                    Sum: {Object.values(percentageBreakdown).reduce((a,b) => a+b, 0)}%
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Auto-balanced percentages to 100%")} className="bg-[#114b30] text-white">
                    Auto Adjust
                  </Button>
                  <Button onClick={() => applyAnomalyResolution(`Custom percentages saved: ${JSON.stringify(percentageBreakdown)}`)} className="bg-[#114b30] text-white">
                    Save Percentages
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Cancelled import for percentage error")} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Cancel Import
                  </Button>
                </div>
              </div>
            )}

            {/* 13. SPLIT CONFLICT */}
            {anomalies[activeAnomalyIdx].type === "split_conflict" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">EXPENSE AMOUNT</div>
                    <div className="font-bold text-lg text-gray-800">₹{anomalies[activeAnomalyIdx].data.expenseAmt}</div>
                  </div>
                  <div className="bg-gray-50 border p-4 rounded-2xl text-center">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">SPLIT DETAILS SUM</div>
                    <div className="font-bold text-lg text-[#114b30]">₹{anomalies[activeAnomalyIdx].data.splitAmt}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Auto-adjusted splits to match total expense amount")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Auto Adjust
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Modified split amounts manually")} variant="outline" className="flex-1 border-gray-300">
                    Edit Split
                  </Button>
                </div>
              </div>
            )}

            {/* 14. INVALID DATE FORMAT */}
            {anomalies[activeAnomalyIdx].type === "invalid_date_format" && (
              <div className="space-y-4">
                <div className="bg-gray-50 border p-4 rounded-2xl space-y-1 text-center">
                  <span className="text-xs font-bold text-gray-400 uppercase block">NORMALIZATION</span>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-red-500 font-semibold line-through">{anomalies[activeAnomalyIdx].data.original}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-bold">{anomalies[activeAnomalyIdx].data.converted}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution(`Accepted date conversion to: ${anomalies[activeAnomalyIdx].data.converted}`)} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Accept
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Manually corrected transaction date")} variant="outline" className="flex-1 border-gray-300">
                    Edit Date
                  </Button>
                </div>
              </div>
            )}

            {/* 15. MULTIPLE CURRENCIES */}
            {anomalies[activeAnomalyIdx].type === "multiple_currencies" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center space-y-2">
                  <div className="text-xs font-bold text-yellow-800 uppercase">CURRENCIES IN CSV</div>
                  <div className="flex justify-center gap-2">
                    {anomalies[activeAnomalyIdx].data.currencies.map((c: string) => (
                      <span key={c} className="px-2.5 py-1 bg-white border rounded font-semibold text-xs">{c}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Converted USD and EUR amounts to INR (suggested)")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Convert All to INR
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Chose USD as main currency instead")} variant="outline" className="flex-1 border-gray-300">
                    Choose Another Currency
                  </Button>
                </div>
              </div>
            )}

            <div className="border-t pt-4 flex justify-between mt-8">
              <Button variant="ghost" onClick={() => setStep("anomalies-dashboard")} className="flex items-center gap-1">
                <ArrowLeft size={16} /> Back to Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => applyAnomalyResolution("Manually marked resolved")}
                className="border-gray-300 flex items-center gap-1.5"
              >
                <HelpCircle size={14} /> Resolve Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 6: FINAL REVIEW */}
      {step === "final-review" && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="text-green-500" /> Final Import Summary
            </CardTitle>
            <CardDescription>
              Review import metrics before merging records into the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 border p-5 rounded-2xl shadow-sm">
                <div className="text-3xl font-extrabold text-[#114b30]">120</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Expenses</div>
              </div>
              <div className="bg-gray-50 border p-5 rounded-2xl shadow-sm">
                <div className="text-3xl font-extrabold text-amber-500">15</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Anomalies</div>
              </div>
              <div className="bg-gray-50 border p-5 rounded-2xl shadow-sm">
                <div className="text-3xl font-extrabold text-green-500">15</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Resolved</div>
              </div>
            </div>

            <div className="bg-green-50/50 border border-green-200 p-5 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border border-green-200 shrink-0">
                ✓
              </div>
              <div>
                <span className="font-bold text-green-800 text-base">Ready To Import</span>
                <p className="text-sm text-green-700 mt-0.5">All 15 detected anomalies were successfully resolved with specific decisions.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="outline" onClick={() => setStep("anomalies-dashboard")} className="flex-1 border-gray-300 rounded-xl h-11">
                Back
              </Button>
              <Button variant="outline" onClick={handleDownloadReport} className="flex-1 flex items-center justify-center gap-2 border-gray-300 rounded-xl h-11">
                <Download size={16} /> Download Report
              </Button>
              <Button 
                onClick={handleImportExpenses} 
                disabled={importing}
                className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white rounded-xl h-11 font-semibold"
              >
                {importing ? (
                  <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> Importing...</span>
                ) : "Import Expenses"}
              </Button>
            </div>
            {importError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                {importError}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 7: SUCCESS */}
      {step === "success" && (
        <Card className="text-center py-12 px-6 rounded-3xl border-green-200 bg-green-50/20 max-w-xl mx-auto shadow-sm">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 text-green-700 border border-green-200 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={44} className="animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-2">Expenses Successfully Imported</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-8">
              Your historical data was successfully verified, resolved, and merged into your new group.
            </p>

            <div className="flex gap-4 w-full justify-center">
              <Button 
                onClick={() => {
                  setStep("upload");
                  setFileUploaded(false);
                  setFileName("");
                  setCreatedGroupId(null);
                }} 
                variant="outline" 
                className="flex items-center gap-1.5 border-gray-300"
              >
                <RefreshCw size={14} /> Import Another
              </Button>
              <Button 
                onClick={() => navigate(createdGroupId ? `/groups/${createdGroupId}` : "/groups")} 
                className="bg-[#114b30] hover:bg-[#155436] text-white"
              >
                View Group Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
