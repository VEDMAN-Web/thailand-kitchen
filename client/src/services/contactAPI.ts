import { ContactData } from "../types/contactUs";

function getApiBase() {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "/api";
  return raw.replace(/\/+$/, "") || "/api";
}

async function postJson(path: string, data: ContactData) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  let result: { success?: boolean; message?: string; data?: unknown; errors?: unknown } =
    {};
  try {
    result = await response.json();
  } catch {
    result = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    const message =
      result.message ||
      (Array.isArray(result.errors) && result.errors[0]
        ? String(
            (result.errors[0] as { msg?: string }).msg ||
              JSON.stringify(result.errors[0])
          )
        : "Failed to submit contact form");

    const error = new Error(message) as Error & {
      response: { data: typeof result; status: number };
    };
    error.response = { data: result, status: response.status };
    throw error;
  }

  return result;
}

/** Submit contact — uses NEXT_PUBLIC_API_URL (Vercel backend) or local /api */
export const createContact = async (data: ContactData) => {
  return postJson("/contact/post", data);
};

export const getContacts = async () => {
  return { ok: true, apiBase: getApiBase() };
};

export const getContactById = async (_id: string) => {
  throw new Error("Not implemented");
};

export const deleteContact = async (_id: string) => {
  throw new Error("Not implemented");
};

export const updateContact = async (_id: string, _data: ContactData) => {
  throw new Error("Not implemented");
};
