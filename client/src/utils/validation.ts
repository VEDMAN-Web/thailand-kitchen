import { ContactData } from "../types/contactUs";

const lettersOnlyPattern = /^[\p{L}\s'.-]+$/u;

export const validateContact = (data: ContactData) => {
  const errors: Partial<Record<keyof ContactData, string>> = {};
  const email = data.email.trim();
  const phone = data.phoneNumber.trim();
  const whatsapp = data.whatsappNumber.trim();

  if (!data.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (!lettersOnlyPattern.test(data.fullName.trim())) {
    errors.fullName = "Full name must contain only letters";
  }

  const hasAnyContact = Boolean(email || phone || whatsapp);

  if (!hasAnyContact) {
    errors.email = "Please provide at least email or phone number";
    errors.phoneNumber = "Please provide at least email or phone number";
  } else if (
    email &&
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
  ) {
    errors.email = "Invalid email address";
  }

  if (phone && !/^\+?[0-9]+$/.test(phone)) {
    errors.phoneNumber = "Phone number must contain only numbers";
  }

  if (whatsapp && !/^\+?[0-9]+$/.test(whatsapp)) {
    errors.whatsappNumber = "WhatsApp number must contain only numbers";
  }

  if (!data.cityName.trim()) {
    errors.cityName = "City is required";
  } else if (!lettersOnlyPattern.test(data.cityName.trim())) {
    errors.cityName = "City must contain only letters";
  }

  if (!data.countryName.trim()) {
    errors.countryName = "Country is required";
  } else if (!lettersOnlyPattern.test(data.countryName.trim())) {
    errors.countryName = "Country must contain only letters";
  }

  if (!data.message.trim()) {
    errors.message = "Please enter your message.";
  } else if (data.message.length < 20) {
    errors.message =
      "Message must be at least 20 characters.";
  }

  return errors;
};