import { useState, useEffect } from "react";
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

interface ParsedExpense {
  description: string;
  amount: number;
  expense_date: string;
  raw_date?: string;
  currency: string;
  paid_by_name: string;
  split_type: string;
  participants_names: string[];
  share_amounts: Record<string, number>;
}

export function ImportFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<
    "upload" | "detect-members" | "anomalies-dashboard" | "resolve-anomaly" | "final-review" | "success"
  >("upload");

  const [fileName, setFileName] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [memberPhones, setMemberPhones] = useState<Record<string, string>>({});
  const [parsedExpenses, setParsedExpenses] = useState<ParsedExpense[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [activeAnomalyIdx, setActiveAnomalyIdx] = useState<number | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // Resolution States (Form binding variables)
  const [payerSelection, setPayerSelection] = useState<string>("");
  const [currencySelection, setCurrencySelection] = useState<string>("INR");
  const [percentageBreakdown, setPercentageBreakdown] = useState<Record<string, number>>({});
  const [joinDateInput, setJoinDateInput] = useState<string>("12-06-2026");

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const u = await apiFetch("/auth/me/");
        setCurrentUser(u);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, []);

  // Simple CSV Text Parser helper
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentToken = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentToken += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentToken.trim());
        currentToken = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentToken.trim());
        if (row.length > 1 || row[0] !== "") {
          lines.push(row);
        }
        row = [];
        currentToken = "";
      } else {
        currentToken += char;
      }
    }
    if (currentToken || row.length > 0) {
      row.push(currentToken.trim());
      lines.push(row);
    }
    return lines;
  };

  const getColIdx = (headers: string[], names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Local Anomaly Scanner
  const scanAnomalies = (expenses: ParsedExpense[], members: string[]) => {
    const detected: Anomaly[] = [];
    const seen = new Set<string>();
    const memberSetLower = new Set(members.map(m => m.toLowerCase()));
    const flaggedUnknownUsers = new Set<string>();
    const stopWords = new Set(["at", "for", "the", "a", "an", "of", "in", "on", "with", "by", "to", "and", "or", "but", "is", "are", "was", "were", "from", "-"]);
    const normalizeDescription = (desc: string): string => {
      const words = desc.toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 0 && !stopWords.has(w));
      return words.sort().join(" ");
    };

    // Helper to safely compare DD-MM-YYYY strings in JS Date
    const parseDDMMYYYY = (dateStr: string): Date => {
      const dparts = dateStr.split(/[-/]/);
      if (dparts.length === 3) {
        if (dparts[0].length === 4) {
          return new Date(parseInt(dparts[0]), parseInt(dparts[1]) - 1, parseInt(dparts[2]));
        }
        return new Date(parseInt(dparts[2]), parseInt(dparts[1]) - 1, parseInt(dparts[0]));
      }
      return new Date(dateStr);
    };

    // 1. Gather all unique names mentioned in the CSV (payers + participants)
    const csvNames = new Set<string>();
    expenses.forEach(exp => {
      if (exp.paid_by_name) csvNames.add(exp.paid_by_name.trim());
      if (exp.participants_names) {
        exp.participants_names.forEach(p => csvNames.add(p.trim()));
      }
    });

    // 2. Identify similar names / Member Confusion between CSV names and group members
    const flaggedSimilarNames = new Set<string>(); // lowercase names that are similar to a group member
    const nameConfusionPairs = new Map<string, string>(); // csvNameLower -> groupMemberName

    csvNames.forEach(csvName => {
      const csvNameLower = csvName.toLowerCase();
      if (memberSetLower.has(csvNameLower)) return; // Already a member

      // Check if it's similar to any group member
      const csvParts = csvNameLower.split(/\s+/);
      for (const member of members) {
        const memberLower = member.toLowerCase();
        const memberParts = memberLower.split(/\s+/);
        
        // Match if first word is identical (e.g. "Priya" and "Priya S")
        if (csvParts[0] === memberParts[0]) {
          flaggedSimilarNames.add(csvNameLower);
          nameConfusionPairs.set(csvNameLower, member);

          detected.push({
            id: `ANOM-SIMILAR-${member}-${csvName}`,
            type: "similar_names",
            name: "Member Confusion",
            severity: "info",
            expenseName: "Member Matching Check",
            details: `Detected name '${csvName}' in transactions which is very similar to group member '${member}'. Do they refer to the same person?`,
            resolved: false,
            decision: null,
            data: { name1: member, name2: csvName }
          });
          break; // Stop checking other members for this name
        }
      }
    });

    // Check for multiple currencies across all expenses
    const currencies = expenses.map(e => e.currency).filter(Boolean);
    const uniqueCurrencies = Array.from(new Set(currencies));
    if (uniqueCurrencies.length > 1) {
      // Find the most common currency
      const counts: Record<string, number> = {};
      currencies.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
      const mainCurrency = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
      
      expenses.forEach((exp, idx) => {
        if (exp.currency && exp.currency !== mainCurrency) {
          detected.push({
            id: `ANOM-MULTICUR-${idx}`,
            type: "multiple_currencies",
            name: "Multiple Currencies",
            severity: "info",
            expenseName: exp.description,
            details: `Expense uses currency '${exp.currency}' instead of the main currency '${mainCurrency}'.`,
            resolved: false,
            decision: null,
            data: { currencies: uniqueCurrencies, ...exp }
          });
        }
      });
    }

    // Simulated join/left dates for testing scope.md limits
    const leftDates: Record<string, string> = {};
    const joinDates: Record<string, string> = {
      "dev": "10-02-2026",
      "sam": "10-02-2026"
    };

    expenses.forEach((exp, idx) => {
      // 1. Negative Amount & Refund
      if (exp.amount < 0) {
        const lowerDesc = exp.description.toLowerCase();
        const isRefund = ["refund", "cashback", "returned", "return", "reimbursement"].some(kw => lowerDesc.includes(kw));

        detected.push({
          id: `ANOM-NEG-${idx}`,
          type: isRefund ? "refund" : "negative_amount",
          name: isRefund ? "Cashback Refund" : "Negative Amount",
          severity: "warning",
          expenseName: exp.description,
          details: isRefund
            ? `Expense '${exp.description}' appears to be a refund or cashback transaction.`
            : `Expense '${exp.description}' has a negative amount (${exp.amount}).`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 2. Zero Amount Check
      if (exp.amount === 0) {
        detected.push({
          id: `ANOM-ZERO-${idx}`,
          type: "zero_amount",
          name: "Zero Amount Expense",
          severity: "info",
          expenseName: exp.description,
          details: `Expense '${exp.description}' has a zero amount (₹0).`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 3. High Precision Check
      const amountString = exp.amount.toString();
      const decimalMatch = amountString.match(/\.(\d+)/);
      if (decimalMatch && decimalMatch[1].length > 2) {
        detected.push({
          id: `ANOM-PRECISION-${idx}`,
          type: "high_precision",
          name: "High Precision Amount",
          severity: "info",
          expenseName: exp.description,
          details: `Expense '${exp.description}' has high decimal precision: ${exp.amount}.`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 4. Duplicate Check
      const normDesc = normalizeDescription(exp.description);
      const key = `${normDesc}-${exp.amount}-${exp.expense_date}-${(exp.paid_by_name || '').toLowerCase().trim()}`;
      if (seen.has(key)) {
        detected.push({
          id: `ANOM-DUP-${idx}`,
          type: "duplicate",
          name: "Duplicate Expense",
          severity: "critical",
          expenseName: exp.description,
          details: `Expense '${exp.description}' appears to be a duplicate.`,
          resolved: false,
          decision: null,
          data: exp
        });
      } else {
        seen.add(key);
      }

      // 5. Conflicting Duplicate Check
      for (let j = 0; j < idx; j++) {
        const other = expenses[j];
        const otherNormDesc = normalizeDescription(other.description);
        if (
          otherNormDesc === normDesc &&
          other.expense_date === exp.expense_date &&
          [...other.participants_names].sort().join(";") === [...exp.participants_names].sort().join(";")
        ) {
          if (other.amount !== exp.amount || (other.paid_by_name || '').toLowerCase().trim() !== (exp.paid_by_name || '').toLowerCase().trim()) {
            detected.push({
              id: `ANOM-CONFLICT-${idx}`,
              type: "conflict",
              name: "Conflicting Duplicate Expense",
              severity: "critical",
              expenseName: exp.description,
              details: `Conflicting records for '${exp.description}': ${exp.paid_by_name} (₹${exp.amount}) vs ${other.paid_by_name} (₹${other.amount}).`,
              resolved: false,
              decision: null,
              data: { amountA: other.amount, amountB: exp.amount, ...exp }
            });
          }
        }
      }

      // 6. Missing Payer
      if (!exp.paid_by_name || exp.paid_by_name.trim() === "") {
        detected.push({
          id: `ANOM-PAY-${idx}`,
          type: "missing_payer",
          name: "Missing Payer",
          severity: "critical",
          expenseName: exp.description,
          details: `Expense '${exp.description}' is missing the payer details.`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 7. Missing Currency
      if (!exp.currency || exp.currency.trim() === "") {
        detected.push({
          id: `ANOM-CUR-${idx}`,
          type: "missing_currency",
          name: "Missing Currency",
          severity: "warning",
          expenseName: exp.description,
          details: `Expense '${exp.description}' has no currency specified.`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 8. Unknown User (Guest) Check
      if (exp.paid_by_name) {
        const payerClean = exp.paid_by_name.trim();
        const payerLower = payerClean.toLowerCase();
        if (
          !memberSetLower.has(payerLower) &&
          !flaggedSimilarNames.has(payerLower) &&
          !flaggedUnknownUsers.has(payerLower)
        ) {
          flaggedUnknownUsers.add(payerLower);
          detected.push({
            id: `ANOM-GUEST-${idx}-${payerLower}`,
            type: "unknown_guest",
            name: "Unknown User",
            severity: "warning",
            expenseName: "Member Matching Check",
            details: `Payer '${payerClean}' is not in the confirmed group members list.`,
            resolved: false,
            decision: null,
            data: { name: payerClean, ...exp }
          });
        }
      }

      if (exp.participants_names) {
        exp.participants_names.forEach(p => {
          const pClean = p.trim();
          const pLower = pClean.toLowerCase();
          if (
            !memberSetLower.has(pLower) &&
            !flaggedSimilarNames.has(pLower) &&
            !flaggedUnknownUsers.has(pLower)
          ) {
            flaggedUnknownUsers.add(pLower);
            detected.push({
              id: `ANOM-GUEST-${idx}-${pLower}`,
              type: "unknown_guest",
              name: "Unknown User",
              severity: "warning",
              expenseName: "Member Matching Check",
              details: `Participant '${pClean}' is not in the confirmed group members list.`,
              resolved: false,
              decision: null,
              data: { name: pClean, ...exp }
            });
          }
        });
      }

      // 9. Invalid Percentage Check
      if (exp.split_type === "percentage" && exp.share_amounts) {
        const totalPct = Object.values(exp.share_amounts).reduce((a, b) => a + b, 0);
        if (totalPct !== 100 && totalPct > 0) {
          detected.push({
            id: `ANOM-PCT-${idx}`,
            type: "invalid_percentage",
            name: "Invalid Percentage Split",
            severity: "critical",
            expenseName: exp.description,
            details: `Percentage split sums to ${totalPct}% instead of 100%.`,
            resolved: false,
            decision: null,
            data: { totalPct, ...exp }
          });
        }
      }

      // 10. Split Conflict Check
      if (exp.split_type === "exact" && exp.share_amounts) {
        const splitAmt = Object.values(exp.share_amounts).reduce((a, b) => a + b, 0);
        if (Math.abs(splitAmt - exp.amount) > 0.01 && splitAmt > 0) {
          detected.push({
            id: `ANOM-SPLITCONFL-${idx}`,
            type: "split_conflict",
            name: "Split Amount Mismatch",
            severity: "critical",
            expenseName: exp.description,
            details: `Sum of split details is ₹${splitAmt} but total expense amount is ₹${exp.amount}.`,
            resolved: false,
            decision: null,
            data: { expenseAmt: exp.amount, splitAmt, ...exp }
          });
        }
      }

      // 11. Inconsistent Split Type Check
      if (exp.split_type === "equal" && exp.share_amounts && Object.keys(exp.share_amounts).length > 0) {
        detected.push({
          id: `ANOM-SPLITTYPE-${idx}`,
          type: "inconsistent_split_type",
          name: "Inconsistent Split Type",
          severity: "warning",
          expenseName: exp.description,
          details: `Split type is equal but custom split details are defined.`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 12. Settlement Check
      const lowerDesc = exp.description.toLowerCase();
      const isSettlement = ["paid back", "repaid", "settled", "gave back"].some(kw => lowerDesc.includes(kw));
      if (isSettlement) {
        detected.push({
          id: `ANOM-SETTLE-${idx}`,
          type: "settlement",
          name: "Settlement Logged as Expense",
          severity: "warning",
          expenseName: exp.description,
          details: `Expense '${exp.description}' looks like a repayment/settlement.`,
          resolved: false,
          decision: null,
          data: exp
        });
      }

      // 13. Invalid Date Format Check
      const rawDate = exp.raw_date || "";
      const isStandardDate = /^\d{2}-\d{2}-\d{4}$/.test(rawDate);
      if (rawDate && !isStandardDate) {
        detected.push({
          id: `ANOM-DATEFMT-${idx}`,
          type: "invalid_date_format",
          name: "Invalid Date Format",
          severity: "info",
          expenseName: exp.description,
          details: `Date format '${rawDate}' is non-standard. Normalized to DD-MM-YYYY.`,
          resolved: false,
          decision: null,
          data: { original: rawDate, converted: exp.expense_date }
        });
      }

      // 14. Ambiguous Date Check
      const parts = rawDate.split(/[-/]/);
      let isAmbiguous = false;
      if (parts.length === 3 && parts[0].length !== 4) {
        const p1 = parseInt(parts[0]);
        const p2 = parseInt(parts[1]);
        if (!isNaN(p1) && !isNaN(p2) && p1 <= 12 && p2 <= 12 && p1 !== p2) {
          isAmbiguous = true;
        }
      }

      let neighborMismatch = false;
      let prevMonth = "";
      let nextMonth = "";
      if (idx > 0 && idx < expenses.length - 1) {
        const prevExp = expenses[idx - 1];
        const nextExp = expenses[idx + 1];
        prevMonth = prevExp.expense_date.split("-")[1];
        nextMonth = nextExp.expense_date.split("-")[1];
        const currMonth = exp.expense_date.split("-")[1];
        if (prevMonth && nextMonth && currMonth && prevMonth === nextMonth && currMonth !== prevMonth) {
          neighborMismatch = true;
        }
      }

      if (isAmbiguous || neighborMismatch) {
        detected.push({
          id: `ANOM-DATEAMB-${idx}`,
          type: "ambiguous_date",
          name: "Ambiguous Date",
          severity: "warning",
          expenseName: exp.description,
          details: neighborMismatch
            ? `Date '${rawDate}' has month different from both previous and next transaction months (which are both ${prevMonth}).`
            : `Date '${rawDate}' is ambiguous (could be MM-DD-YYYY or DD-MM-YYYY).`,
          resolved: false,
          decision: null,
          data: { original_date: rawDate, expense_date: exp.expense_date }
        });
      }

      // 15. Member Left Group Check
      exp.participants_names.forEach(p => {
        const pLower = p.toLowerCase();
        if (memberSetLower.has(pLower)) {
          const leftLimit = leftDates[pLower];
          if (leftLimit) {
            const expMs = parseDDMMYYYY(exp.expense_date).getTime();
            const leftMs = parseDDMMYYYY(leftLimit).getTime();
            if (!isNaN(expMs) && !isNaN(leftMs) && expMs > leftMs) {
              detected.push({
                id: `ANOM-LEFT-${idx}-${p}`,
                type: "member_left_group",
                name: "Member Left Group",
                severity: "warning",
                expenseName: exp.description,
                details: `Member '${p}' had left the group before this expense occurred.`,
                resolved: false,
                decision: null,
                data: { name: p, leftDate: leftLimit, expenseDate: exp.expense_date }
              });
            }
          }
        }
      });

      // 16. Member Join Violation Check
      exp.participants_names.forEach(p => {
        const pLower = p.toLowerCase();
        // Skip check if the participant is considered a guest
        if (memberSetLower.has(pLower)) {
          const joinLimit = joinDates[pLower];
          if (joinLimit) {
            const expMs = parseDDMMYYYY(exp.expense_date).getTime();
            const joinMs = parseDDMMYYYY(joinLimit).getTime();
            if (!isNaN(expMs) && !isNaN(joinMs) && expMs < joinMs) {
              detected.push({
                id: `ANOM-JOIN-${idx}-${p}`,
                type: "member_join_violation",
                name: "Member Join Violation",
                severity: "warning",
                expenseName: exp.description,
                details: `Member '${p}' joined after this expense was incurred.`,
                resolved: false,
                decision: null,
                data: { name: p, joinDate: joinLimit, expenseDate: exp.expense_date }
              });
            }
          }
        }
      });
    });

    return detected;
  };

  const processCSV = (text: string) => {
    const lines = parseCSVText(text);
    if (lines.length === 0) return;

    const headers = lines[0].map(h => h.toLowerCase().trim());

    const dateIdx = getColIdx(headers, ["date", "time"]);
    const descIdx = getColIdx(headers, ["desc", "info", "item"]);
    const paidByIdx = getColIdx(headers, ["paid_by", "paid by", "payer", "who paid"]);
    const amountIdx = getColIdx(headers, ["amount", "cost", "price", "val"]);
    const currencyIdx = getColIdx(headers, ["curr"]);
    const splitTypeIdx = getColIdx(headers, ["split_type", "split type", "type"]);
    const splitWithIdx = getColIdx(headers, ["split_with", "split with", "participants"]);
    const splitDetailsIdx = getColIdx(headers, ["split_details", "split details", "shares", "percentages"]);

    // Extract members only from the split_with column of the first data row (lines[1])
    let detectedMembers: string[] = [];
    if (lines.length > 1 && splitWithIdx !== -1) {
      const firstRow = lines[1];
      const splitWithVal = firstRow[splitWithIdx] || "";
      detectedMembers = splitWithVal
        .split(";")
        .map(n => n.trim())
        .filter(Boolean);
    }

    // Include active user automatically if they are not in the CSV members list
    const activeUserName = currentUser?.first_name || currentUser?.username || "Sourav";
    if (activeUserName && !detectedMembers.some(m => m.toLowerCase() === activeUserName.toLowerCase())) {
      detectedMembers.push(activeUserName);
    }

    setGroupMembers(detectedMembers);

    // Initial phones setup
    const initialPhones: Record<string, string> = {};
    detectedMembers.forEach(m => {
      if (m.toLowerCase() === activeUserName.toLowerCase()) {
        initialPhones[m] = currentUser?.username || "";
      } else {
        initialPhones[m] = "";
      }
    });
    setMemberPhones(initialPhones);

    // Parse expenses
    const parsed: ParsedExpense[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length === 0 || !row[descIdx]) continue;

      const desc = row[descIdx] || "Imported Expense";
      const rawAmt = row[amountIdx] || "0";
      const amtClean = parseFloat(rawAmt.replace(/[^0-9.-]/g, "")) || 0;
      
      const rawDate = row[dateIdx] || "";
      let dateClean = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      if (rawDate) {
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            dateClean = `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
          } else if (parts[2].length === 4) {
            dateClean = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
          }
        }
      }

      const currency = row[currencyIdx] || "INR";
      const paidByName = row[paidByIdx] || activeUserName;
      
      let splitType = "equal";
      const rawSplitType = (row[splitTypeIdx] || "").toLowerCase();
      if (rawSplitType.includes("percentage") || rawSplitType.includes("percent")) {
        splitType = "percentage";
      } else if (rawSplitType.includes("unequal") || rawSplitType.includes("exact") || rawSplitType.includes("share")) {
        splitType = "exact";
      }

      const splitWithVal = row[splitWithIdx] || "";
      const splitWithNames = splitWithVal
        .split(";")
        .map(n => n.trim())
        .filter(Boolean);

      const splitDetailsVal = splitDetailsIdx !== -1 ? (row[splitDetailsIdx] || "") : "";
      const shareAmounts: Record<string, number> = {};
      const isShareType = rawSplitType.includes("share");

      if (splitDetailsVal) {
        const parts = splitDetailsVal.split(";");
        let totalRatio = 0;
        const parsedRatios: Record<string, number> = {};

        for (const part of parts) {
          const match = part.trim().match(/^(.+?)\s+([0-9.]+)$/);
          if (match) {
            const name = match[1].trim();
            const val = parseFloat(match[2]);
            if (isShareType) {
              parsedRatios[name] = val;
              totalRatio += val;
            } else {
              shareAmounts[name] = val;
            }
          }
        }

        if (isShareType && totalRatio > 0) {
          const names = Object.keys(parsedRatios);
          let sumShares = 0;
          names.forEach(name => {
            const exactVal = Math.round((amtClean * (parsedRatios[name] / totalRatio)) * 100) / 100;
            shareAmounts[name] = exactVal;
            sumShares += exactVal;
          });
          const diff = Math.round((amtClean - sumShares) * 100) / 100;
          if (diff !== 0 && names.length > 0) {
            shareAmounts[names[0]] = Math.round((shareAmounts[names[0]] + diff) * 100) / 100;
          }
        }
      }

      parsed.push({
        description: desc,
        amount: amtClean,
        expense_date: dateClean,
        raw_date: rawDate,
        currency: currency || "INR",
        paid_by_name: paidByName,
        split_type: splitType,
        participants_names: splitWithNames,
        share_amounts: shareAmounts
      });
    }

    setParsedExpenses(parsed);

    // Run anomaly scanner on parsed expenses
    const scanned = scanAnomalies(parsed, detectedMembers);
    setAnomalies(scanned);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      setGroupName(baseName);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processCSV(text);
        }
      };
      reader.readAsText(file);
      setFileUploaded(true);
    }
  };

  // Static sample text representing the Excel file
  const sampleCSVText = `date,description,paid_by,amount,currency,split_type,split_with,split_details,notes
01-02-2026,February rent,Aisha,48000,INR,equal,Aisha;Rohan;Priya;Meera,,
03-02-2026,Groceries,Priya,2340,INR,equal,Aisha;Rohan;Priya;Meera,,
05-02-2026,Wifi bill,Rohan,1199,INR,equal,Aisha;Rohan;Priya;Meera,,
08-02-2026,Dinner at Dev,Dev,3200,INR,equal,Aisha;Rohan;Priya;Dev,Aisha 1;Rohan 1;Dev 1,
14-02-2026,Movie night,Priya,640,INR,equal,Aisha;Rohan;Priya,,
15-02-2026,Cylinder,Rohan,,899.995,equal,Aisha;Rohan;Priya;Meera,,
18-02-2026,Groceries,Priya S,1875,INR,equal,Aisha;Rohan;Priya;Meera,,
20-02-2026,Aisha birthday,Rohan,1500,INR,exact,Rohan;Priya;Meera,Rohan 700;Priya 300;Meera 500,
22-02-2026,House cleaning supplies,,-780,INR,equal,Aisha;Rohan;Priya;Meera,,
28-02-2026,Pizza Friday,Aisha,1440,INR,percentage,Aisha;Rohan;Priya;Meera,Aisha 30%,`;

  const useSampleCSV = () => {
    setFileName("Expenses Export.csv");
    setGroupName("Expenses Export");
    processCSV(sampleCSVText);
    setFileUploaded(true);
  };

  const openAnomalyResolve = (idx: number) => {
    setActiveAnomalyIdx(idx);
    const anomaly = anomalies[idx];
    
    if (anomaly.type === "missing_payer") {
      setPayerSelection(groupMembers[0] || "");
    } else if (anomaly.type === "missing_currency") {
      setCurrencySelection("INR");
    } else if (anomaly.type === "member_join_violation") {
      setJoinDateInput(anomaly.data.expense_date);
    } else if (anomaly.type === "invalid_percentage") {
      const initialPct: Record<string, number> = {};
      groupMembers.forEach(m => {
        initialPct[m] = 0;
      });
      setPercentageBreakdown(initialPct);
    }
    
    setStep("resolve-anomaly");
  };

  const applyAnomalyResolution = (decisionText: string) => {
    if (activeAnomalyIdx === null) return;
    const anomaly = anomalies[activeAnomalyIdx];

    // Propagate fixes to parsedExpenses
    const updatedExpenses = [...parsedExpenses];
    
    // Find index of the expense if it relates to a specific transaction
    const expIdx = parsedExpenses.findIndex(
      e => e.description === anomaly.expenseName && 
           (anomaly.data && anomaly.data.amount !== undefined ? e.amount === anomaly.data.amount : true)
    );

    // 1. Missing Payer
    if (anomaly.type === "missing_payer") {
      if (expIdx !== -1) {
        updatedExpenses[expIdx].paid_by_name = payerSelection;
      }
    }
    // 2. Missing Currency
    else if (anomaly.type === "missing_currency") {
      if (expIdx !== -1) {
        updatedExpenses[expIdx].currency = currencySelection;
      }
    }
    // 3. Negative Amount
    else if (anomaly.type === "negative_amount") {
      if (expIdx !== -1 && decisionText.toLowerCase().includes("positive")) {
        updatedExpenses[expIdx].amount = Math.abs(updatedExpenses[expIdx].amount);
      }
    }
    // 4. Duplicate
    else if (anomaly.type === "duplicate") {
      if (decisionText.toLowerCase().includes("remove") && expIdx !== -1) {
        updatedExpenses.splice(expIdx, 1);
      }
    }
    // 5. Conflict
    else if (anomaly.type === "conflict") {
      if (decisionText.toLowerCase().includes("first") && expIdx !== -1) {
        updatedExpenses.splice(expIdx, 1);
      } else if (decisionText.toLowerCase().includes("second")) {
        const firstIdx = updatedExpenses.findIndex(
          (e, idx) => idx < expIdx && e.description === anomaly.expenseName && e.amount === anomaly.data.amountA
        );
        if (firstIdx !== -1) {
          updatedExpenses.splice(firstIdx, 1);
        }
      }
    }
    // 6. Similar Names (Member Confusion)
    else if (anomaly.type === "similar_names") {
      const name1 = anomaly.data.name1; // group member (e.g. "Priya")
      const name2 = anomaly.data.name2; // CSV name (e.g. "Priya S")
      if (decisionText.toLowerCase().includes("merge")) {
        // Rename name2 to name1 in all expenses
        updatedExpenses.forEach(exp => {
          if (exp.paid_by_name && exp.paid_by_name.toLowerCase() === name2.toLowerCase()) {
            exp.paid_by_name = name1;
          }
          if (exp.participants_names) {
            exp.participants_names = exp.participants_names.map(p => 
              p.toLowerCase() === name2.toLowerCase() ? name1 : p
            );
          }
          if (exp.share_amounts && exp.share_amounts[name2] !== undefined) {
            const val = exp.share_amounts[name2];
            delete exp.share_amounts[name2];
            exp.share_amounts[name1] = (exp.share_amounts[name1] || 0) + val;
          }
        });
      } else {
        // Keep separate -> Add name2 to groupMembers so it's a valid member
        if (!groupMembers.includes(name2)) {
          setGroupMembers(prev => [...prev, name2]);
          setMemberPhones(prev => ({ ...prev, [name2]: "" }));
        }
      }
    }
    // 7. Unknown User (Guest)
    else if (anomaly.type === "unknown_guest") {
      const guestName = anomaly.data.name;
      if (decisionText.toLowerCase().includes("guest") || decisionText.toLowerCase().includes("member")) {
        if (!groupMembers.includes(guestName)) {
          setGroupMembers(prev => [...prev, guestName]);
          setMemberPhones(prev => ({ ...prev, [guestName]: "" }));
        }
      } else if (decisionText.toLowerCase().includes("remove")) {
        updatedExpenses.forEach(exp => {
          if (exp.paid_by_name && exp.paid_by_name.toLowerCase() === guestName.toLowerCase()) {
            exp.paid_by_name = "";
          }
          if (exp.participants_names) {
            exp.participants_names = exp.participants_names.filter(p => p.toLowerCase() !== guestName.toLowerCase());
          }
          if (exp.share_amounts) {
            delete exp.share_amounts[guestName];
            Object.keys(exp.share_amounts).forEach(k => {
              if (k.toLowerCase() === guestName.toLowerCase()) {
                delete exp.share_amounts![k];
              }
            });
          }
        });
      }
    }
    // 8. Zero Amount
    else if (anomaly.type === "zero_amount") {
      if (decisionText.toLowerCase().includes("remove") && expIdx !== -1) {
        updatedExpenses.splice(expIdx, 1);
      }
    }
    // 9. High Precision
    else if (anomaly.type === "high_precision") {
      if (decisionText.toLowerCase().includes("round") && expIdx !== -1) {
        const val = updatedExpenses[expIdx].amount;
        updatedExpenses[expIdx].amount = Math.round(val * 100) / 100;
        if (updatedExpenses[expIdx].share_amounts) {
          const sh = updatedExpenses[expIdx].share_amounts!;
          Object.keys(sh).forEach(k => {
            sh[k] = Math.round(sh[k] * 100) / 100;
          });
        }
      }
    }
    // 10. Inconsistent Split Type
    else if (anomaly.type === "inconsistent_split_type") {
      if (expIdx !== -1) {
        if (decisionText.toLowerCase().includes("equally")) {
          updatedExpenses[expIdx].split_type = "equal";
          updatedExpenses[expIdx].share_amounts = {};
        } else {
          updatedExpenses[expIdx].split_type = "exact";
        }
      }
    }
    // 11. Split Conflict
    else if (anomaly.type === "split_conflict") {
      if (decisionText.toLowerCase().includes("auto") && expIdx !== -1) {
        const exp = updatedExpenses[expIdx];
        if (exp.share_amounts) {
          const names = Object.keys(exp.share_amounts);
          if (names.length > 0) {
            const equalShare = Math.round((exp.amount / names.length) * 100) / 100;
            let sumShares = 0;
            names.forEach(k => {
              exp.share_amounts![k] = equalShare;
              sumShares += equalShare;
            });
            const diff = Math.round((exp.amount - sumShares) * 100) / 100;
            if (diff !== 0) {
              exp.share_amounts![names[0]] = Math.round((exp.share_amounts![names[0]] + diff) * 100) / 100;
            }
          }
        }
      }
    }
    // 12. Multiple Currencies
    else if (anomaly.type === "multiple_currencies") {
      if (decisionText.toLowerCase().includes("convert")) {
        updatedExpenses.forEach(exp => {
          if (exp.currency && exp.currency !== "INR") {
            const rate = exp.currency === "USD" ? 83 : (exp.currency === "EUR" ? 90 : 1.0);
            exp.amount = Math.round(exp.amount * rate * 100) / 100;
            if (exp.share_amounts) {
              Object.keys(exp.share_amounts).forEach(k => {
                exp.share_amounts![k] = Math.round(exp.share_amounts![k] * rate * 100) / 100;
              });
            }
            exp.currency = "INR";
          }
        });
      }
    }
    // 13. Member Left Group / Join Violation
    else if (anomaly.type === "member_left_group" || anomaly.type === "member_join_violation") {
      if (decisionText.toLowerCase().includes("remove") && expIdx !== -1) {
        const name = anomaly.data.name;
        updatedExpenses[expIdx].participants_names = updatedExpenses[expIdx].participants_names.filter(
          p => p.toLowerCase() !== name.toLowerCase()
        );
        if (updatedExpenses[expIdx].share_amounts) {
          delete updatedExpenses[expIdx].share_amounts![name];
          Object.keys(updatedExpenses[expIdx].share_amounts!).forEach(k => {
            if (k.toLowerCase() === name.toLowerCase()) {
              delete updatedExpenses[expIdx].share_amounts![k];
            }
          });
        }
      }
    }

    setParsedExpenses(updatedExpenses);

    const updatedAnomalies = [...anomalies];
    updatedAnomalies[activeAnomalyIdx] = {
      ...updatedAnomalies[activeAnomalyIdx],
      resolved: true,
      decision: decisionText
    };
    setAnomalies(updatedAnomalies);
    setStep("anomalies-dashboard");
    setActiveAnomalyIdx(null);
  };

  const handleDownloadReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Description,Amount,Paid By,Participants,Status\n"
      + anomalies.map(a => `${a.data.expense_date || '12-06-2026'},${a.expenseName},${Math.abs(a.data.amount || 1000)},${a.data.paid_by_name || 'Sourav'},"${a.data.participants_names?.join(';') || 'Sourav'}",Resolved (${a.decision || 'Auto-adjusted'})`).join("\n");
    
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
      const activeUserName = currentUser?.first_name || currentUser?.username || "Sourav";
      
      // Build the member list (other members) with their user-entered phone numbers
      const otherMembers = groupMembers
        .filter(m => m.toLowerCase() !== activeUserName.toLowerCase())
        .map(m => ({
          name: m,
          phone: memberPhones[m] || ""
        }));

      const expensesPayload = parsedExpenses.map(exp => {
        const paidByPhone = memberPhones[exp.paid_by_name] || "";
        const participantsPhones = exp.participants_names
          .map(name => memberPhones[name])
          .filter(Boolean);

        return {
          description: exp.description,
          amount: exp.amount,
          expense_date: exp.expense_date,
          currency: exp.currency,
          paid_by_name: exp.paid_by_name,
          paid_by_phone: paidByPhone,
          split_type: exp.split_type,
          participants_phones: participantsPhones,
          participants_names: exp.participants_names,
          share_amounts: exp.share_amounts
        };
      });

      const result = await apiFetch("/expenses/bulk_import/", {
        method: "POST",
        body: JSON.stringify({
          group_name: groupName || `Historical Import - ${fileName || "CSV"}`,
          members: otherMembers,
          expenses: expensesPayload
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
              <div className="mt-6 w-full max-w-sm space-y-2 text-left">
                <Label htmlFor="group-name" className="font-semibold text-gray-850">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Goa Trip"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="bg-white rounded-xl"
                />
                <div className="mt-4 p-3 bg-green-50 text-[#114b30] text-xs font-semibold rounded-xl flex items-center gap-2 border border-green-200">
                  <Check size={14} /> Selected File: {fileName}
                </div>
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

          {/* STEP 2: DETECT MEMBERS & PHONES */}
      {step === "detect-members" && (
        <Card className="rounded-3xl shadow-sm bg-white border border-gray-100">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <UserPlus className="text-primary" /> Confirm Group Members & Phone Numbers
            </CardTitle>
            <CardDescription>
              Verify the group members extracted from the first row of your CSV. You must enter a phone number for each member to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-500 tracking-wider">GROUP MEMBERS & PHONE NUMBERS</div>
              <div className="space-y-3">
                {groupMembers.map((member, idx) => {
                  const activeUserName = currentUser?.first_name || currentUser?.username || "Sourav";
                  const isCreator = member.toLowerCase() === activeUserName.toLowerCase();
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 border p-4 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-[10px] border border-green-200">
                          ✓
                        </span>
                        <div>
                          <span className="font-bold text-sm text-gray-800">{member}</span>
                          {isCreator && <span className="ml-2 text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">You (Creator)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-72">
                        <Label htmlFor={`phone-${member}`} className="text-xs text-muted-foreground shrink-0">
                          Phone <span className="text-red-500">*</span>:
                        </Label>
                        <Input
                          id={`phone-${member}`}
                          placeholder={isCreator ? (currentUser?.username || "Your number") : "Required (e.g. 9876543210)"}
                          value={memberPhones[member] || ""}
                          disabled={isCreator}
                          onChange={(e) => {
                            setMemberPhones({
                              ...memberPhones,
                              [member]: e.target.value
                            });
                          }}
                          className="bg-white rounded-xl h-9 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between border-t pt-6">
              <Button variant="ghost" onClick={() => setStep("upload")} className="flex items-center gap-1">
                <ArrowLeft size={16} /> Back
              </Button>
              <Button 
                onClick={() => setStep("anomalies-dashboard")} 
                disabled={groupMembers.some(m => !memberPhones[m]?.trim())}
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
              <Button variant="ghost" onClick={() => setStep("detect-members")} className="flex items-center gap-1">
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

            {/* ZERO AMOUNT EXPENSE */}
            {anomalies[activeAnomalyIdx].type === "zero_amount" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center">
                  <p className="text-sm text-yellow-800 font-medium">This expense has a zero amount (₹0). It will not affect balances.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Kept zero-amount record")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Keep Record
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Removed zero-amount record")} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                    Remove Record
                  </Button>
                </div>
              </div>
            )}

            {/* HIGH PRECISION AMOUNT */}
            {anomalies[activeAnomalyIdx].type === "high_precision" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center">
                  <p className="text-sm text-yellow-800 font-medium">This amount has high decimal precision: {anomalies[activeAnomalyIdx].data.amount}. Actual currencies only support up to 2 decimal places.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Rounded to 2 decimal places")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Round to 2 Decimals
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Kept original value")} variant="outline" className="flex-1 border-gray-300">
                    Keep Original
                  </Button>
                </div>
              </div>
            )}

            {/* INCONSISTENT SPLIT TYPE */}
            {anomalies[activeAnomalyIdx].type === "inconsistent_split_type" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center">
                  <p className="text-sm text-yellow-800 font-medium">Split type is declared as 'equal', but custom details are specified.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Ignored custom shares, split equally")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Split Equally
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Converted split type to custom/exact")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Use Custom Shares
                  </Button>
                </div>
              </div>
            )}

            {/* AMBIGUOUS DATE */}
            {anomalies[activeAnomalyIdx].type === "ambiguous_date" && (
              <div className="space-y-4">
                <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-2xl text-center">
                  <p className="text-sm text-yellow-800 font-medium">Ambiguous date format: {anomalies[activeAnomalyIdx].data.original_date || anomalies[activeAnomalyIdx].data.expense_date}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={() => applyAnomalyResolution("Parsed as DD-MM-YYYY")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Interpret as DD-MM-YYYY
                  </Button>
                  <Button onClick={() => applyAnomalyResolution("Parsed as MM-DD-YYYY")} className="flex-1 bg-[#114b30] hover:bg-[#155436] text-white">
                    Interpret as MM-DD-YYYY
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
                <div className="text-3xl font-extrabold text-[#114b30]">{parsedExpenses.length}</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Expenses</div>
              </div>
              <div className="bg-gray-50 border p-5 rounded-2xl shadow-sm">
                <div className="text-3xl font-extrabold text-amber-500">{anomalies.length}</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Anomalies</div>
              </div>
              <div className="bg-gray-50 border p-5 rounded-2xl shadow-sm">
                <div className="text-3xl font-extrabold text-green-500">{totalResolved}</div>
                <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Resolved</div>
              </div>
            </div>

            <div className="bg-green-50/50 border border-green-200 p-5 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg border border-green-200 shrink-0">
                ✓
              </div>
              <div>
                <span className="font-bold text-green-800 text-base">Ready To Import</span>
                <p className="text-sm text-green-700 mt-0.5">All {anomalies.length} detected anomalies were successfully resolved with specific decisions.</p>
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
