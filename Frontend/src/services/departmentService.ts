import axios from "axios";

const API_URL = "http://localhost:5000/api";

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
| Payload
|--------------------------------------------------------------------------
*/

export interface DepartmentPayload {
  name: string;
  code: string;
}

/*
|--------------------------------------------------------------------------
| API Response
|--------------------------------------------------------------------------
*/

interface DepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

interface DepartmentsResponse {
  success: boolean;
  data: {
    departments: Department[];
    total: number;
  };
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
    await axios.get<DepartmentsResponse>(
      `${API_URL}/departments`,
    );

  return response.data.data.departments;
};

/*
|--------------------------------------------------------------------------
| Get Department By ID
|--------------------------------------------------------------------------
*/

export const getDepartmentById = async (
  departmentId: number | string,
): Promise<Department> => {
  const response =
    await axios.get<DepartmentResponse>(
      `${API_URL}/departments/${departmentId}`,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Create Department
|--------------------------------------------------------------------------
*/

export const createDepartment = async (
  payload: DepartmentPayload,
): Promise<Department> => {
  const response =
    await axios.post<DepartmentResponse>(
      `${API_URL}/departments`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Update Department
|--------------------------------------------------------------------------
*/

export const updateDepartment = async (
  departmentId: number | string,
  payload: DepartmentPayload,
): Promise<Department> => {
  const response =
    await axios.put<DepartmentResponse>(
      `${API_URL}/departments/${departmentId}`,
      payload,
    );

  return response.data.data;
};