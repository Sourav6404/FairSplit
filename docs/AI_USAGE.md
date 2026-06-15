# AI Usage Report

*Note: The vast majority of the frontend and backend codebase was built manually by the developer. AI tools were only utilized in a limited capacity for debugging, integrations, and file organization.*

---

## 1. AI Tools Used
- **Google Gemini & GitHub Copilot** (powering code generation, code navigation, and basic code suggestions).

---

## 2. Key Prompts
- *"link the uploaded csv to detect the anomaly and show the report"*
- *"give the columns heading and also why all the error is same"*
- *"cut all the files inside the fairsplit-frontend to FairSplit inside frontend, change the paths in the code accordingly and delete the file fairsplit-frontend"*

---

## 3. AI Errors and Corrections

### Case 1: Empty Dictionary `max()` Crash
- **The Error**: In `detect_multiple_currencies`, the AI attempted to run a `max()` function on a dictionary that was still empty (before the scanning loop populated it), causing the backend to crash immediately on CSV import.
- **How Caught**: Server logs showed ValueError: `max() arg is an empty sequence` on CSV upload.
- **The Correction**: Moved the `max()` calculation logic to execute after the scanning loop completes.

### Case 2: Out-of-Scope Method Definition in `CurrencyConverter`
- **The Error**: The AI defined `normalize_date()` outside the `CurrencyConverter` class block, causing the instance to fail with `'CurrencyConverter' object has no attribute 'normalize_date'`.
- **How Caught**: CSV uploads failed with a `500 Internal Server Error` and the corresponding traceback was output to the terminal.
- **The Correction**: Relocated `normalize_date()` inside the class block to expose it properly on the class instance.

### Case 3: Over-Triggering Split-Type/Percentage Anomalies
- **The Error**: The AI implemented anomaly detection in a way that ran percentage sum validation (ensuring splits sum to 100) for *every* expense, causing standard equal splits to flag errors.
- **How Caught**: All items in the imported CSV were incorrectly marked with percentage split errors.
- **The Correction**: Added conditional checks to skip percentage split checks for `equal` or empty split types.

### Case 4: JSX Double-Root Parse Error in React
- **The Error**: The AI returned two parallel root elements in `ImportFlow.tsx` instead of a single element wrapper.
- **How Caught**: Vite development server failed to parse the file and printed compile errors: `Expected ',' or ')' but found '{'`.
- **The Correction**: Wrapped the adjacent elements inside a React fragment (`<>...</>`).
