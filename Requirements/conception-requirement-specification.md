# Software Requirement Specification (SRS) & Prototype Design
**Project Name:** InsureTech BA Requirement Extractor (AI-Powered)
**Document Version:** 2.0.0
**Target Deployment:** Local Environment / Vercel
**Data Storage:** Flat-file JSON (Local/Serverless Cache)
**Core AI Engine:** Gemini API (Document Analysis & Extraction)

---

## 1. System Overview (ภาพรวมระบบ)
ระบบ InsureTech BA Requirement Extractor เป็น Web Application Prototype ที่ขับเคลื่อนด้วย AI (Gemini API) ออกแบบมาเพื่อช่วย Business Analyst และ QA ในการวิเคราะห์เอกสารทางธุรกิจ (Product Spec, Pricing, Compliance) ระบบจะใช้ AI อ่านเอกสารที่อัปโหลดและสกัด (Extract) ข้อมูลออกมาเป็น Software Requirement ตามประเภทของผลลัพธ์ (Output) ที่ผู้ใช้เลือก พร้อมจัดโครงสร้างรหัสอ้างอิงให้ทีม Software Engineering นำไปทำงานต่อได้ทันที

## 2. System Architecture & Tech Stack (โครงสร้างสถาปัตยกรรม)
* **Frontend & Backend:** Vite หรือ Node.js (รองรับการ Deploy บน Vercel)
* **AI Integration:** **Gemini API** (ส่งไฟล์เอกสารผ่าน File API หรือ Base64 payload เข้าสู่ Context Window เพื่อให้ AI วิเคราะห์ตาม Prompt ที่กำหนด)
* **Storage (Database):** บันทึกผลลัพธ์ที่ได้จากการ Extract ลงในไฟล์ JSON (`projects.json`, `extracted_requirements.json`) 
* **File Handling:** ประมวลผลไฟล์แบบ In-memory หรือ Temporary Storage เพื่อส่งให้ Gemini API วิเคราะห์โดยไม่ต้องจัดเก็บถาวรบน Cloud Storage อื่น

---

## 3. User Interface Flow & Screen Design (การออกแบบหน้าจอการใช้งาน)

### Screen 1: Project Initialization (หน้าจอเริ่มต้นโครงการ)
* **UI Components:**
    * Text Input: `Project Name` (เช่น "FutureShield 99 Implementation")
    * Text Input: `Project Description`
    * Button: `Create Project & Continue`

### Screen 2: Document Ingestion & AI Prompting (หน้าจออัปโหลดเอกสาร)
* **UI Components:**
    * File Uploader 1: `Product Specification` (รองรับ .pdf, .docx, .md)
    * File Uploader 2: `Pricing & Valuation` (รองรับ .pdf, .csv, .xlsx)
    * File Uploader 3: `Compliance & Exclusions` (รองรับ .pdf, .docx)
* **System Behavior:** ระบบจะรับไฟล์ไว้ในหน่วยความจำชั่วคราว เพื่อเตรียมแพ็กเกจข้อมูลสำหรับส่งต่อไปยัง Gemini API

### Screen 3: Output Configuration (หน้าจอกำหนดรูปแบบผลลัพธ์)
ผู้ใช้งานเลือกรูปแบบ Output ที่ต้องการ ระบบจะนำตัวเลือกเหล่านี้ไปสร้างเป็น **System Prompt** เพื่อสั่งการให้ Gemini สกัดข้อมูลเฉพาะส่วนที่เกี่ยวข้อง

* **[ ] Landing Page:** สำหรับแสดงผลข้อมูลผลิตภัณฑ์ทางการตลาด
* **[ ] Quick Quote:** สำหรับระบบคำนวณเบี้ยประกันเบื้องต้น (เน้น Validation)
* **[ ] Product Calculation Engine:** สำหรับระบบคำนวณหลังบ้าน (เน้น Formula)
* **[ ] Sale Proposal:** สำหรับใบเสนอขายและการออกรายงาน
* **Action Component:** * Button: `Analyze with Gemini AI` (เมื่อกดปุ่ม ระบบจะส่ง Files + Prompt instruction ไปยัง Gemini API)
    * Loading State: แสดงสถานะ "AI is analyzing documents and extracting requirements..."

### Screen 4: Result Output & Export (หน้าจอแสดงผลและส่งออกข้อมูล)
* **UI Components:**
    * Tab View: แสดงผลลัพธ์ที่ Gemini สกัดออกมา โดยแยกแท็บตาม Output ที่เลือกไว้
    * Data Table: แสดง Requirement list, Reference Code และค่าตัวเลข (แยกคอลัมน์ชัดเจน)
    * Button: `Export as .md`
    * Button: `Export as .json`

---

## 4. Software Engineering & QA Requirements (รายละเอียด Output จาก AI)

รูปแบบโครงสร้างข้อมูลที่ Gemini API จะต้อง Extract ออกมาและแสดงผลในตาราง (จัดรูปแบบโดยแยกตัวเลขออกจากข้อความเพื่อให้นำไปใช้ในระบบคำนวณต่อได้)

### 4.1 Landing Page Requirements
| Req Code | Component | Description | Data Source Ref | Constraint Type |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-LP-001` | `Product Name` | ชื่อผลิตภัณฑ์ (FutureShield 99) | Product Spec | Text |
| `REQ-LP-002` | `Tagline` | คำโปรยทางการตลาด | Product Spec | Text |
| `REQ-LP-003` | `Key Benefits` | จุดเด่นผลิตภัณฑ์ | Product Spec | List |

### 4.2 Quick Quote Requirements (ระบบกรอกข้อมูลเบื้องต้น)
| Req Code | Component | Description | Data Source Ref | Min Value | Max Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `REQ-QQ-001` | `Input: Age` | อายุผู้เอาประกันภัย | Product Spec | 1 | 75 |
| `REQ-QQ-002` | `Input: SA` | ทุนประกันภัยหลัก | Product Spec | 100000 | 9999999 |
| `REQ-QQ-003` | `Input: Term` | ระยะเวลาชำระเบี้ย | Product Spec | 5 | 99 |

### 4.3 Product Calculation Requirements (ระบบคำนวณ)
| Req Code | Logic/Formula Description | Variable 1 | Variable 2 | Expected Result (QA) |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-CAL-001` | `Base Premium` = (Rate / 1000) * SA | Rate | SA | 173000 |
| `REQ-CAL-002` | `Discount` = Rate Discount * (SA / 1000) | Rate Discount | SA | 6000 |
| `REQ-CAL-003` | `Total Premium` = Base Premium - Discount | Base Premium | Discount | 167000 |

### 4.4 Sale Proposal Requirements (เอกสารนำเสนอการขาย)
| Req Code | Section | Display Data Logic | Max Tax Deduction Limit | Source Ref |
| :--- | :--- | :--- | :--- | :--- |
| `REQ-SP-001` | `Benefit Table` | ลูปข้อมูลจากตาราง CV แสดงค่าตามปี | 0 | Pricing Spec |
| `REQ-SP-002` | `Tax Benefit` | MIN(Total Premium, Max Limit) | 100000 | Product Spec |
| `REQ-SP-003` | `Disclaimer` | แสดงคำเตือนตามมาตรา 865 | 0 | Compliance |

---

## 5. Data Schema Design (JSON Structure สำหรับ Application)
รูปแบบ JSON Payload ที่ระบบจะรับส่งกับ Gemini API และจัดเก็บลงไฟล์สำหรับใช้งาน:

```json
{
  "project_id": "PRJ-2026-001",
  "project_name": "FutureShield 99 Implementation",
  "ai_processing": {
    "engine": "gemini-1.5-pro",
    "status": "completed"
  },
  "extracted_requirements": {
    "quick_quote": [
      {
        "req_code": "REQ-QQ-001",
        "component": "Input: Age",
        "validation": {
          "type": "integer",
          "min_value": 1,
          "max_value": 75
        },
        "source": "Product Spec Document"
      },
      {
        "req_code": "REQ-QQ-002",
        "component": "Input: SA",
        "validation": {
          "type": "integer",
          "min_value": 100000
        },
        "source": "Product Spec Document"
      }
    ],
    "product_calculation": [
      {
        "req_code": "REQ-CAL-003",
        "formula": "Base Premium - Discount",
        "expected_qa_result": 167000
      }
    ]
  }
}