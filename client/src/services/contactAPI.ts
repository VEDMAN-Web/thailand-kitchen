import { ContactData } from "../types/contactUs";
import api from "./api"

export const createContact = async (data: ContactData) => {
  const response = await api.post("/contact/post", data);
  return response.data;
};


export const getContacts = async () => {
  const response = await api.get("/contact/get");
  return response.data;
};


export const getContactById = async (id: string) => {
  const response = await api.get(`/contact/getByID/${id}`);
  return response.data;
}


export const deleteContact = async (id: string) => {
  const response = await api.delete(`/contact/delete/${id}`);
  return response.data;
};


export const updateContact = async (id: string, data: ContactData) => {
  const response = await api.put(`/contact/put/${id}`, data);
  return response.data;
};