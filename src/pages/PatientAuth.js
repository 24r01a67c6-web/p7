import { supabase } from "../lib/supabase";

export const normalizePatientPhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
};

export const registerPatientAccount = async (payload) => {
  const { data, error } = await supabase.rpc("register_patient_account", {
    p_name: payload.name,
    p_age: Number(payload.age),
    p_gender: payload.gender || "Male",
    p_phone: normalizePatientPhone(payload.phone),
    p_password: payload.password,
    p_language: payload.language || "en",
    p_department: payload.department || "General Medicine",
    p_identity_type: "new_patient",
  });
  if (error) throw error;
  if (!data) throw new Error("Account could not be created.");
  return data;
};

export const loginPatientAccount = async (phone, password) => {
  const { data, error } = await supabase.rpc("login_patient_account", {
    p_phone: normalizePatientPhone(phone),
    p_password: password,
  });
  if (error) throw error;
  if (!data?.session_token) throw new Error("Invalid phone number or password.");
  return data;
};
