import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  ClientForm,
  emptyClientForm,
  toClientPayload,
} from "../components/clients/ClientForm";
import {
  getClient,
  updateClient,
  type Client,
  type CreateClientPayload,
} from "../services/clientService";

function EditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateClientPayload>(emptyClientForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    if (!id) {
      setError("Invalid client ID.");
      setLoading(false);
      return;
    }
    getClient(id)
      .then((client: Client) => setForm(toClientPayload(client)))
      .catch(() => setError("Unable to load client."))
      .finally(() => setLoading(false));
  }, [id]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.clientCode.trim()) return setError("Client Code is required.");
    if (!form.clientName.trim()) return setError("Client Name is required.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return setError("Please enter a valid email address.");
    if (!id) return;
    try {
      setSaving(true);
      await updateClient(id, {
        ...form,
        clientCode: form.clientCode.trim(),
        clientName: form.clientName.trim(),
      });
      setSuccess("Client updated successfully.");
      window.setTimeout(() => navigate(`/clients/${id}`), 700);
    } catch {
      setError("Unable to update client. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/clients"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to clients"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-teal-700" />
            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Edit Client
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Update the client contact and organization details.
              </p>
            </div>
          </div>
        </div>
        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}
        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading client...
          </section>
        ) : (
          <ClientForm
            value={form}
            loading={saving}
            error={error}
            submitLabel="Update Client"
            onChange={setForm}
            onSubmit={submit}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
export default EditClient;
