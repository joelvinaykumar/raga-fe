import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL, DEFAULT_ERROR_MESSAGE } from "./constants";
import { toast } from "sonner";
import { supabase } from "@/lib/database";

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
          let message =
            typeof e?.detail === "string" && e?.detail?.trim()
              ? e.detail
              : typeof e?.message === "string" && e?.message?.trim()
                ? e.message
                : null;

          if (!message) {
            if (status === 500 || status === 503 || status === 504) {
              message =
                "The LLM service is currently down or unavailable. Please try again later.";
            } else {
              message = DEFAULT_ERROR_MESSAGE;
            }
          }

          toast.error(
            message.length > 100 ? `${message.slice(0, 100)}...` : message,
            { duration: 5 * 1000 },
          );
        }
        break;
      default:
        toast.error(DEFAULT_ERROR_MESSAGE, { duration: 5 * 1000 });
        break;
    }
    return Promise.reject(error.response);
  },
);

export default instance;
