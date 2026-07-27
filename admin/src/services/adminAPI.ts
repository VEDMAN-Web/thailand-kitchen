import axios from "axios";

const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:5000/api";
const baseURL = raw.replace(/\/+$/, "") || "http://localhost:5000/api";

export type SiteId = "thailand-kitchen" | "varsovia-kitchen";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
};

export type SiteInfo = {
  id: SiteId;
  name: string;
  enabled: boolean;
};

const adminApi = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 12000,
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export async function adminLogin(email: string, password: string) {
  const { data } = await adminApi.post("/auth/login", { email, password });
  return data as { success: boolean; token: string; user: AdminUser };
}

export async function adminMe() {
  const { data } = await adminApi.get("/auth/me");
  return data as { success: boolean; user: AdminUser };
}

export async function listSites() {
  const { data } = await adminApi.get("/cms/sites");
  return data as { success: boolean; sites: SiteInfo[] };
}

export async function getHome(siteId: SiteId) {
  const { data } = await adminApi.get(`/cms/${siteId}/home`);
  return data as { success: boolean; home: { sections: Record<string, unknown> } };
}

export async function updateHome(siteId: SiteId, sections: Record<string, unknown>) {
  const { data } = await adminApi.put(`/cms/${siteId}/home`, { sections });
  return data;
}

export async function resetHome(siteId: SiteId) {
  const { data } = await adminApi.post(`/cms/${siteId}/home/reset`);
  return data;
}

export type CategoryItem = {
  _id: string;
  title: string;
  description: string;
  image: string;
};

export async function listCategories(siteId: SiteId) {
  const { data } = await adminApi.get(`/cms/${siteId}/categories`);
  return data as { success: boolean; items: CategoryItem[] };
}

export async function createCategory(
  siteId: SiteId,
  body: { title: string; description?: string; image?: string }
) {
  const { data } = await adminApi.post(`/cms/${siteId}/categories`, body);
  return data;
}

export async function updateCategory(
  siteId: SiteId,
  id: string,
  body: { title: string; description?: string; image?: string }
) {
  const { data } = await adminApi.put(`/cms/${siteId}/categories/${id}`, body);
  return data;
}

export async function deleteCategory(siteId: SiteId, id: string) {
  const { data } = await adminApi.delete(`/cms/${siteId}/categories/${id}`);
  return data;
}

export type ProductItem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  category: string;
  featured: boolean;
};

export async function listProducts(siteId: SiteId) {
  const { data } = await adminApi.get(`/cms/${siteId}/products`);
  return data as { success: boolean; items: ProductItem[] };
}

export async function createProduct(siteId: SiteId, body: Partial<ProductItem>) {
  const { data } = await adminApi.post(`/cms/${siteId}/products`, body);
  return data;
}

export async function updateProduct(
  siteId: SiteId,
  id: string,
  body: Partial<ProductItem>
) {
  const { data } = await adminApi.put(`/cms/${siteId}/products/${id}`, body);
  return data;
}

export async function deleteProduct(siteId: SiteId, id: string) {
  const { data } = await adminApi.delete(`/cms/${siteId}/products/${id}`);
  return data;
}

export type BlogItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  published: boolean;
};

export async function listBlogs(siteId: SiteId) {
  const { data } = await adminApi.get(`/cms/${siteId}/blogs`);
  return data as { success: boolean; items: BlogItem[] };
}

export async function createBlog(siteId: SiteId, body: Partial<BlogItem>) {
  const { data } = await adminApi.post(`/cms/${siteId}/blogs`, body);
  return data;
}

export async function updateBlog(siteId: SiteId, id: string, body: Partial<BlogItem>) {
  const { data } = await adminApi.put(`/cms/${siteId}/blogs/${id}`, body);
  return data;
}

export async function deleteBlog(siteId: SiteId, id: string) {
  const { data } = await adminApi.delete(`/cms/${siteId}/blogs/${id}`);
  return data;
}

export type LegalPage = {
  _id: string;
  title: string;
  content: string;
  type: string;
};

export async function getLegal(siteId: SiteId, type: "privacy" | "terms") {
  const { data } = await adminApi.get(`/cms/${siteId}/legal/${type}`);
  return data as { success: boolean; page: LegalPage };
}

export async function updateLegal(
  siteId: SiteId,
  type: "privacy" | "terms",
  body: { title: string; content: string }
) {
  const { data } = await adminApi.put(`/cms/${siteId}/legal/${type}`, body);
  return data;
}

export async function listUsers() {
  const { data } = await adminApi.get("/auth/users");
  return data as { success: boolean; users: AdminUser[] };
}

export async function createUser(body: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const { data } = await adminApi.post("/auth/users", body);
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await adminApi.delete(`/auth/users/${id}`);
  return data;
}

export type ContactLead = {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  cityName: string;
  countryName: string;
  message: string;
  createdAt?: string;
};

export async function listContacts() {
  const { data } = await adminApi.get("/contact/get");
  return data as { success: boolean; count: number; data: ContactLead[] };
}

export async function deleteContact(id: string) {
  const { data } = await adminApi.delete(`/contact/delete/${id}`);
  return data;
}

export default adminApi;
