import axios from "axios";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL =
  `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}`;

/*
|--------------------------------------------------------------------------
| Employee
|--------------------------------------------------------------------------
*/

export interface Employee {
  id: number;

  employeeCode: string;

  firstName: string;

  lastName: string | null;

  fullName: string;

  email: string;

  designation: string;

  departmentId: number | null;

  department: string;

  systemRole: string;

  joiningDate: string;

  status: string;

  employmentType: string;

  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| Department
|--------------------------------------------------------------------------
*/

export interface WorkforceDepartment {
  id: number;

  name: string;

  code: string;
}

/*
|--------------------------------------------------------------------------
| Employee Directory
|--------------------------------------------------------------------------
*/

export interface EmployeeDirectoryData {
  employees: Employee[];

  total: number;

  departments: WorkforceDepartment[];
}

interface EmployeeDirectoryResponse {
  success: boolean;

  data: EmployeeDirectoryData;
}

export interface EmployeeDirectoryFilters {
  search?: string;

  departmentId?: string;

  status?: string;
}

/*
|--------------------------------------------------------------------------
| Get Employees
|--------------------------------------------------------------------------
*/

export const getEmployees = async (
  filters: EmployeeDirectoryFilters = {},
): Promise<EmployeeDirectoryData> => {
  const response =
    await axios.get<EmployeeDirectoryResponse>(
      `${API_URL}/employees`,
      {
        params: {
          search:
            filters.search ||
            undefined,

          departmentId:
            filters.departmentId ||
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
| Get Employee Profile
|--------------------------------------------------------------------------
*/

interface EmployeeProfileResponse {
  success: boolean;

  data: Employee;
}

export const getEmployeeById = async (
  employeeId: number | string,
): Promise<Employee> => {
  const response =
    await axios.get<EmployeeProfileResponse>(
      `${API_URL}/employees/${employeeId}`,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Create Employee
|--------------------------------------------------------------------------
*/

export interface CreateEmployeePayload {
  employeeCode: string;

  firstName: string;

  lastName?: string;

  email: string;

  designation: string;

  departmentId: number;

  joiningDate: string;

  employmentStatus: string;

  employmentType: string;
}

interface CreateEmployeeResponse {
  success: boolean;

  data: Employee;

  message?: string;
}

export const createEmployee = async (
  payload: CreateEmployeePayload,
): Promise<Employee> => {
  const response =
    await axios.post<CreateEmployeeResponse>(
      `${API_URL}/employees`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Update Employee
|--------------------------------------------------------------------------
*/

export interface UpdateEmployeePayload {
  employeeCode: string;

  firstName: string;

  lastName?: string;

  email: string;

  designation: string;

  departmentId: number;

  joiningDate: string;

  employmentStatus: string;

  employmentType: string;
}

interface UpdateEmployeeResponse {
  success: boolean;

  data: Employee;

  message?: string;
}

export const updateEmployee = async (
  employeeId: number | string,
  payload: UpdateEmployeePayload,
): Promise<Employee> => {
  const response =
    await axios.put<UpdateEmployeeResponse>(
      `${API_URL}/employees/${employeeId}`,
      payload,
    );

  return response.data.data;
};

/*
|--------------------------------------------------------------------------
| Delete Employee
|--------------------------------------------------------------------------
|
| Connects to:
| DELETE /api/employees/:id
|
| Backend remains responsible for:
| - authorization
| - foreign-key/dependency checks
| - deciding whether deletion is allowed
|--------------------------------------------------------------------------
*/

interface DeleteEmployeeResponse {
  success: boolean;

  message?: string;
}

export const deleteEmployee = async (
  employeeId: number | string,
): Promise<string> => {
  const response =
    await axios.delete<DeleteEmployeeResponse>(
      `${API_URL}/employees/${employeeId}`,
    );

  return (
    response.data.message ||
    "Employee deleted successfully."
  );
};