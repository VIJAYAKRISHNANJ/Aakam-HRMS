import axios from "axios";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/*
|--------------------------------------------------------------------------
| Branch
|--------------------------------------------------------------------------
*/

export interface Branch {
  id: number;
  companyId: number;
  companyCode: string;
  companyName: string;
  branchCode: string;
  branchName: string;
  location: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/*
|--------------------------------------------------------------------------
| Company
|--------------------------------------------------------------------------
|
| Companies available for branch selection.
|--------------------------------------------------------------------------
*/

export interface BranchCompany {
  id: number;
  companyCode: string;
  displayName: string;
  legalName: string;
}

/*
|--------------------------------------------------------------------------
| Branch Directory Data
|--------------------------------------------------------------------------
*/

export interface BranchDirectoryData {
  branches: Branch[];
  total: number;
  companies: BranchCompany[];
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

interface BranchDirectoryResponse {
  success: boolean;
  data: BranchDirectoryData;
  message?: string;
}

interface BranchResponse {
  success: boolean;
  data: Branch;
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

export interface BranchFilters {
  search?: string;
  companyId?: string;
  status?: string;
}

/*
|--------------------------------------------------------------------------
| Create Branch Payload
|--------------------------------------------------------------------------
*/

export interface CreateBranchPayload {
  companyId: number;
  branchCode: string;
  branchName: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
}

/*
|--------------------------------------------------------------------------
| Update Branch Payload
|--------------------------------------------------------------------------
*/

export interface UpdateBranchPayload {
  companyId: number;
  branchCode: string;
  branchName: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  status: string;
}

/*
|--------------------------------------------------------------------------
| GET Branches
|--------------------------------------------------------------------------
| GET /api/branches
|--------------------------------------------------------------------------
*/

export const getBranches = async (
  filters: BranchFilters = {},
): Promise<BranchDirectoryData> => {
  const response =
    await axios.get<BranchDirectoryResponse>(
      `${API_URL}/branches`,
      {
        params: {
          search:
            filters.search ||
            undefined,

          companyId:
            filters.companyId ||
            undefined,

          status:
            filters.status ||
            undefined,
        },
      },
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| GET Branch By ID
|--------------------------------------------------------------------------
| GET /api/branches/:id
|--------------------------------------------------------------------------
*/

export const getBranchById = async (
  branchId: number | string,
): Promise<Branch> => {
  const response =
    await axios.get<BranchResponse>(
      `${API_URL}/branches/${branchId}`,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| CREATE Branch
|--------------------------------------------------------------------------
| POST /api/branches
|--------------------------------------------------------------------------
*/

export const createBranch = async (
  payload: CreateBranchPayload,
): Promise<Branch> => {
  const response =
    await axios.post<BranchResponse>(
      `${API_URL}/branches`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| UPDATE Branch
|--------------------------------------------------------------------------
| PUT /api/branches/:id
|--------------------------------------------------------------------------
*/

export const updateBranch = async (
  branchId: number | string,
  payload: UpdateBranchPayload,
): Promise<Branch> => {
  const response =
    await axios.put<BranchResponse>(
      `${API_URL}/branches/${branchId}`,
      payload,
    );

  return response.data.data;
};