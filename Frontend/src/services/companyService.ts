import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/**
 * |--------------------------------------------------------------------------
 * | Company
 * |--------------------------------------------------------------------------
 */

export interface Company {
  id: number;
  companyCode: string;
  legalName: string;
  displayName: string | null;
  registrationNumber: string | null;
  pan: string | null;
  tan: string | null;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  financialYearStart: string | null;
  payrollFrequency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * |--------------------------------------------------------------------------
 * | Payload
 * |--------------------------------------------------------------------------
 */

export interface CompanyPayload {
  companyCode: string;
  legalName: string;
  displayName?: string;
  registrationNumber?: string;
  pan?: string;
  tan?: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  financialYearStart?: string;
  payrollFrequency: string;
  status: string;
}

/**
 * |--------------------------------------------------------------------------
 * | API Response
 * |--------------------------------------------------------------------------
 */

interface CompanyResponse {
  success: boolean;
  data: Company;
  message?: string;
}

interface CompaniesResponse {
  success: boolean;
  data: Company[];
  message?: string;
}

/**
 * |--------------------------------------------------------------------------
 * | Get Companies
 * |--------------------------------------------------------------------------
 */

export const getCompanies =
  async (): Promise<Company[]> => {
    const response =
      await axios.get<CompaniesResponse>(
        `${API_URL}/companies`,
      );

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | Get Company By ID
 * |--------------------------------------------------------------------------
 */

export const getCompanyById =
  async (
    companyId: number | string,
  ): Promise<Company> => {
    const response =
      await axios.get<CompanyResponse>(
        `${API_URL}/companies/${companyId}`,
      );

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | Create Company
 * |--------------------------------------------------------------------------
 */

export const createCompany =
  async (
    payload: CompanyPayload,
  ): Promise<Company> => {
    const response =
      await axios.post<CompanyResponse>(
        `${API_URL}/companies`,
        payload,
      );

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | Update Company
 * |--------------------------------------------------------------------------
 */

export const updateCompany =
  async (
    companyId: number | string,
    payload: CompanyPayload,
  ): Promise<Company> => {
    const response =
      await axios.put<CompanyResponse>(
        `${API_URL}/companies/${companyId}`,
        payload,
      );

    return response.data.data;
  };

/**
 * |--------------------------------------------------------------------------
 * | Delete Company
 * |--------------------------------------------------------------------------
 */

export const deleteCompany =
  async (
    companyId: number | string,
  ): Promise<void> => {
    await axios.delete(
      `${API_URL}/companies/${companyId}`,
    );
  };