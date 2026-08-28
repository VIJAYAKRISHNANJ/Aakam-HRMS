import { ArrowLeft, Building2, Edit, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import type { Client, ClientStatus } from "../services/clientService";
import { getClient } from "../services/clientService";

const valueOrDash = (value: string | null) => value || "-";
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};
function ClientProfile() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) {
      setError("Invalid client ID.");
      setLoading(false);
      return;
    }
    getClient(id)
      .then(setClient)
      .catch(() => setError("Unable to load client profile."))
      .finally(() => setLoading(false));
  }, [id]);
  const badge = (status: ClientStatus) => (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
    >
      {status}
    </span>
  );
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            to="/clients"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            aria-label="Back to clients"
          >
            <ArrowLeft size={17} />
          </Link>
          <span className="text-sm text-slate-500">Client profile</span>
        </div>
        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading client...
          </section>
        ) : error || !client ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Client not found."}
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                  <Building2 size={22} className="text-teal-700" />
                </div>
                <div>
                  <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                    {client.clientName}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {client.clientCode}{" "}
                    <span className="mx-1 text-slate-300">•</span>{" "}
                    {badge(client.status)}
                  </p>
                </div>
              </div>
              <Link
                to={`/clients/edit/${client.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <Edit size={16} />
                Edit Client
              </Link>
            </section>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Contact information
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div className="flex gap-3">
                    <Mail size={18} className="mt-0.5 shrink-0 text-teal-700" />
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {valueOrDash(client.email)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Phone
                      size={18}
                      className="mt-0.5 shrink-0 text-teal-700"
                    />
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {valueOrDash(client.phone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:col-span-2">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-teal-700"
                    />
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {valueOrDash(client.address)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Location
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">City</dt>
                    <dd className="font-medium text-slate-800">
                      {valueOrDash(client.city)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">State</dt>
                    <dd className="font-medium text-slate-800">
                      {valueOrDash(client.state)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Country</dt>
                    <dd className="font-medium text-slate-800">
                      {client.country}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-900">
                Record details
              </h2>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Created date</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {formatDate(client.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Updated date</dt>
                  <dd className="mt-1 font-medium text-slate-800">
                    {formatDate(client.updatedAt)}
                  </dd>
                </div>
              </dl>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
export default ClientProfile;
