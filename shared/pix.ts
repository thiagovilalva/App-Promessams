export const PIX_KEY = "15760349000107";
export const PIX_MERCHANT = "CONVENCAO SUL MS";
export const PIX_CITY = "CAMPO GRANDE";

function field(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload(amount?: number) {
  const merchantAccount = field("00", "BR.GOV.BCB.PIX") + field("01", PIX_KEY);
  const additionalData = field("05", "***");
  const base = [
    field("00", "01"),
    field("26", merchantAccount),
    field("52", "0000"),
    field("53", "986"),
    amount && amount > 0 ? field("54", amount.toFixed(2)) : "",
    field("58", "BR"),
    field("59", PIX_MERCHANT),
    field("60", PIX_CITY),
    field("62", additionalData),
  ].join("");
  return `${base}6304${crc16(`${base}6304`)}`;
}
