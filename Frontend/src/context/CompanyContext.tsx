import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import {
  getCompanies,
  type Company,
} from "../services/companyService";

const SELECTED_COMPANY_KEY =
  "aakam_hrms_selected_company_id";

interface CompanyContextValue {
  companies: Company[];
  selectedCompanyId: number | null;
  selectedCompany: Company | null;
  loading: boolean;
  error: string;
  setSelectedCompanyId: (
    companyId: number | null,
  ) => void;
  refreshCompanies: () => Promise<void>;
  clearCompanyContext: () => void;
}

const CompanyContext =
  createContext<CompanyContextValue | undefined>(
    undefined,
  );

export function CompanyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { roles } = useAuth();

  const isSuperAdministrator =
    roles?.includes("SUPER_ADMINISTRATOR") ?? false;

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [selectedCompanyId, setSelectedCompanyIdState] =
    useState<number | null>(() => {
      const stored = localStorage.getItem(
        SELECTED_COMPANY_KEY,
      );

      if (!stored) {
        return null;
      }

      const parsed = Number(stored);

      return Number.isFinite(parsed)
        ? parsed
        : null;
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const clearCompanyContext =
    useCallback(() => {
      localStorage.removeItem(
        SELECTED_COMPANY_KEY,
      );

      setSelectedCompanyIdState(null);
    }, []);

  const setSelectedCompanyId =
    useCallback(
      (companyId: number | null) => {
        if (companyId === null) {
          localStorage.removeItem(
            SELECTED_COMPANY_KEY,
          );

          setSelectedCompanyIdState(null);
          return;
        }

        const numericCompanyId =
          Number(companyId);

        if (
          !Number.isFinite(
            numericCompanyId,
          )
        ) {
          return;
        }

        localStorage.setItem(
          SELECTED_COMPANY_KEY,
          String(numericCompanyId),
        );

        setSelectedCompanyIdState(
          numericCompanyId,
        );
      },
      [],
    );

  const refreshCompanies =
    useCallback(async () => {
      if (!isSuperAdministrator) {
        setCompanies([]);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data =
          await getCompanies();

        setCompanies(data);

        /*
         * If there is already a selected company,
         * make sure it still exists.
         */
        const storedCompanyExists =
          selectedCompanyId !== null &&
          data.some(
            (company) =>
              company.id ===
              selectedCompanyId,
          );

        if (
          !storedCompanyExists
        ) {
          /*
           * If there is only one company,
           * automatically select it.
           *
           * This is convenient for the current
           * Aakam HRMS setup while still allowing
           * multiple companies later.
           */
          if (data.length === 1) {
            const onlyCompany =
              data[0];

            localStorage.setItem(
              SELECTED_COMPANY_KEY,
              String(
                onlyCompany.id,
              ),
            );

            setSelectedCompanyIdState(
              onlyCompany.id,
            );
          } else {
            localStorage.removeItem(
              SELECTED_COMPANY_KEY,
            );

            setSelectedCompanyIdState(
              null,
            );
          }
        }
      } catch (requestError) {
        console.error(
          "Failed to load companies:",
          requestError,
        );

        setError(
          "Unable to load companies.",
        );
      } finally {
        setLoading(false);
      }
    }, [
      isSuperAdministrator,
      selectedCompanyId,
    ]);

  useEffect(() => {
    if (!isSuperAdministrator) {
      clearCompanyContext();
      setCompanies([]);
      setError("");
      return;
    }

    void refreshCompanies();
  }, [
    isSuperAdministrator,
    refreshCompanies,
    clearCompanyContext,
  ]);

  const selectedCompany =
    companies.find(
      (company) =>
        company.id ===
        selectedCompanyId,
    ) ?? null;

  const value =
    useMemo<CompanyContextValue>(
      () => ({
        companies,
        selectedCompanyId,
        selectedCompany,
        loading,
        error,
        setSelectedCompanyId,
        refreshCompanies,
        clearCompanyContext,
      }),
      [
        companies,
        selectedCompanyId,
        selectedCompany,
        loading,
        error,
        setSelectedCompanyId,
        refreshCompanies,
        clearCompanyContext,
      ],
    );

  return (
    <CompanyContext.Provider
      value={value}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context =
    useContext(CompanyContext);

  if (!context) {
    throw new Error(
      "useCompany must be used inside CompanyProvider.",
    );
  }

  return context;
}