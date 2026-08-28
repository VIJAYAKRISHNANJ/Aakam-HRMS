import type { ChangeEvent, FormEvent } from "react";
import type {
  ClientStatus,
  CreateClientPayload,
} from "../../services/clientService";

export const emptyClientForm: CreateClientPayload = {
  clientCode: "",
  clientName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  status: "ACTIVE",
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50";

export function ClientFormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function ClientForm({
  value,
  loading,
  error,
  submitLabel,
  onChange,
  onSubmit,
}: {
  value: CreateClientPayload;
  loading: boolean;
  error: string;
  submitLabel: string;
  onChange: (value: CreateClientPayload) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value: fieldValue } = event.target;
    onChange({ ...value, [name]: fieldValue });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-300 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">
          Client Information
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add the client contact and organization details.
        </p>
      </div>
      <form onSubmit={onSubmit} className="p-6">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <ClientFormField label="Client Code" required>
            <input
              className={inputClass}
              name="clientCode"
              value={value.clientCode}
              onChange={handleChange}
              placeholder="e.g. CLT-001"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Client Name" required>
            <input
              className={inputClass}
              name="clientName"
              value={value.clientName}
              onChange={handleChange}
              placeholder="e.g. Northstar Technologies"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Contact Person">
            <input
              className={inputClass}
              name="contactPerson"
              value={value.contactPerson}
              onChange={handleChange}
              placeholder="e.g. Priya Menon"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Email">
            <input
              className={inputClass}
              name="email"
              type="email"
              value={value.email}
              onChange={handleChange}
              placeholder="contact@example.com"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Phone">
            <input
              className={inputClass}
              name="phone"
              value={value.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Country">
            <input
              className={inputClass}
              name="country"
              value={value.country}
              onChange={handleChange}
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Address">
            <textarea
              className={`${inputClass} h-auto min-h-24 py-3`}
              name="address"
              value={value.address}
              onChange={handleChange}
              placeholder="Street address"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="City">
            <input
              className={inputClass}
              name="city"
              value={value.city}
              onChange={handleChange}
              placeholder="e.g. Bengaluru"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="State">
            <input
              className={inputClass}
              name="state"
              value={value.state}
              onChange={handleChange}
              placeholder="e.g. Karnataka"
              disabled={loading}
            />
          </ClientFormField>
          <ClientFormField label="Status" required>
            <select
              className={inputClass}
              name="status"
              value={value.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </ClientFormField>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </section>
  );
}

export function toClientPayload(client: {
  clientCode: string;
  clientName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: ClientStatus;
}): CreateClientPayload {
  return {
    clientCode: client.clientCode,
    clientName: client.clientName,
    contactPerson: client.contactPerson || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    city: client.city || "",
    state: client.state || "",
    country: client.country,
    status: client.status,
  };
}
