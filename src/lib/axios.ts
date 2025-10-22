import axios, { AxiosError } from "axios";
import { BASE_URL, DEFAULT_ERROR_MESSAGE } from "./constants";
import { toast } from "sonner";

const instance = axios.create({
  timeout: 4000 * 1000,
  baseURL: BASE_URL,
  headers: { Accept: "application/json" },
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const e: any = error?.response?.data;
    switch (error?.response?.status) {
      case 400:
      case 422:
      case 500:
      case 503:
      case 504:
      case 404:
        if (Array.isArray(e.detail)) {
          e.detail.forEach((obj: any) => {
            toast.error(obj?.msg, { duration: 5 * 1000 });
          });
        } else {
          toast.error(
            e?.detail?.length > 100
              ? `${e?.detail?.slice(0, 100)}...`
              : e?.detail,
            { duration: 5 * 1000 },
          );
        }
        break;
      default:
        console.log(DEFAULT_ERROR_MESSAGE);
        break;
    }
    return Promise.reject(error.response);
  },
);

export default instance;
