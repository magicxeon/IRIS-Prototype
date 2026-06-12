/**
 * ฟังก์ชันทำความสะอาดข้อความจาก Word หรือไฟล์ข้อความธรรมดา
 * ป้องกันปัญหา Unicode control characters หรือ Zero-width characters ที่ส่งผลให้ Gemini API คืนค่า Error 400
 */
function cleanExtractedText(text) {
  if (!text) return '';
  return text
    // ลบ Zero-width characters และ BOM ที่ตาเปล่ามองไม่เห็น
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // ลบ Control characters (แต่เก็บ \n, \r, \t ไว้)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // รวบช่องว่างที่ติดกันเกินไปให้เหลือช่องเดียว (เว้นวรรค)
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

module.exports = {
  cleanExtractedText
};
