const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const zlib = require('zlib');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { readProjects, writeProjects } = require('./dal');
const { cleanExtractedText } = require('./utils');

// ค้นหา API Key จาก .env
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * ฟังก์ชันแยกข้อความธรรมดาจากไฟล์ Word (.docx) โดยถอด XML word/document.xml จาก ZIP archive
 */
function readDocxText(filePath) {
  try {
    // โหลดไฟล์ .docx (ZIP) ผ่าน adm-zip
    const zip = new AdmZip(filePath);

    // ดึงเฉพาะไฟล์ word/document.xml ที่เก็บเนื้อหา
    const zipEntries = zip.getEntries();
    let documentXmlEntry = zipEntries.find(entry => entry.entryName === 'word/document.xml');

    if (!documentXmlEntry) {
      console.warn(`[DocxReader] ⚠️ ไม่พบไฟล์ word/document.xml ใน: ${filePath}`);
      return '';
    }

    // แตกไฟล์ออกมาเป็น Text โดยตรง (จัดการเรื่อง zlib และ Data Descriptor ให้ในตัว)
    const xmlText = documentXmlEntry.getData().toString('utf8');

    // สกัดเฉพาะข้อความใน <w:t> ออกจาก XML
    const paragraphs = [];
    const paraRegex = /<w:p\b[^>]*>(.*?)<\/w:p>/g;
    let paraMatch;

    while ((paraMatch = paraRegex.exec(xmlText)) !== null) {
      const paraContent = paraMatch[1];
      const tRegex = /<w:t\b[^>]*>(.*?)<\/w:t>/g;
      let tMatch;
      let paraText = '';

      while ((tMatch = tRegex.exec(paraContent)) !== null) {
        paraText += tMatch[1];
      }

      if (paraText.trim()) {
        paragraphs.push(paraText);
      }
    }

    return paragraphs.join('\n');

  } catch (error) {
    console.error(`[DocxReader] ❌ เกิดข้อผิดพลาดในการแยกข้อความ Word:`, error.message);
    return '';
  }
}

/**
 * ฟังก์ชันแปลงไฟล์เป็น Base64 Payload ส่งให้ Gemini API (สำหรับไฟล์ที่ซัพพอร์ตโดยตรง เช่น PDF)
 */
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

/**
 * API Controller สำหรับทดสอบเชื่อมต่อและตรวจสอบคีย์ Gemini API (Healthcheck)
 */
async function testGeminiConnectionController(req, res) {
  console.log(`[Healthcheck API] 🌐 เริ่มทดสอบระบบการเชื่อมต่อ Gemini API...`);

  const currentKey = process.env.GEMINI_API_KEY;
  if (!currentKey || currentKey === 'your_gemini_api_key_here') {
    return res.status(500).json({
      success: false,
      status: "disconnected",
      error: "ไม่พบคีย์ GEMINI_API_KEY ในไฟล์กำหนดสภาพแวดล้อม (.env)"
    });
  }

  try {
    const tempGenAI = new GoogleGenerativeAI(currentKey);
    // ใช้โมเดลขนาดเล็ก gemini-2.5-flash เพื่อทดสอบการเชื่อมต่อ
    const model = tempGenAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("ping");
    const responseText = result.response.text();

    if (responseText) {
      return res.status(200).json({
        success: true,
        status: "connected",
        message: "การเชื่อมต่อกับ Gemini API สำเร็จ คีย์ถูกต้องและพร้อมใช้งาน"
      });
    } else {
      throw new Error("ไม่มีข้อความตอบรับจากโมเดล");
    }
  } catch (error) {
    console.error("[Healthcheck API] ❌ การทดสอบเชื่อมต่อล้มเหลว:", error.message);
    return res.status(502).json({
      success: false,
      status: "disconnected",
      error: `ไม่สามารถเชื่อมต่อเครื่องบริการของ Google ได้: ${error.message}`
    });
  }
}

/**
 * API Controller สำหรับสกัดวิเคราะห์ข้อมูลประกันภัยรายหัวข้อย่อยแบบ Dynamic ผ่าน Schema
 */
async function analyzeSectionController(req, res) {
  const { projectId, sectionType } = req.params;
  console.log(`\n--- [Analyze API] เริ่มประมวลผลหัวข้อ: "${sectionType}" ของโปรเจกต์: "${projectId}" ---`);

  // 1. โหลดโครงสร้างวิเคราะห์แบบ Dynamic จากไฟล์ extraction-schema.json
  let section = null;
  try {
    const schemaPath = path.join(__dirname, '../data/extraction-schema.json');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`ไม่พบไฟล์ schema ที่เส้นทาง: ${schemaPath}`);
    }
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    section = schema.sections.find(s => s.key === sectionType);
  } catch (schemaErr) {
    console.error(`[Analyze API] ❌ ข้อผิดพลาดในการอ่าน schema:`, schemaErr.message);
    return res.status(500).json({
      success: false,
      message: `ไม่สามารถโหลดการตั้งค่าการสกัดวิเคราะห์ได้: ${schemaErr.message}`
    });
  }

  if (!section) {
    console.error(`[Analyze API] ❌ ข้อผิดพลาด: sectionType="${sectionType}" ไม่พบนิยามใน schema`);
    return res.status(400).json({
      success: false,
      message: "ประเภทหัวข้อการสกัดวิเคราะห์ไม่ถูกต้องหรือไม่มีการตั้งค่าไว้"
    });
  }

  // 2. ตรวจสอบความพร้อมของคีย์ Gemini API Key
  const activeKey = process.env.GEMINI_API_KEY;
  if (!activeKey || activeKey === 'your_gemini_api_key_here') {
    console.error(`[Analyze API] ❌ ข้อผิดพลาด: ไม่พบคีย์ GEMINI_API_KEY ในสภาพแวดล้อมหลังบ้าน`);
    return res.status(500).json({
      success: false,
      message: "ไม่พบความต้องการคีย์เชื่อมต่อ Gemini API ในเซิร์ฟเวอร์ระบบ"
    });
  }

  try {
    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.projectId === projectId);

    if (projectIndex === -1) {
      console.error(`[Analyze API] ❌ ข้อผิดพลาด: ไม่พบโครงการรหัส "${projectId}"`);
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่กำหนด" });
    }

    const project = projects[projectIndex];

    // 3. รวบรวมเอกสารที่อัปโหลดแคชไว้เพื่อสกัดข้อความส่งเป็น Context
    const docTexts = [];
    const inlineParts = []; // สำหรับ PDF

    const docs = project.documents || {};
    const docTypes = ['productSpec', 'pricingValuation', 'compliance'];

    for (const docType of docTypes) {
      const doc = docs[docType];
      if (doc && doc.tempPath && fs.existsSync(doc.tempPath)) {
        const ext = path.extname(doc.fileName).toLowerCase();
        console.log(`[Analyze API] กำลังประมวลเนื้อหาของไฟล์: ${doc.fileName} (ประเภท: ${docType}, นามสกุล: ${ext})`);

        let rawText = '';
        if (ext === '.docx') {
          rawText = readDocxText(doc.tempPath);
        } else if (['.txt', '.md', '.csv'].includes(ext)) {
          rawText = fs.readFileSync(doc.tempPath, 'utf8');
        }

        if (rawText) {
          const cleanText = cleanExtractedText(rawText);
          if (cleanText) {
            docTexts.push(`--- BEGIN DOCUMENT CONTENT (${docType}: ${doc.fileName}) ---\n${cleanText}\n--- END DOCUMENT CONTENT (${docType}: ${doc.fileName}) ---`);
          }
        } else if (ext === '.pdf') {
          // หากเป็น PDF ให้ส่งเป็น binary inlineData ตรงๆ
          inlineParts.push(fileToGenerativePart(doc.tempPath, "application/pdf"));
        } else {
          console.warn(`[Analyze API] ⚠️ นามสกุลไฟล์ ${ext} ไม่ได้รับการสนับสนุนสกัดข้อความ จะพยายามส่ง raw content`);
        }
      }
    }

    if (docTexts.length === 0 && inlineParts.length === 0) {
      console.error(`[Analyze API] ❌ ปฏิเสธวิเคราะห์: โครงการไม่มีไฟล์เอกสารที่อัปโหลดจัดเก็บอยู่จริง`);
      return res.status(400).json({
        success: false,
        message: "ไม่พบไฟล์เอกสารแนบในระบบ ไม่สามารถวิเคราะห์ความต้องการได้"
      });
    }

    // 4. สร้าง Prompt และ System Instruction จาก Schema
    const systemInstruction = section.systemInstruction;
    let sectionUserPrompt = section.userPrompt;
    if (section.expectedJsonStructure) {
      sectionUserPrompt += `\n\nโครงสร้างผลลัพธ์ JSON ที่กำหนด:\n${JSON.stringify(section.expectedJsonStructure, null, 2)}\n\nกรุณาตอบกลับเฉพาะข้อมูล JSON เท่านั้น ห้ามใส่คำอธิบายเพิ่มเติมใดๆ นอกเหนือจาก JSON`;
    }

    const documentContextPrompt = docTexts.join('\n\n');
    const finalPrompt = `${documentContextPrompt}\n\n${sectionUserPrompt}`;

    console.log(`[Analyze API] กำลังส่งคำร้องขอประมวลผลไปยังโมเดล gemini-2.5-flash...`);
    const tempGenAI = new GoogleGenerativeAI(activeKey);
    const model = tempGenAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      },
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent([
      ...inlineParts,
      finalPrompt
    ]);

    const responseText = result.response.text();
    console.log(`[Analyze API] รับข้อความตอบรับจากโมเดลสำเร็จ`);

    // ล้างโค้ดบล็อก Markdown (เช่น ```json ... ```) ออก หากโมเดลแถมมา
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    }

    let extractedJson;
    try {
      extractedJson = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error(`[Analyze API] ❌ ผิดพลาดในการแปลง JSON ตอบรับ:`, parseErr.message);
      console.error(`[Analyze API] ข้อความตอบกลับดิบจาก AI:`, responseText);
      return res.status(500).json({
        success: false,
        message: "การประมวลผลของ AI มีรูปแบบที่ไม่ถูกต้องตามโครงสร้าง JSON"
      });
    }

    // 5. บันทึกผลลัพธ์ลงในโครงการ
    if (!project.extractedRequirements) {
      project.extractedRequirements = {};
    }
    project.extractedRequirements[sectionType] = extractedJson;
    project.status = "analyzed";

    // อัปเดตข้อมูลกลับไปยัง projects.json
    writeProjects(projects);
    console.log(`[Analyze API] ✅ บันทึกผลลัพธ์หัวข้อ "${sectionType}" ลงโปรเจกต์ "${projectId}" และอัปเดตสถานะเป็น "analyzed" สำเร็จ`);

    return res.status(200).json({
      success: true,
      projectId,
      sectionType,
      data: extractedJson,
      message: `วิเคราะห์สกัดส่วนงาน ${sectionType} สำเร็จ`
    });
  } catch (error) {
    console.error("[Analyze API] ❌ ระบบวิเคราะห์ของ Gemini API ขัดข้อง:", error);
    return res.status(500).json({
      success: false,
      message: `ระบบประมวลผล AI ของ Gemini ขัดข้อง: ${error.message}`
    });
  }
}

module.exports = {
  readDocxText,
  testGeminiConnectionController,
  analyzeSectionController
};
