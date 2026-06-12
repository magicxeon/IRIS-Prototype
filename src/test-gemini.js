const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
  console.log("=== เริ่มการทดสอบ Gemini API Connection Healthcheck ===");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.error("❌ ล้มเหลว: ไม่พบ GEMINI_API_KEY ที่ถูกต้องในไฟล์ .env");
    console.log("กรุณาเปิดไฟล์ .env และแทนที่ 'your_gemini_api_key_here' ด้วย Google Gemini API Key จริงของคุณ");
    return;
  }

  console.log(`ดึงคีย์สำเร็จ: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log("กำลังเชื่อมต่อกับ Gemini API (ใช้โมเดล gemini-2.5-flash)...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent("Hello, respond with 'Connected successfully' if you receive this message.");
    const responseText = result.response.text();

    console.log("\n💬 การตอบสนองจาก Gemini API:");
    console.log(responseText.trim());
    console.log("\n✅ สำเร็จ: การเชื่อมต่อกับ Gemini API สำเร็จ คีย์ถูกต้องและพร้อมใช้งาน!");
  } catch (error) {
    console.error("\n❌ ล้มเหลว: ไม่สามารถเชื่อมต่อกับ Gemini API ได้");
    console.error("รายละเอียดข้อผิดพลาด:", error.message);
  }

  console.log("=== เสร็จสิ้นการทดสอบ ===");
}

testGemini().catch(console.error);
