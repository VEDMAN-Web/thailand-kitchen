import axios from "axios";

export type LocaleCode = "en" | "th" | "pl";
export type LocalizedText =
  | string
  | Partial<Record<LocaleCode, string>>;

export type VarsoviaRecord = {
  _id: string;
  [key: string]: unknown;
};

export type VarsoviaResource =
  | "products"
  | "projects"
  | "blogs"
  | "faqs"
  | "testimonials"
  | "catalogues"
  | "showcases"
  | "team-members"
  | "partners"
  | "showrooms";

const VARSOVIA_ADMIN_KEY_STORAGE = "varsovia_admin_key";

// Served by the admin Next route handler outside /api so Thailand rewrites do not intercept it.
const varsoviaApi = axios.create({
  baseURL: "/varsovia-api",
  headers: { "Content-Type": "application/json" },
  timeout: 95000,
});

export function getStoredVarsoviaAdminKey() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(VARSOVIA_ADMIN_KEY_STORAGE)?.trim() || "";
}

export function setStoredVarsoviaAdminKey(key: string) {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(VARSOVIA_ADMIN_KEY_STORAGE, trimmed);
  else localStorage.removeItem(VARSOVIA_ADMIN_KEY_STORAGE);
}

varsoviaApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const adminKey = getStoredVarsoviaAdminKey();
    if (adminKey) config.headers["x-varsovia-admin-key"] = adminKey;
  }
  return config;
});

function readPath(resource: VarsoviaResource) {
  return resource === "team-members" ? "team" : resource;
}

export async function getVarsoviaSite() {
  const { data } = await varsoviaApi.get("/site");
  return data as Record<string, unknown>;
}

export async function updateVarsoviaSite(body: Record<string, unknown>) {
  const { data } = await varsoviaApi.put("/site", body);
  return data;
}

export async function listVarsoviaRecords(resource: VarsoviaResource) {
  const { data } = await varsoviaApi.get(`/${readPath(resource)}`);
  if (Array.isArray(data)) return data as VarsoviaRecord[];
  if (Array.isArray(data?.data)) return data.data as VarsoviaRecord[];
  return [] as VarsoviaRecord[];
}

export async function createVarsoviaRecord(
  resource: VarsoviaResource,
  body: Record<string, unknown>
) {
  const { data } = await varsoviaApi.post(`/${resource}`, body);
  return data;
}

export async function updateVarsoviaRecord(
  resource: VarsoviaResource,
  id: string,
  body: Record<string, unknown>
) {
  const { data } = await varsoviaApi.put(`/${resource}/${id}`, body);
  return data;
}

export async function deleteVarsoviaRecord(
  resource: VarsoviaResource,
  id: string
) {
  const { data } = await varsoviaApi.delete(`/${resource}/${id}`);
  return data;
}

export async function listVarsoviaContacts() {
  const { data } = await varsoviaApi.get("/contacts");
  if (Array.isArray(data)) return data as VarsoviaRecord[];
  if (Array.isArray(data?.data)) return data.data as VarsoviaRecord[];
  return [] as VarsoviaRecord[];
}

export async function updateVarsoviaContactStatus(id: string, status: string) {
  const { data } = await varsoviaApi.patch(`/contacts/${id}`, { status });
  return data;
}

export function localizedValue(
  value: unknown,
  locale: LocaleCode = "en"
) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const localized = value as Partial<Record<LocaleCode, unknown>>;
    const resolved = localized[locale] ?? localized.en;
    return typeof resolved === "string" ? resolved : "";
  }
  return "";
}

export default varsoviaApi;
