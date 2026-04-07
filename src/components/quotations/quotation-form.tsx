"use client";

import { useMemo, useState } from "react";
import { createQuotationAction } from "@/lib/actions/quotations";
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

type LeadOption = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type CustomerOption = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type QuotationItem = {
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
};

type QuotationFormProps = {
  leads: LeadOption[];
  customers: CustomerOption[];
  prefilledLeadId?: string;
  prefilledCustomerId?: string;
};

export function QuotationForm({
  leads,
  customers,
  prefilledLeadId = "",
  prefilledCustomerId = "",
}: QuotationFormProps) {
  const [leadId, setLeadId] = useState(prefilledLeadId);
  const [customerId, setCustomerId] = useState(prefilledCustomerId);

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [items, setItems] = useState<QuotationItem[]>([
    {
      item_name: "",
      description: "",
      quantity: 1,
      unit_price: 0,
    },
  ]);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === leadId),
    [leadId, leads]
  );

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId),
    [customerId, customers]
  );

  function applySelectedRecord(type: "lead" | "customer", id: string) {
    if (type === "lead") {
      setLeadId(id);
      setCustomerId("");

      const lead = leads.find((item) => item.id === id);
      if (!lead) return;

      setCompanyName(lead.company_name ?? "");
      setContactPerson(lead.contact_person ?? "");
      setEmail(lead.email ?? "");
      setPhone(lead.phone ?? "");
      setAddress(lead.address ?? "");
      return;
    }

    setCustomerId(id);
    setLeadId("");

    const customer = customers.find((item) => item.id === id);
    if (!customer) return;

    setCompanyName(customer.company_name ?? "");
    setContactPerson(customer.contact_person ?? "");
    setEmail(customer.email ?? "");
    setPhone(customer.phone ?? "");
    setAddress(customer.address ?? "");
  }

  function updateItem(
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        item_name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Quotation</CardTitle>
        <CardDescription>
          Build a quotation with line items and totals.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={createQuotationAction as any} className="space-y-6">
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(items)}
            readOnly
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead_id">Lead</Label>
              <select
                id="lead_id"
                name="lead_id"
                value={leadId}
                onChange={(e) => applySelectedRecord("lead", e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">No linked lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <select
                id="customer_id"
                name="customer_id"
                value={customerId}
                onChange={(e) => applySelectedRecord("customer", e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">No linked customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input id="valid_until" name="valid_until" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" name="discount" type="number" defaultValue="0" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax">Tax</Label>
              <Input id="tax" name="tax" type="number" defaultValue="0" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Quotation Items</h3>
              <Button type="button" variant="outline" onClick={addItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-12"
              >
                <div className="space-y-2 md:col-span-3">
                  <Label>Item Name</Label>
                  <Input
                    value={item.item_name}
                    onChange={(e) => updateItem(index, "item_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-3">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", Number(e.target.value))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(index, "unit_price", Number(e.target.value))
                    }
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <span className="font-medium">Subtotal:</span> {subtotal.toLocaleString()}
            </div>
          </div>

          <Button type="submit">Create Quotation</Button>
        </form>
      </CardContent>
    </Card>
  );
}