import api from "./api";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL = "/";

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
*/

export interface BranchCompany {
  id: number;
  companyCode: string;
  displayName: string;
  legalName: string;
}

/*
|--------------------------------------------------------------------------
| Branch Directory
|--------------------------------------------------------------------------
*/

export interface BranchDirectoryData {
  branches: Branch[];
  total: number;
  companies: BranchCompany[];
}

interface BranchDirectoryResponse {
  success: boolean;
  data: BranchDirectoryData;
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Branch Filters
|--------------------------------------------------------------------------
*/

export interface BranchFilters {
  search?: string;
  companyId?: string | number;
  status?: string;
}

/*
|--------------------------------------------------------------------------
| Create Branch
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
  status?: string;
}

interface CreateBranchResponse {
  success: boolean;
  data: Branch;
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Update Branch
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
  status?: string;
}

interface UpdateBranchResponse {
  success: boolean;
  data: Branch;
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Get Branches
|--------------------------------------------------------------------------
*/

export const getBranches = async (
  filters: BranchFilters = {},
): Promise<BranchDirectoryData> => {
  const response =
    await api.get<BranchDirectoryResponse>(
      `${API_URL}branches`,
      {
        params: {
          search:
            filters.search || undefined,

          companyId:
            filters.companyId ||
            undefined,

          status:
            filters.status || undefined,
        },
      },
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Get Branch By ID
|--------------------------------------------------------------------------
*/

interface BranchResponse {
  success: boolean;
  data: Branch;
  message?: string;
}

export const getBranchById = async (
  branchId: number | string,
): Promise<Branch> => {
  const response =
    await api.get<BranchResponse>(
      `${API_URL}branches/${branchId}`,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Create Branch
|--------------------------------------------------------------------------
*/

export const createBranch = async (
  payload: CreateBranchPayload,
): Promise<Branch> => {
  const response =
    await api.post<CreateBranchResponse>(
      `${API_URL}branches`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Update Branch
|--------------------------------------------------------------------------
*/

export const updateBranch = async (
  branchId: number | string,
  payload: UpdateBranchPayload,
): Promise<Branch> => {
  const response =
    await api.put<UpdateBranchResponse>(
      `${API_URL}branches/${branchId}`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Delete Branch
|--------------------------------------------------------------------------
*/

export const deleteBranch = async (
  branchId: number | string,
): Promise<void> => {
  await api.delete(
    `${API_URL}branches/${branchId}`,
  );
};