import api from "./api";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL = "/";

/*
|--------------------------------------------------------------------------
| Department
|--------------------------------------------------------------------------
*/

export interface Department {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  employeeCount: number;
}

/*
|--------------------------------------------------------------------------
| Department Payload
|--------------------------------------------------------------------------
*/

export interface DepartmentPayload {
  name: string;
  code: string;
}

/*
|--------------------------------------------------------------------------
| Department Directory
|--------------------------------------------------------------------------
*/

interface DepartmentDirectoryData {
  departments: Department[];
  total: number;
}

interface DepartmentDirectoryResponse {
  success: boolean;
  data: DepartmentDirectoryData;
  message?: string;
}

/*
|--------------------------------------------------------------------------
| Get Departments
|--------------------------------------------------------------------------
*/

export const getDepartments = async (): Promise<
  Department[]
> => {
  const response =
    await api.get<DepartmentDirectoryResponse>(
      `${API_URL}departments`,
    );

  return response.data.data.departments;
};

/*
|--------------------------------------------------------------------------
| Get Department By ID
|--------------------------------------------------------------------------
*/

interface DepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export const getDepartmentById = async (
  departmentId: number | string,
): Promise<Department> => {
  const response =
    await api.get<DepartmentResponse>(
      `${API_URL}departments/${departmentId}`,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Create Department
|--------------------------------------------------------------------------
*/

interface CreateDepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export const createDepartment = async (
  payload: DepartmentPayload,
): Promise<Department> => {
  const response =
    await api.post<CreateDepartmentResponse>(
      `${API_URL}departments`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Update Department
|--------------------------------------------------------------------------
*/

interface UpdateDepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

export const updateDepartment = async (
  departmentId: number | string,
  payload: DepartmentPayload,
): Promise<Department> => {
  const response =
    await api.put<UpdateDepartmentResponse>(
      `${API_URL}departments/${departmentId}`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Delete Department
|--------------------------------------------------------------------------
*/

export const deleteDepartment = async (
  departmentId: number | string,
): Promise<void> => {
  await api.delete(
    `${API_URL}departments/${departmentId}`,
  );
};