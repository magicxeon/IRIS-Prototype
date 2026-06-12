# Phase 4: ระบบวิเคราะห์และแสดงผลแบบกำหนดโครงสร้างผ่านการตั้งค่า (Dynamic Configuration-Driven Schema)

แผนงานขั้นที่สี่นี้เป็นโซลูชันเพื่อเปลี่ยนสถานะระบบให้เป็น **Dynamic Schema Platform** เพื่อรองรับการขยายขอบเขตข้อมูลความต้องการประกันภัยที่เพิ่มขึ้นในอนาคต (เช่น เงื่อนไขการชำระเงิน Payment Terms, สัญญาเพิ่มเติมที่รองรับ Riders, แผนความคุ้มครองย่อย Sub-plans) ได้อย่างเป็นอิสระ โดยไม่ต้องกลับมาแก้ไขโค้ดโครงสร้างส่วน HTML หรือ JS ใหม่ทุกครั้งที่มีฟิลด์ใหม่เพิ่มเข้ามา

---

## 🏗️ แนวคิดการออกแบบและสถาปัตยกรรม (Architecture Concept)

ระบบจะถูกควบคุมการสกัดข้อมูลและการสร้าง UI ด้วยไฟล์โครงสร้างข้อมูลแกนหลักเพียงไฟล์เดียวคือ [extraction-schema.json](file:///d:/development/IRIS-Training/IRIS-Prototype/data/extraction-schema.json) ดังภาพประกอบ:

```
[extraction-schema.json] (ไฟล์กำหนดสเปก Prompts + UI Fields)
         │
         ├──► [Backend API] ──► ปรับแต่ง Prompts ส่งให้ Gemini AI วิเคราะห์แบบ Dynamic
         │
         └──► [Frontend JS] ──► เรนเดอร์การ์ดเลือกใน Screen 3 และแท็บแก้ไขใน Screen 4 อัตโนมัติ
```

---

## 🛠️ รายละเอียดการเปลี่ยนแปลงและการจัดทำ (Proposed Implementation Details)

### 1. [NEW] [extraction-schema.json](file:///d:/development/IRIS-Training/IRIS-Prototype/data/extraction-schema.json)
สร้างไฟล์ตั้งค่าแกนกลางเพื่อกำหนดหัวข้อ (Sections) และฟิลด์ย่อย (Fields) ในระบบ เช่น:
* **คุณสมบัติผลิตภัณฑ์ (Landing Page)**
* **กฎเสนอขาย (Quick Quote)** -> เพิ่มข้อมูล `paymentModes` (รายเดือน, รายปี) และ Plancode ย่อย
* **ระบบคำนวณเบี้ย (Calculations)**
* **ข้อเสนอขายและการปฏิบัติตามกฎหมาย (Compliance)**
* **[NEW] สัญญาเพิ่มเติมและระดับการจ่ายเบี้ย (Riders & Payment Options)** (เพิ่มเติมตามความต้องการใหม่)

#### ตัวอย่างโครงสร้าง JSON (Schema Design):
```json
{
  "sections": [
    {
      "key": "landingPage",
      "title": "Marketing & Identity",
      "icon": "🌐",
      "desc": "สกัดข้อมูลชื่อผลิตภัณฑ์ทางการค้า สโลแกนสั้นๆ และจุดเด่น 3 ข้อ",
      "systemInstruction": "คุณคือ Senior Insurance Business Analyst...",
      "userPrompt": "วิเคราะห์เอกสารและตอบในรูปแบบ JSON...",
      "fields": [
        { "key": "productName", "label": "ชื่อผลิตภัณฑ์ทางการค้า", "type": "text" },
        { "key": "tagline", "label": "สโลแกนขาย", "type": "text" },
        {
          "key": "keyBenefits",
          "label": "สรุปจุดเด่นของผลิตภัณฑ์",
          "type": "table",
          "columns": [
            { "key": "title", "label": "หัวข้อเด่น" },
            { "key": "description", "label": "คำอธิบาย" }
          ]
        }
      ]
    },
    {
      "key": "paymentTerms",
      "title": "Payment & Riders Spec",
      "icon": "💳",
      "desc": "สกัดงวดการจ่ายเงิน (รายเดือน/หกเดือน/ปี) เงื่อนไขราย Plancode และสัญญาเพิ่มเติม",
      "systemInstruction": "คุณคือ Senior Insurance Analyst วิเคราะห์โครงสร้างการชำระเบี้ยและสัญญาเพิ่มเติม...",
      "userPrompt": "สกัดข้อมูลดังต่อไปนี้ออกมาเป็นรูปแบบ JSON...",
      "fields": [
        { "key": "allowedModes", "label": "งวดชำระเบี้ยที่รองรับ (เช่น รายปี, รายเดือน, ราย 6 เดือน)", "type": "text" },
        {
          "key": "subPlanCodes",
          "label": "รหัสแผนย่อยและสิทธิ์การชำระเงิน (Sub-Plan Premium Configuration)",
          "type": "table",
          "columns": [
            { "key": "planCode", "label": "รหัสแผนย่อย (Plancode)" },
            { "key": "paymentFrequency", "label": "งวดชำระที่เลือกได้" },
            { "key": "minimumSumAssured", "label": "ทุนประกันภัยขั้นต่ำ" }
          ]
        },
        {
          "key": "supportedRiders",
          "label": "สัญญาเพิ่มเติมประกันภัยที่รองรับ (Supported Riders Matrix)",
          "type": "table",
          "columns": [
            { "key": "riderName", "label": "ชื่อสัญญาเพิ่มเติม" },
            { "key": "riderType", "label": "ประเภท (สุขภาพ/โรคร้ายแรง/อุบัติเหตุ)" },
            { "key": "exclusionRules", "label": "ข้อยกเว้นสำคัญ" }
          ]
        }
      ]
    }
  ]
}
```

---

### 2. [index.js](file:///d:/development/IRIS-Training/IRIS-Prototype/src/index.js) & [project-controller.js](file:///d:/development/IRIS-Training/IRIS-Prototype/src/project-controller.js) (หลังบ้าน)
* **สร้าง REST Endpoint ใหม่**: 
  * `GET /api/config/schema`: ส่งคืนโครงสร้าง JSON ในไฟล์ `extraction-schema.json` ไปที่หน้าบ้าน
* **ปรับปรุงกระบวนการดึงไฟล์เก็บข้อมูลโครงการ**:
  * โครงการแต่ละโครงการใน `projects.json` จะจัดเก็บผลลัพธ์การสกัดใน `extractedRequirements` ตามโครงสร้าง Section Key ดั้งเดิม ไม่ว่าจะขยายตัวฟิลด์มากน้อยเท่าใด

---

### 3. [gemini-controller.js](file:///d:/development/IRIS-Training/IRIS-Prototype/src/gemini-controller.js) (หลังบ้าน)
* **ยกเลิกแผนผัง Prompts แบบ Hardcoded**:
  * เปลี่ยนฟังก์ชัน `analyzeSectionController` จากการดึงข้อมูล `promptsMap` แบบเขียนตายตัวในโค้ด (บรรทัด 125-210) มาเป็น **การดึงโครงสร้าง Prompts จากไฟล์ `extraction-schema.json`** ในตอนรันระบบแทน
  * ทำให้เมื่อคุณผู้ใช้แก้ไขตัว Prompts หรือ System Instruction ในไฟล์ตั้งค่าภายนอก ตัวระบบประมวลผลหลังบ้านจะสกัดข้อมูลหัวข้อนั้นๆ ได้ทันทีโดยไม่ต้องสัมผัสโค้ด Node.js อีก

---

### 4. [app.js](file:///d:/development/IRIS-Training/IRIS-Prototype/public/app.js) & [index.html](file:///d:/development/IRIS-Training/IRIS-Prototype/public/index.html) (หน้าบ้าน - Dynamic Render)
* **ปรับเปลี่ยนหน้าจอเลือกหัวข้อสกัด AI (Screen 3 - Dynamic Cards Grid)**:
  * ในหน้าจอ 3 ตัวบ็อกซ์การ์ดเลือกหัวข้อวิเคราะห์จะถูกวาดจากข้อมูล API `/api/config/schema` ทั้งหมด
  * ระบบจะดึง ไอคอน ชื่อ และคำอธิบายมาใส่ในการ์ดอินพุต และสร้าง Checkbox ให้อัตโนมัติ
* **ปรับเปลี่ยนบอร์ดแก้ไขเอกสารสเปก (Screen 4 - Dynamic Tabs & Tables Editor)**:
  * ปุ่มในแท็บแถบเมนูด้านบน และโครงสร้างข้อมูลภายในแท็บของ Screen 4 จะถูกเรนเดอร์แบบ Dynamic:
    * วาดแท็บตามคีย์ที่พบในโครงการปัจจุบัน
    * วาดหัวข้อฟิลด์เดี่ยวในรูปแบบบล็อกแก้ไข:
      * หากฟิลด์ถูกกำหนดให้เป็น `type: "text"` จะสร้างกล่อง `<div contenteditable="true">` 
      * หากฟิลด์ถูกกำหนดให้เป็น `type: "table"` จะวาดโครงสร้างตาราง `<table>` พร้อมชื่อหัวข้อคอลัมน์ (TableHeader) ที่ดึงมาจาก Schema และดึงแถวข้อมูลจริงมาเรนเดอร์ลงในเซลล์ที่สามารถคลิกเข้าไปพิมพ์แก้ไขได้ทันที

---

## 🔍 แผนการตรวจสอบความถูกต้อง (Verification Details)
1. **ทดสอบความยืดหยุ่นในการเพิ่มข้อมูลเงื่อนไขชำระเงิน**:
   * ทดลองเพิ่มหัวข้อใหม่ชื่อ `paymentTerms` ลงในไฟล์ `extraction-schema.json`
   * เปิดโปรแกรมเพื่อตรวจเช็คหน้า Screen 3 จะต้องปรากฏการ์ดของ Payment Terms โดยอัตโนมัติ
2. **ทดสอบความถูกต้องของสเปกผลลัพธ์จาก AI**:
   * ส่งวิเคราะห์โครงการใหม่ ตรวจสอบความถูกต้องของการสกัดไฟล์ข้อกำหนดมาลงฟิลด์ `paymentModes` และ `supportedRiders` 
3. **ทดสอบฟังก์ชันแก้ไขหน้าจอ**:
   * หน้า Screen 4 จะต้องเพิ่มแท็บ Payment & Riders Spec ขึ้นมา และตารางแผนย่อยยิบจะต้องแก้ไขบันทึกส่งออกได้ปกติ
