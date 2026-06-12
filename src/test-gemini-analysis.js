const fs = require('fs');
const path = require('path');
const { readDocxText } = require('./gemini-controller');
const { cleanExtractedText } = require('./utils');
require('dotenv').config();

// ตั้งค่าพาธไฟล์ทดสอบ
const testDocxPath = path.join(__dirname, '../Documents/ProductSpecification-FutureShield99V2.docx');

async function runTests() {
  console.log("========================================================");
  console.log("🧪 เริ่มการทดสอบโมดูลสกัดวิเคราะห์ด้วย Gemini AI");
  console.log("========================================================");

  console.log("\n[Test 1] กำลังทดสอบถอดข้อความจากไฟล์ Word (.docx)...");
  console.log(`พาธไฟล์: ${testDocxPath}`);

  if (!fs.existsSync(testDocxPath)) {
    console.error("❌ ล้มเหลว: ไม่พบไฟล์ทดสอบกรุณาตรวจสอบโฟลเดอร์ Documents");
    return;
  }

  // ดึงข้อความและทำความสะอาด
  const rawText = readDocxText(testDocxPath);
  const text = cleanExtractedText(rawText);

  if (text && text.length > 0) {
    console.log("✅ สำเร็จ: ถอดข้อความจากไฟล์ Word สำเร็จ!");
    console.log(`ความยาวข้อความ: ${text.length} ตัวอักษร`);
    console.log("ตัวอย่างเนื้อหา 300 ตัวแรก:");
    console.log("--------------------------------------------------------");
    console.log(text.substring(0, 300) + "...");
    console.log("--------------------------------------------------------");
  } else {
    console.error("❌ ล้มเหลว: ไม่พบข้อความหรือข้อผิดพลาดในการแกะซิป");
    return;
  }

  console.log("\n[Test 2] ตรวจสอบสิทธิ์และการเชื่อมต่อ Gemini API...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error("❌ ล้มเหลว: ไม่พบ GEMINI_API_KEY ที่ถูกต้องในไฟล์ .env");
    return;
  }
  console.log("✅ พบคีย์เชื่อมต่อสำเร็จ");

  console.log("\n[Test 3] กำลังจำลองสกัดวิเคราะห์หัวข้อ 'landingPage' จากไฟล์จริง...");
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // อัปเดตชื่อโมเดลเป็นรุ่นปัจจุบันที่เสถียรที่สุด
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        // หากอัปเดต SDK เป็นเวอร์ชันล่าสุดแล้ว สามารถใส่ responseMimeType ได้
        // แต่ถ้ายังพบ Error 400 ให้คอมเมนต์บรรทัดด้านล่างนี้ทิ้งไป AI ก็ยังตอบเป็น JSON ได้จาก Prompt
        responseMimeType: "application/json",
        temperature: 0.1
      },
      systemInstruction: "คุณคือ Senior Insurance Business Analyst ที่มีความเชี่ยวชาญในการวิเคราะห์สเปกผลิตภัณฑ์ประกันชีวิต หน้าที่ของคุณคือการสกัดข้อมูล Marketing & Product Identity ของประกันชีวิตนี้ให้ตรงตามรายละเอียดข้อกำหนด"
    });

    const userPrompt = `--- BEGIN DOCUMENT CONTENT (productSpec) ---\n${text}\n--- END DOCUMENT CONTENT (productSpec) ---\n\nค้นหาข้อมูลในเอกสาร Product Specification เพื่อตอบสนองความต้องการต่อไปนี้:
1. "productName": ชื่อผลิตภัณฑ์ทางการค้าหลักของประกันชีวิตนี้
2. "tagline": คำสโลแกนประชาสัมพันธ์การขายสั้นๆ
3. "keyBenefits": สรุปจุดเด่นที่เป็นประโยชน์สำคัญของประกันชีวิตนี้มาอย่างน้อย 3 ข้อหลัก ระบุหัวข้อเด่น (title) และคำอธิบายสั้นๆ (description) 

โครสร้างผลลัพธ์ JSON ที่กำหนด:
{
  "productName": "string",
  "tagline": "string",
  "keyBenefits": [
    { "title": "string", "description": "string" }
  ]
}

กรุณาตอบกลับเฉพาะข้อมูล JSON เท่านั้น ห้ามใส่คำอธิบายเพิ่มเติมใดๆ นอกเหนือจาก JSON`;

    console.log("กำลังส่งคำขอไปยัง Gemini...");
    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    let cleanedJSON = responseText.trim();
    if (cleanedJSON.startsWith('```')) {
      cleanedJSON = cleanedJSON.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    }

    console.log("✅ ได้รับข้อมูลตอบกลับสำเร็จ!");
    console.log("\n💬 ข้อมูล JSON ที่สกัดได้:");
    console.log(JSON.stringify(JSON.parse(cleanedJSON), null, 2));
    console.log("\n🎉 สำเร็จเสร็จสิ้นการทดสอบทุกข้อประมวลผลการวิเคราะห์!");
  } catch (error) {
    console.error("❌ ล้มเหลว: ระหว่างจำลองการสกัดวิเคราะห์");
    console.error("รายละเอียดข้อผิดพลาด:", error.message);
  }
}

runTests().catch(console.error);