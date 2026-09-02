import {
  ArrowLeft,
  Building2,
  CheckCircle2,
} from "lucide-react";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  ClientForm,
  emptyClientForm,
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

  const [form, setForm] =
    useState<CreateClientPayload>(emptyClientForm);

  const [client, setClient] =
    useState<Client | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid client ID.");
      setLoading(false);
      return;
    }

    getClient(id)
      .then((data) => {
        setClient(data);

        setForm({
          clientCode: data.clientCode ?? "",
          clientName: data.clientName ?? "",
          contactPerson: data.contactPerson ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          country: data.country ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          status: data.status ?? "ACTIVE",
        });
      })
      .catch(() => {
        setError("Unable to load client details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!id) {
      setError("Invalid client ID.");
      return;
    }

    if (!form.clientCode.trim()) {
      setError("Client Code is required.");
      return;
    }

    if (!form.clientName.trim()) {
      setError("Client Name is required.");
      return;
    }

    if (
      form.email &&
      !/^\S+@\S+\.\S+$/.test(form.email)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSaving(true);

      await updateClient(id, {
        ...form,
        clientCode: form.clientCode.trim(),
        clientName: form.clientName.trim(),
      });

      setSuccess("Client updated successfully.");

      window.setTimeout(() => {
        navigate(`/clients/${id}`);
      }, 700);
    } catch {
      setError(
        "Unable to update client. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col items-start gap-4">
            <Link
              to={id ? `/clients/${id}` : "/clients"}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={17} />
              Back to Client Profile
            </Link>

            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Edit Client
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Update the client contact and organization
                details.
              </p>
            </div>
          </div>

          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading client...
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex flex-col items-start gap-4">
          {/* BACK BUTTON */}

          <Link
            to={
              id
                ? `/clients/${id}`
                : "/clients"
            }
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back to Client Profile
          </Link>

          {/* TITLE */}

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <Building2
                  size={21}
                  className="text-teal-700"
                />
              </div>

              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Edit Client
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-600">
              Update the client contact and organization
              details.
            </p>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            SUCCESS
        ===================================================== */}

        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* =====================================================
            CLIENT FORM
        ===================================================== */}

        {client && (
          <ClientForm
            value={form}
            loading={saving}
            error=""
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