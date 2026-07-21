import { ContactData } from "../types/contactUs";

/**
 * Always posts to the same-origin Next.js API route.
 * Avoids broken absolute NEXT_PUBLIC_API_URL values on Vercel.
 */
export const createContact = async (data: ContactData) => {
  const response = await fetch("/api/contact/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  let result: { success?: boolean; message?: string; data?: unknown } = {};
  try {
    result = await response.json();
  } catch {
    result = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    const error = new Error(result.message || "Failed to submit contact form") as Error & {
      response: { data: typeof result; status: number };
    };
    error.response = { data: result, status: response.status };
    throw error;
  }

  return result;
};

export const getContacts = async () => {
  const response = await fetch("/api/contact/health");
  return response.json();
};

export const getContactById = async (_id: string) => {
  throw new Error("Not implemented on this deployment");
};

export const deleteContact = async (_id: string) => {
  throw new Error("Not implemented on this deployment");
};

export const updateContact = async (_id: string, _data: ContactData) => {
  throw new Error("Not implemented on this deployment");
};
