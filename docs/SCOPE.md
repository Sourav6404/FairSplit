1) Duplicate Expense 
    row(5&6  Dinner at Marina Bites,dinner-marina bites)
    ->problem :- duplicate expence with same amount, payer , data and other people.
      ->solution :- * Flag (when all data are maching withe previce data the flage , and pop up to change the name , cross check the data like date , payer,amount ,discription, other people).
                    * Require user review.

2) Inconsistent Member Name
   Ex:- Priya,priya,Priya S
    ->problem :-Same person represented with diffrent names.
      ->solution:- normalize names.

3) Amount Stored As string
   row:(1,200)
    ->problem:- contains comma formatting.
      ->solution:-convert to numeric.

4) High Precision
   row:(899.995)
    ->more than two decimal.
      ->Round to 2 decimal places using standard financial rounding.

5) Missing Payer
    roe:(House cleaning supplies)
    ->problem:-paid_by is empty.
      ->solution:- * Import with warning.
                   * Mark payer as unknown.

6) Settlement Recorded As expence
    row:(Rohan paid aisha back)
     ->problem:- looks like settlement instead of expense.
       ->solution:- convert to settlement transaction.

7) Missing Currency
    row:(15 March)
     ->problem:-currency missing.
       ->solution:-*Infer currency from nearby records if confidence is high.
                   *Otherwise mark currency as UNKNOWN.
                   *Flag for user review.

8) Negative amount
   Row:Parasailing refund
    ->problem:-Negative amount.
      ->solution:-*Treat as refund transaction.
                  *Adjust balances accordingly.
                  *Record decision in import report.

9) Ambiguous Date
    Row:04-05-2026
     ->problem:-Could be Aprile 5 or may 4.
      ->solution:-*Flag(ask the user to reacheck).
                  *Analyse from the previce dates.

10) Invalid date format
    row(Mar-14)
     ->problem:-Diffrent date format.
       ->solution:- Normalize during import.

11) member left Group
    row:(Meera moved out)
     ->problem:-later expenses or expenses befor meera left ,or date of mera left may diffrent still expenses include meera.
       ->solution:- flage,review from user.

12) new member added
    row:(Sam appears later)
     ->problem:- member changed over time.
       ->solution:-Track member history.

13) Unkown guest
    row(Dev's friend kabir)
     ->problem:-Temporary participant not in group.
       ->Solution:- create Guest participant.
14) Percentage Split Validation
    row(pizza friday)
     ->problem:-Precentages must total 100%.
       ->solution:-validate before import.

15) Split Type Diffrent
    row(Furniture for common room)
     ->problem:-diffrent types of split methods.
       ->solution:-*Validate the methode(did total adding giving the amount).
                   *Flage as well.

16) conflicting duplicate expense
    row(two record has same description,date,and participants but diffrent payer or amount)
      ->problem:- The record appear to represent the same expense but contain conflicting informations.
        ->solution:-*flag.
                    *User review.

17) Amount is invalid
    row(amount is zero)
     ->problem:- Expense amount is zero and does not affect balances.May indicate placeholder data, cancelled transaction, or data entry error.
       ->solution:-*Flage.
                   *User review and approve it.

18) Split method error
    row(split metod is equal but used share)
    ->problem:- method mention in the splite type is diffrent than the methode used.
      ->solution:-*Validate that split_details match the declared split_type.
                  *If mismatch exists, flag record.
                  *Do not automatically correct the data.
                  *Require user review.

19) Split amount mismatch
    row(total amount and spite deataile is diffrent)
     ->problem:-The sum of individual shares does not match the total expense amount.
       ->solution:-*Validate share total before import.
                   *Flag record if totals do not match.
                   *Require user review.