import axios from "axios";

export type ClientStatus = "ACTIVE" | "INACTIVE";

export interface Client {
  id: number;
  clientCode: string;
  clientName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  clientCode: string;
  clientName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  status: ClientStatus;
}

export type UpdateClientPayload = CreateClientPayload;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

const API_URL = "http://localhost:5000/api/clients";

export const getClients = async (): Promise<Client[]> => {
  const response = await axios.get<ApiResponse<Client[]>>(API_URL);

  if (!response.data.success) {
    throw new Error(response.data.message || "Unable to load clients.");
  }

  return response.data.data;
};

export const getClient = async (
  id: number | string,
): Promise<Client> => {
  const response = await axios.get<ApiResponse<Client>>(
    `${API_URL}/${id}`,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Unable to load client.");
  }

  return response.data.data;
};

export const createClient = async (
  payload: CreateClientPayload,
): Promise<Client> => {
  const response = await axios.post<ApiResponse<Client>>(
    API_URL,
    payload,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Unable to create client.");
  }

  return response.data.data;
};

export const updateClient = async (
  id: number | string,
  payload: UpdateClientPayload,
): Promise<Client> => {
  const response = await axios.put<ApiResponse<Client>>(
    `${API_URL}/${id}`,
    payload,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Unable to update client.");
  }

  return response.data.data;
};

export const deleteClient = async (
  id: number | string,
): Promise<void> => {
  const response = await axios.delete<ApiResponse<null>>(
    `${API_URL}/${id}`,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || "Unable to delete client.");
  }
};

export const getClientErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response?.status === 404) {
      return "Client not found.";
    }

    if (error.response?.status === 409) {
      return "A client with this client code already exists.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};