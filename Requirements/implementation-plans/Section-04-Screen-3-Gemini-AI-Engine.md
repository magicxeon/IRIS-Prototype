# Section 04: Screen 3 - Gemini AI Engine (P3)

## 1. Objectives (วัตถุประสงค์)
สร้างระบบจัดทำข้อกำหนดรูปแบบความต้องการ (Screen 3) และเชื่อมโยง **Gemini API** ในการวิเคราะห์เอกสารประกอบ โดยข้อกำหนดทางเทคนิคนี้เน้นออกแบบ **กลไกการแสดงความคืบหน้าอย่างละเอียด (Waiting Detail Indicators)** ขณะที่กำลังรอคอย AI ประมวลผล เพื่อมอบประสบการณ์ใช้งานที่พรีเมียมและเป็นมิตรต่อผู้ใช้งาน (User Friendly)

---

## 2. API Specifications & Data Contracts (ข้อกำหนดทางเทคนิค)

เพื่อรองรับการเปลี่ยนข้อความแสดงสถานะอย่างละเอียดขณะรอคอยวิเคราะห์ (เช่น *"กำลังสกัดสูตรคำนวณ..."*) ระบบจะพัฒนา Endpoint หลังบ้านให้แยกการประมวลผลย่อยเป็นคำร้องขอลำดับขั้นตอน (Sequential API Requests) โดยฝั่งหน้าจอ (Frontend) จะทำการส่งคำร้องถัดไปเมื่อคำร้องก่อนหน้าสำเร็จ:

### 2.1 API Endpoint: เรียกสกัดรายส่วนงาน (Sequential Endpoints)
* **Method:** `POST`
* **Path:** `/api/projects/:projectId/analyze/:sectionType`
* **Parameters:** 
  * `:projectId` (เช่น `PRJ-2026-001`)
  * `:sectionType` (ค่าที่รองรับ: `landingPage` | `quickQuote` | `productCalculation` | `saleProposal`)
* **Response Body (Success 200 OK):**
```json
{
  "success": true,
  "projectId": "PRJ-2026-001",
  "sectionType": "landingPage",
  "data": {
    // ข้อมูล JSON สเปกที่ AI สกัดได้ตามข้อกำหนด BRS หน้า 4
  },
  "message": "AI สกัดวิเคราะห์ส่วนงาน landingPage สำเร็จ"
}
```

---

## 3. Node.js Gemini Integration Skeleton Code (โค้ดเชื่อมต่อ AI Engine)

สเปกโค้ดหลังบ้านในการอ่านเอกสาร Cache นำมารวมกับ Prompt Template เฉพาะของแต่ละหัวข้อ และยิงคำร้องผ่าน Google Generative AI SDK:

```javascript
const { GoogleGenAI } = require('@google/generative-ai'); // หรือ SDK ตัวล่าสุดของค่าย Google
const fs = require('fs');
const { readProjects, writeProjects } = require('./dal');

// ค้นหา API Key จาก .env
const aiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI(aiKey);

/**
 * ฟังก์ชันอ่านไฟล์แคชชั่วคราวและทำการแปลงไฟล์เป็น Base64 Payload ส่งให้ Gemini API
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
 * API Controller สำหรับสกัดวิเคราะห์ข้อมูลประกันภัยรายหัวข้อย่อย
 */
async function analyzeSectionController(req, res) {
  const { projectId, sectionType } = req.params;
  
  // 1. ดึงสเปก Prompt และระบบคำสั่ง System Instruction ประจำหัวข้อ
  // สเปกคำสั่งดึงมาจากเอกสาร BRS-03 หมวดที่ 3
  const promptsMap = {
    landingPage: {
      system: "คุณคือ Senior Insurance Business Analyst... สกัดข้อมูล Marketing & Product Identity...",
      user: "จากเอกสาร Product Spec... สกัดชื่อหลัก สโลแกน และจุดเด่น 3 ข้อ ตอบกลับเป็น JSON..."
    },
    quickQuote: {
      system: "คุณคือ Senior Insurance Business Analyst... สกัดกฎ Validation Constraints...",
      user: "วิเคราะห์หาค่าขีดจำกัดตัวแปร Age, Sum Assured, Payment Term ตอบกลับเป็น JSON..."
    },
    productCalculation: {
      system: "คุณคือ Senior Insurance Business Analyst... สกัดสูตรคำนวณและ Rate matrix...",
      user: "ค้นหาสูตรคำนวณเบี้ยประกันหลัก ส่วนลด และอัตราเบี้ยประกันรายปีต่อทุน 1,000 ตอบกลับเป็น JSON..."
    },
    saleProposal: {
      system: "คุณคือ Senior Insurance Business Analyst... สกัด Cash Value rates และกฎเกณฑ์...",
      user: "ค้นหาข้อมูล Cash Value rates สะสมเบี้ย 10 ปี ทุนลดหย่อนภาษี และคำเตือนมาตรา 865 ตอบกลับเป็น JSON..."
    }
  };

  const selectedConfig = promptsMap[sectionType];
  if (!selectedConfig) {
    return res.status(400).json({ success: false, message: "ประเภทหัวข้อการสกัดวิเคราะห์ไม่ถูกต้อง" });
  }

  try {
    const projects = readProjects();
    const project = projects.find(p => p.projectId === projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่กำหนด" });
    }

    // 2. รวบรวมเอกสารที่อัปโหลดแคชไว้เพื่อส่งเป็น context
    const generativeParts = [];
    if (project.documents.productSpec) {
      generativeParts.push(fileToGenerativePart(project.documents.productSpec.tempPath, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }
    if (project.documents.pricingValuation) {
      generativeParts.push(fileToGenerativePart(project.documents.pricingValuation.tempPath, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
    }

    // 3. เรียกใช้ Gemini API
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: selectedConfig.system
    });

    const result = await model.generateContent([
      ...generativeParts,
      selectedConfig.user
    ]);

    const responseText = result.response.text();
    const extractedJson = JSON.parse(responseText); // แปลงเป็น JSON เพื่อจัดเตรียมบันทึก

    // 4. บันทึกผลลัพธ์ลงในโครงการ
    if (!project.extractedRequirements) {
      project.extractedRequirements = {};
    }
    project.extractedRequirements[sectionType] = extractedJson;
    project.status = "analyzed";
    writeProjects(projects); // เซฟอัปเดตลง projects.json

    return res.status(200).json({
      success: true,
      projectId,
      sectionType,
      data: extractedJson,
      message: `วิเคราะห์สกัดส่วนงาน ${sectionType} สำเร็จ`
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ success: false, message: "ระบบประมวลผล AI ของ Gemini ขัดข้อง ไม่สามารถสกัดข้อกำหนดได้" });
  }
}
```

---

## 4. Waiting Detail UI Flow (การอัปเดตความคืบหน้าบนหน้าจอ)

ฝั่งหน้าจอ (Frontend) จะทำหน้าผูกฟังก์ชันการเปลี่ยนข้อความแสดงผลรายละเอียดให้สอดคล้องกับ AJAX Sequential Chain ดังแนวทางนี้:

* **Step 1 (คลิกปุ่ม Analyze):** แสดง Overlay กระจกฝ้า -> แสดงข้อความ: `"กำลังสแกนเอกสาร Product Specification..."` -> ยิงคำร้องย่อย `landingPage`
* **Step 2 ( landingPage สำเร็จ):** แสดงเครื่องหมายติ๊กถูกที่ข้อ 1 -> เปลี่ยนข้อความ: `"กำลังสกัดเกณฑ์ข้อจำกัดฟอร์ม Validation..."` -> ยิงคำร้องย่อย `quickQuote`
* **Step 3 ( quickQuote สำเร็จ):** แสดงเครื่องหมายติ๊กถูกที่ข้อ 2 -> เปลี่ยนข้อความ: `"กำลังสืบค้นและทำแผนผังคำนวณเบี้ยประกันภัยหลัก..."` -> ยิงคำร้องย่อย `productCalculation`
* **Step 4 ( productCalculation สำเร็จ):** แสดงเครื่องหมายติ๊กถูกที่ข้อ 3 -> เปลี่ยนข้อความ: `"กำลังจัดทำตารางผลประโยชน์เงินสดและข้อบังคับลดหย่อนภาษี..."` -> ยิงคำร้องย่อย `saleProposal`
* **Step 5 (เสร็จสิ้นทั้งหมด):** เปลี่ยนสถานะโครงการเป็น `"analyzed"` และนำทางผู้ใช้เข้าสู่หน้าแสดงสเปก (Screen 4)

---

## 5. Test-Driven Development (TDD) & UAT Scenarios

### 5.1 Gherkin Test Scenarios

#### Scenario 1: การเปลี่ยนข้อความแสดงผลขณะประมวลผล AI ได้อย่างลื่นไหล (UAT: Step-by-Step Progress Updates)
* **Given** ผู้ใช้งานอยู่ในหน้าจอ Screen 3 และมีหน้าต่างหมุนประมวลผลขึ้นมาครอบทับ
* **When** ระบบหลังบ้านเริ่มประมวลผลสกัดความต้องการหมวด `quickQuote` สำเร็จและสลับมาประมวลผลหมวด `productCalculation`
* **Then** ข้อความแจ้งสถานะรายละเอียดบนหน้าจอต้องปรับเปลี่ยนคำเป็นข้อความเกี่ยวกับคณิตศาสตร์ประกันภัยหรือสูตรคำนวณโดยตรง
* **And** ปุ่มทั้งหมดต้องยังอยู่ในสถานะล็อก (Disabled) ห้ามให้กดย้ำซ้ำ

#### Scenario 2: การตรวจสอบความสมบูรณ์ในการบันทึกค่าลง JSON หลังประมวลผลเสร็จ (UAT: Requirement persistence check)
* **Given** ระบบทำการเรียกใช้งาน Gemini API ครบทุกหัวข้อ
* **When** คำร้องขอ API สุดท้ายทำงานเสร็จสิ้น
* **Then** ข้อมูลความต้องการประกันภัยที่สกัดได้ทั้งหมด (Landing, Quote, Calc, Proposal) ต้องได้รับการบันทึกอยู่ภายใต้ฟิลด์ `extractedRequirements` ของโปรเจกต์นั้นใน `projects.json`
* **And** สถานะ `"status"` ของโครงการต้องถูกปรับเปลี่ยนค่าเป็น `"analyzed"` อย่างถูกต้อง
