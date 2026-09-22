import api from "./api";
import { isAxiosError } from "axios";

export type ClientStatus =
  | "ACTIVE"
  | "INACTIVE";

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

export type UpdateClientPayload =
  CreateClientPayload;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export const getClients = async (): Promise<
  Client[]
> => {
  const response =
    await api.get<ApiResponse<Client[]>>(
      "/clients",
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Unable to load clients.",
    );
  }

  return response.data.data;
};

export const getClient = async (
  id: number | string,
): Promise<Client> => {
  const response =
    await api.get<ApiResponse<Client>>(
      `/clients/${id}`,
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Unable to load client.",
    );
  }

  return response.data.data;
};

export const createClient = async (
  payload: CreateClientPayload,
): Promise<Client> => {
  const response =
    await api.post<ApiResponse<Client>>(
      "/clients",
      payload,
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Unable to create client.",
    );
  }

  return response.data.data;
};

export const updateClient = async (
  id: number | string,
  payload: UpdateClientPayload,
): Promise<Client> => {
  const response =
    await api.put<ApiResponse<Client>>(
      `/clients/${id}`,
      payload,
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Unable to update client.",
    );
  }

  return response.data.data;
};

export const deleteClient = async (
  id: number | string,
): Promise<void> => {
  const response =
    await api.delete<ApiResponse<null>>(
      `/clients/${id}`,
    );

  if (!response.data.success) {
    throw new Error(
      response.data.message ||
        "Unable to delete client.",
    );
  }
};

export const getClientErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (isAxiosError(error)) {
    const message =
      error.response?.data?.message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }

    if (error.response?.status === 404) {
      return "Client not found.";
    }

    if (error.response?.status === 409) {
      return "A client with this client code already exists.";
    }
  }

  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
};