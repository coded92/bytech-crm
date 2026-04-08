import { createExpenseAction } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ExpenseForm() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Expense</CardTitle>
        <CardDescription>
          Record company spending like repair materials, fuel, salaries, and utilities.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={createExpenseAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Expense Title</Label>
              <Input id="title" name="title" placeholder="e.g. Wire purchase for POS repair" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                defaultValue="operations"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="operations">Operations</option>
                <option value="salaries">Salaries</option>
                <option value="transport">Transport</option>
                <option value="marketing">Marketing</option>
                <option value="utilities">Utilities</option>
                <option value="repair_materials">Repair Materials</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense_date">Expense Date</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                defaultValue={today}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" placeholder="Optional details about this expense" />
            </div>
          </div>

          <Button type="submit">Save Expense</Button>
        </form>
      </CardContent>
    </Card>
  );
}