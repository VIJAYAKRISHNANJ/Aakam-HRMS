import {
  Building2,
  Edit,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import type {
  Client,
  ClientStatus,
} from "../services/clientService";

import {
  deleteClient,
  getClients,
} from "../services/clientService";

const statusClass = (
  status: ClientStatus,
) =>
  status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-600";

function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] =
    useState<Client[]>([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<"" | ClientStatus>("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [clientToDelete, setClientToDelete] =
    useState<Client | null>(null);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Load Clients
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() =>
        setError(
          "Unable to load clients.",
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter Clients
  |--------------------------------------------------------------------------
  */

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const haystack =
          `${client.clientCode} ${client.clientName} ${
            client.contactPerson ?? ""
          } ${client.email ?? ""}`.toLowerCase();

        return (
          haystack.includes(
            search.toLowerCase(),
          ) &&
          (!status ||
            client.status === status)
        );
      }),
    [clients, search, status],
  );

  /*
  |--------------------------------------------------------------------------
  | Delete Client
  |--------------------------------------------------------------------------
  */

  const removeClient = async () => {
    if (!clientToDelete) {
      return;
    }

    const client = clientToDelete;

    setDeletingId(client.id);
    setActionError("");
    setSuccessMessage("");

    try {
      await deleteClient(client.id);

      setClients((current) =>
        current.filter(
          (item) => item.id !== client.id,
        ),
      );

      setSuccessMessage(
        `${client.clientName} was deleted successfully.`,
      );

      setClientToDelete(null);
    } catch {
      setActionError(
        "Unable to delete client. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Row Navigation
  |--------------------------------------------------------------------------
  */

  const openClientProfile = (
    clientId: number,
  ) => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-start gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">

              <Building2
                size={22}
                className="text-teal-700"
              />

            </div>

            <div>

              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Clients
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Manage your organization clients and contact information.
              </p>

            </div>

          </div>

          <Link
            to="/clients/new"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-teal-700
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              hover:bg-teal-800
            "
          >

            <Plus size={16} />

            Add Client

          </Link>

        </section>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="rounded-xl border border-slate-300 bg-white p-4">

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">

            {/* SEARCH */}

            <div className="relative">

              <Search
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search code, name, contact or email..."
                className="
                  h-10
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  pl-9
                  pr-3
                  text-sm
                  text-slate-800
                  outline-none
                  placeholder:text-slate-400
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
              />

            </div>

            {/* STATUS */}

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | ""
                    | ClientStatus,
                )
              }
              className="
                h-10
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                text-slate-800
                outline-none
                focus:border-teal-600
              "
            >

              <option value="">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>

            </select>

          </div>

        </section>

        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {successMessage && (
          <div className="
            rounded-lg
            border
            border-emerald-200
            bg-emerald-50
            px-4
            py-3
            text-sm
            text-emerald-700
          ">
            {successMessage}
          </div>
        )}

        {/* =====================================================
            ACTION ERROR
        ===================================================== */}

        {actionError && (
          <div className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          ">
            {actionError}
          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (

          <section className="
            rounded-xl
            border
            border-slate-300
            bg-white
            px-6
            py-16
            text-center
          ">

            <Building2
              size={24}
              className="
                mx-auto
                mb-3
                animate-pulse
                text-slate-400
              "
            />

            <p className="text-sm text-slate-500">
              Loading clients...
            </p>

          </section>

        ) : error ? (

          /* =====================================================
             ERROR
          ===================================================== */

          <div className="
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
          ">
            {error}
          </div>

        ) : filteredClients.length === 0 ? (

          /* =====================================================
             EMPTY
          ===================================================== */

          <section className="
            rounded-xl
            border
            border-slate-300
            bg-white
            px-6
            py-16
            text-center
          ">

            <Building2
              size={32}
              className="
                mx-auto
                mb-3
                text-slate-400
              "
            />

            <h2 className="
              text-base
              font-semibold
              text-slate-900
            ">
              No clients found.
            </h2>

            <p className="
              mt-1
              text-sm
              text-slate-500
            ">
              Add a client to begin managing your client records.
            </p>

          </section>

        ) : (

          /* =====================================================
             CLIENT TABLE
          ===================================================== */

          <div className="
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
          ">

            <div className="overflow-x-auto">

              <table className="
                w-full
                min-w-[900px]
                text-left
                text-sm
              ">

                <thead className="
                  border-b
                  border-slate-200
                  bg-slate-50
                  text-xs
                  uppercase
                  tracking-wide
                  text-slate-500
                ">

                  <tr>

                    <th className="px-5 py-3">
                      Client
                    </th>

                    <th className="px-5 py-3">
                      Client Code
                    </th>

                    <th className="px-5 py-3">
                      Contact Person
                    </th>

                    <th className="px-5 py-3">
                      Email
                    </th>

                    <th className="px-5 py-3">
                      Phone
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="
                  divide-y
                  divide-slate-100
                ">

                  {filteredClients.map(
                    (client) => (

                      <tr
                        key={client.id}
                        onClick={() =>
                          openClientProfile(
                            client.id,
                          )
                        }
                        className="
                          cursor-pointer
                          transition-colors
                          hover:bg-slate-50
                        "
                      >

                        {/* CLIENT */}

                        <td className="
                          px-5
                          py-4
                          font-semibold
                          text-slate-800
                        ">
                          {client.clientName}
                        </td>

                        {/* CLIENT CODE */}

                        <td className="
                          px-5
                          py-4
                          font-mono
                          text-xs
                          text-slate-600
                        ">
                          {client.clientCode}
                        </td>

                        {/* CONTACT */}

                        <td className="
                          px-5
                          py-4
                          text-slate-600
                        ">
                          {client.contactPerson ??
                            "-"}
                        </td>

                        {/* EMAIL */}

                        <td className="
                          px-5
                          py-4
                          text-slate-600
                        ">
                          {client.email ??
                            "-"}
                        </td>

                        {/* PHONE */}

                        <td className="
                          px-5
                          py-4
                          text-slate-600
                        ">
                          {client.phone ??
                            "-"}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              ${statusClass(
                                client.status,
                              )}
                            `}
                          >
                            {client.status}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td
                          className="px-5 py-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >

                          <div className="
                            flex
                            justify-end
                            gap-1
                          ">

                            {/* EDIT */}

                            <Link
                              title="Edit"
                              to={`/clients/edit/${client.id}`}
                              className="
                                rounded-md
                                p-2
                                text-slate-500
                                hover:bg-slate-100
                                hover:text-teal-700
                              "
                            >

                              <Edit size={16} />

                            </Link>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete ${client.clientName}`}
                              onClick={() => {
                                setActionError(
                                  "",
                                );

                                setSuccessMessage(
                                  "",
                                );

                                setClientToDelete(
                                  client,
                                );
                              }}
                              disabled={
                                deletingId ===
                                client.id
                              }
                              className="
                                rounded-md
                                p-2
                                text-slate-500
                                hover:bg-rose-50
                                hover:text-rose-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                            >

                              <Trash2 size={16} />

                            </button>

                          </div>

                        </td>

                      </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>

          </div>

        )}

      </div>

      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ===================================================== */}

      {clientToDelete && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-900/50
            px-4
            backdrop-blur-sm
          "
          role="presentation"
          onMouseDown={(event) => {

            if (
              event.target ===
                event.currentTarget &&
              deletingId === null
            ) {
              setClientToDelete(null);
            }

          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-client-title"
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-2xl
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="
              flex
              items-start
              justify-between
              gap-4
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-rose-50
                  text-rose-600
                ">

                  <Trash2 size={21} />

                </div>

                <div>

                  <h2
                    id="delete-client-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Delete Client
                  </h2>

                  <p className="
                    mt-0.5
                    text-xs
                    text-slate-500
                  ">
                    Permanent action
                  </p>

                </div>

              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={() =>
                  setClientToDelete(
                    null,
                  )
                }
                disabled={
                  deletingId !== null
                }
                className="
                  rounded-lg
                  p-2
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                  disabled:opacity-50
                "
              >

                <X size={18} />

              </button>

            </div>

            {/* MODAL MESSAGE */}

            <p className="
              mt-6
              text-sm
              leading-6
              text-slate-600
            ">

              Are you sure you want to delete{" "}

              <span className="
                font-semibold
                text-slate-900
              ">
                {clientToDelete.clientName}
              </span>

              ?

            </p>

            <p className="
              mt-2
              text-sm
              text-slate-500
            ">
              This action cannot be undone. The client will be permanently
              removed from your records.
            </p>

            {/* MODAL ACTIONS */}

            <div className="
              mt-7
              flex
              justify-end
              gap-3
            ">

              <button
                type="button"
                onClick={() =>
                  setClientToDelete(
                    null,
                  )
                }
                disabled={
                  deletingId !== null
                }
                className="
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-slate-50
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={removeClient}
                disabled={
                  deletingId !== null
                }
                className="
                  inline-flex
                  min-w-[100px]
                  items-center
                  justify-center
                  rounded-lg
                  bg-rose-600
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-rose-700
                  disabled:opacity-60
                "
              >

                {deletingId !== null
                  ? "Deleting..."
                  : "Delete"}

              </button>

            </div>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}

export default Clients;