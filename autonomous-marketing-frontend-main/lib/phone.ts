export function normalizePhone(value: string, country = ""): string {
  let phone = value.trim().replace(/[\s().-]/g, "");
  if (/^\d{10}$/.test(phone) && /^(india|in)$/i.test(country.trim())) phone = `+91${phone}`;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Enter a valid mobile number with country code, e.g. +919876543210.");
  return phone;
}
