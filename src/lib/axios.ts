import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL, DEFAULT_ERROR_MESSAGE } from "./constants";
import { toast } from "sonner";
import { supabase } from "@/lib/database";

type ApiErrorEnvelope = {
  code: string;
  message: string;
  details?: string;
  request_id?: string;
};

const toApiErrorEnvelope = (
  payload: unknown,
  status?: number,
): ApiErrorEnvelope => {
  const asRecord =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const nestedError =
    asRecord.error && typeof asRecord.error === "object"
      ? (asRecord.error as Record<string, unknown>)
      : undefined;

  const source = nestedError ?? asRecord;
  const fallbackByStatus =
    status === 500 || status === 503 || status === 504
      ? "The LLM service is currently down or unavailable. Please try again later."
      : DEFAULT_ERROR_MESSAGE;

  return {
    code:
      (typeof source.code === "string" && source.code.trim()) ||
      "unknown_error",
    message:
      (typeof source.message === "string" && source.message.trim()) ||
      (typeof asRecord.detail === "string" && asRecord.detail.trim()) ||
      (typeof asRecord.message === "string" && asRecord.message.trim()) ||
      fallbackByStatus,
    details: typeof source.details === "string" ? source.details : undefined,
    request_id:
      (typeof source.request_id === "string" && source.request_id.trim()) ||
      (typeof asRecord.request_id === "string" && asRecord.request_id.trim()) ||
      undefined,
  };
};

const instance = axios.create({
  timeout: 4000 * 1000,
  baseURL: BASE_URL,
  headers: { Accept: "application/json" },
});

instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const e: any = error?.response?.data;
    const status = error?.response?.status;
    const envelope = toApiErrorEnvelope(e, status);

    switch (status) {
      case 400:
      case 422:
      case 500:
      case 503:
      case 504:
      case 404:
        if (Array.isArray(e?.detail)) {
          e.detail.forEach((obj: any) => {
            toast.error(obj?.msg || DEFAULT_ERROR_MESSAGE, {
              duration: 5 * 1000,
            });
          });
        } else {
          toast.error(
            envelope.message.length > 100
              ? `${envelope.message.slice(0, 100)}...`
              : envelope.message,
            { duration: 5 * 1000 },
          );
        }
        break;
      default:
        toast.error(DEFAULT_ERROR_MESSAGE, { duration: 5 * 1000 });
        break;
    }

    if (error.response) {
      const responseData =
        e && typeof e === "object"
          ? {
              ...e,
              error: envelope,
              message: envelope.message,
              detail: e.detail ?? envelope.message,
              request_id: envelope.request_id,
            }
          : {
              error: envelope,
              message: envelope.message,
              detail: envelope.message,
              request_id: envelope.request_id,
            };

      return Promise.reject({
        ...error.response,
        data: responseData,
      });
    }

    return Promise.reject({
      status,
      data: {
        error: envelope,
        message: envelope.message,
        detail: envelope.message,
        request_id: envelope.request_id,
      },
    });
  },
);

export default instance;
