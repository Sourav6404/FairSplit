import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, CheckCircle, FileText, AlertTriangle } from "lucide-react";

export function ImportFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "anomalies" | "confirm" | "success">("upload");
  const [resolvedIds, setResolvedIds] = useState<string[]>([]);

  const anomalies = [
    { 
      id: "FAIRSPLIT-2411", 
      sNo: 1, 
      transactionData: "12 Oct 2023, 8:45 PM - Dinner", 
      details: "Duplicate expense detected", 
      type: "duplicate",
      recommendedAction: "Delete",
      buttonColor: "bg-[#e11d48]" // Red
    },
    { 
      id: "FAIRSPLIT-2410", 
      sNo: 2, 
      transactionData: "14 Oct 2023, 2:30 PM - Uber Ride", 
      details: "Missing currency", 
      type: "missing",
      recommendedAction: "Enter Manually",
      buttonColor: "bg-[#06b6d4]" // Cyan/Blue
    },
    { 
      id: "FAIRSPLIT-2409", 
      sNo: 3, 
      transactionData: "15 Oct 2023, 10:15 AM - Airbnb", 
      details: "Missing payer information", 
      type: "missing",
      recommendedAction: "Enter Manually",
      buttonColor: "bg-[#06b6d4]" // Cyan/Blue
    },
    { 
      id: "FAIRSPLIT-2408", 
      sNo: 4, 
      transactionData: "16 Oct 2023, 1:00 PM - Lunch", 
      details: "Amount seems unusually high", 
      type: "warning",
      recommendedAction: "Keep Data",
      buttonColor: "bg-[#15803d]" // Green
    },
  ];

  const handleUpload = () => {
    // Simulate upload delay
    setTimeout(() => setStep("anomalies"), 1000);
  };

  const handleResolve = (id: string) => {
    if (!resolvedIds.includes(id)) {
      const newResolved = [...resolvedIds, id];
      setResolvedIds(newResolved);
      if (newResolved.length === anomalies.length) {
        setTimeout(() => setStep("confirm"), 500);
      }
    }
  };

  return (
    <div className={`p-4 md:p-8 mx-auto h-full flex flex-col justify-center ${step === 'anomalies' ? 'max-w-6xl' : 'max-w-2xl'}`}>
      {step === "upload" && (
        <Card className="border-dashed border-2 text-center py-12">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <UploadCloud size={40} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Historical Data</h2>
            <p className="text-muted-foreground mb-8">Drag and drop your CSV file here, or click to browse.</p>
            <Button size="lg" onClick={handleUpload}>
              Upload CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "anomalies" && (
        <div className="animate-in fade-in duration-500 w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> Review Anomalies
            </h2>
          </div>
          
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 tracking-wider">
              <div className="col-span-1">S.No</div>
              <div className="col-span-2">Anomaly Id</div>
              <div className="col-span-3">Transaction Data</div>
              <div className="col-span-4">Details</div>
              <div className="col-span-2 text-center">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {anomalies.map((anomaly) => (
                <div 
                  key={anomaly.id} 
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${resolvedIds.includes(anomaly.id) ? 'opacity-50 bg-gray-50/50' : 'hover:bg-gray-50'}`}
                >
                  <div className="col-span-1 text-sm">
                    <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold text-xs border border-yellow-200">
                      {anomaly.sNo}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm font-medium text-gray-900 underline underline-offset-2 decoration-gray-300 cursor-pointer hover:text-[#114b30]">
                    {anomaly.id}
                  </div>
                  <div className="col-span-3 text-sm text-gray-600">
                    {anomaly.transactionData}
                  </div>
                  <div className="col-span-4 text-sm text-gray-600">
                    {anomaly.details}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {resolvedIds.includes(anomaly.id) ? (
                      <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleResolve(anomaly.id)}
                        className={`${anomaly.buttonColor} text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:brightness-110 transition-all w-full max-w-[140px] shadow-sm`}
                      >
                        {anomaly.recommendedAction}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              size="lg" 
              className="bg-[#114b30] hover:bg-[#155436] text-white"
              onClick={() => setStep("confirm")}
              disabled={resolvedIds.length !== anomalies.length}
            >
              Proceed to Confirmation
            </Button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={24} className="text-primary" />
              <CardTitle>Confirm Import</CardTitle>
            </div>
            <CardDescription>Review the summary of the data you are about to import.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">42</div>
                <div className="text-sm text-muted-foreground">Expenses</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-muted-foreground">Settlements</div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep("upload")}>Cancel</Button>
              <Button className="flex-1" onClick={() => setStep("success")}>Confirm Upload</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "success" && (
        <Card className="text-center py-12 border-green-500/30 bg-green-500/5 animate-in fade-in duration-500">
          <CardContent className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Historical Data Successfully Imported</h2>
            <p className="text-muted-foreground mb-8">Your new group "Historical Import" has been created.</p>
            <Button size="lg" onClick={() => navigate("/groups/imported-1")}>
              View Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
