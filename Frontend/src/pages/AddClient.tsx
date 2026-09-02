import {
  ArrowLeft,
  Building2,
  CheckCircle2,
} from "lucide-react";

import { useState } from "react";

import type { FormEvent } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  ClientForm,
  emptyClientForm,
} from "../components/clients/ClientForm";

import {
  createClient,
  type CreateClientPayload,
} from "../services/clientService";

function AddClient() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState<CreateClientPayload>(
      emptyClientForm,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (!form.clientCode.trim()) {
      return setError(
        "Client Code is required.",
      );
    }

    if (!form.clientName.trim()) {
      return setError(
        "Client Name is required.",
      );
    }

    if (
      form.email &&
      !/^\S+@\S+\.\S+$/.test(
        form.email,
      )
    ) {
      return setError(
        "Please enter a valid email address.",
      );
    }

    try {
      setLoading(true);

      await createClient({
        ...form,
        clientCode:
          form.clientCode.trim(),
        clientName:
          form.clientName.trim(),
      });

      setSuccess(
        "Client created successfully.",
      );

      window.setTimeout(() => {
        navigate("/clients");
      }, 700);
    } catch {
      setError(
        "Unable to create client. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">

        {/* =====================================================
            BACK TO CLIENT DIRECTORY
        ===================================================== */}

        <div>
          <Link
            to="/clients"
            className="
              inline-flex
              w-fit
              items-center
              gap-2.5
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-900
              shadow-sm
              transition-all
              duration-200
              hover:border-slate-400
              hover:bg-slate-50
              hover:shadow-md
            "
          >
            <ArrowLeft
              size={19}
              strokeWidth={2.2}
            />

            Back to Client Directory
          </Link>
        </div>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="flex items-center gap-3">

          <Building2
            size={22}
            className="text-teal-700"
          />

          <div>
            <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
              Add Client
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Create a client record for your organization.
            </p>
          </div>

        </div>

        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {success && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">

            <CheckCircle2
              size={18}
            />

            {success}

          </div>
        )}

        {/* =====================================================
            CLIENT FORM
        ===================================================== */}

        <ClientForm
          value={form}
          loading={loading}
          error={error}
          submitLabel="Create Client"
          onChange={setForm}
          onSubmit={submit}
        />

      </div>
    </DashboardLayout>
  );
}

export default AddClient;