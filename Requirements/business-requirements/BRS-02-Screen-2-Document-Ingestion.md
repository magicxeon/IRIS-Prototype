# BRS-02: Screen 2 - Document Ingestion

## 1. Introduction (บทนำ)
ความต้องการในเอกสารฉบับนี้กำหนดเกณฑ์และข้อกำหนดเชิงธุรกิจสำหรับ **หน้าจอที่ 2 (Screen 2): Document Ingestion** ของระบบ **IREBA** เพื่อควบคุมการออกแบบ UI/UX แดชบอร์ดลากวางไฟล์ที่เรียบง่าย สะอาดตา และเป็นระบบ พร้อมส่วนแสดงป้ายเลขเวอร์ชันแอปพลิเคชันเพื่อการอัปเดตข้อมูล

---

## 2. Business Requirements & UI Specs (ความต้องการทางธุรกิจ)

### 2.1 UI Component & Layout Specifications (การจัดวางและส่วนประกอบหน้าจอ)
ระบบหน้าจอต้องออกแบบให้ใช้งานง่ายและเป็นระเบียบ (User Friendly Layout) โดยประกอบไปด้วย:
* **Progress Steps Bar:** แถบแสดงสถานะด้านบนระบุว่าผ่านขั้นตอนที่ 1 แล้ว และอยู่ในขั้นตอนที่ 2 (Document Ingestion) เพื่อเพิ่มประสบการณ์ใช้งานที่ดี
* **Drag-and-Drop Dropzone Cards (กล่องลากวางเอกสาร):**
  * จัดกล่องพื้นที่อัปโหลดไฟล์ 3 ช่องเคียงข้างกันอย่างเป็นระเบียบ
  * เส้นขอบเป็นสไตล์เส้นประสีเทาอ่อน `--color-border-light` และเปลี่ยนเป็นสีครามสะท้อน `--color-secondary-indigo` เมื่อมีการลากเมาส์นำไฟล์มาค้าง (Drag Over State)
  * เมื่ออัปโหลดไฟล์สำเร็จ ขอบประจะเปลี่ยนเป็นสีทึบพรีเมียม และพื้นหลังเปลี่ยนเป็นสีเทาสว่างขอบมนระบายด้วยสีเขียวบาง `--color-success-green` เพื่อระบุสถานะผ่านเกณฑ์
* **Uploaded File List:** แสดงรายการไฟล์ที่โหลดเสร็จในแต่ละช่องการ์ด ระบุไอคอนประเภทไฟล์ ชื่อไฟล์ ขนาดไฟล์ และไอคอน "ถังขยะสีแดงขอบมน" เพื่อขอนำไฟล์ออก
* **Footer (เลขรุ่นและประวัติระบบ):**
  * บริเวณขวาล่างของส่วน Footer ต้องมีป้ายรุ่นแอปพลิเคชันระบุว่า `"IREBA App Version: v3.0.0"`
  * ป้ายตัวหนังสือรองรับการโฮเวอร์และคลิกเพื่อเปิดหน้าต่าง Popup แสดงรายละเอียดฟีเจอร์อัปเดต

### 2.2 Ingestion & Validation Rules (กฎการนำเข้าและตรวจสอบ)
* จำกัดขนาดไฟล์แต่ละไฟล์ไม่เกิน **10 MB** (10,485,760 Bytes)
* ระบบตรวจสอบประเภทไฟล์ตามนามสกุลที่อนุมัติ (Product Spec: .pdf/.docx/.md, Pricing: .pdf/.csv/.xlsx, Compliance: .pdf/.docx)
* จัดเก็บใน Cache ชั่วคราว และอัปเดตสถานะของโครงการในไฟล์ `projects.json` เป็น `"documents_uploaded"`

---

## 3. Data Schema Specifications (โครงสร้างข้อกำหนดข้อมูล)

### 3.1 Flat-File Database Schema (สถานะโครงการอัปโหลดไฟล์ใน `projects.json`)
```json
[
  {
    "projectId": "PRJ-2026-001",
    "projectName": "FutureShield 99 Implementation",
    "description": "โครงการวิเคราะห์และสกัดข้อมูลแบบประกันภัย",
    "createdAt": "2026-06-12T04:55:07Z",
    "status": "documents_uploaded",
    "documents": {
      "productSpec": {
        "fileName": "Product Specification - FutureShield 99 V2.docx",
        "fileSize": 13842,
        "uploadedAt": "2026-06-12T04:56:00Z"
      },
      "pricingValuation": {
        "fileName": "Pricing & Valuation - FutureShield 99 V2.docx",
        "fileSize": 12959,
        "uploadedAt": "2026-06-12T04:56:05Z"
      },
      "compliance": null
    }
  }
]
```

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: อัปโหลดเอกสารสำเร็จและหน้าจอเปลี่ยนสไตล์สีเขียว (UAT: Document Upload styling)
* **Given** ผู้ใช้งานอยู่ในหน้าจอ Screen 2 ของระบบ IREBA
* **When** ผู้ใช้งานอัปโหลดไฟล์ขนาดถูกต้องชื่อ `"Product Specification - FutureShield 99.docx"` ใน Uploader 1
* **Then** ขอบกล่อง Uploader ต้องเปลี่ยนจากเส้นประเป็นเส้นสีเขียว `--color-success-green` เพื่อแจ้งสถานะความปลอดภัย
* **And** ระบบต้องทำการบันทึกประวัติการอัปโหลดไฟล์ลงใน `projects.json` สำเร็จ

#### Scenario 2: การตรวจสอบความสูงของข้อความแจ้งเตือนสีแดงเมื่อไฟล์เกินขนาด (UAT: Error Notification styling)
* **Given** ผู้ใช้งานอยู่ในหน้าจอ Screen 2 ของโครงการ
* **When** ผู้ใช้งานพยายามอัปโหลดไฟล์ขนาด 15 MB วางบนกล่องอัปโหลดใดๆ
* **Then** ระบบต้องทำการปฏิเสธไฟล์ และแสดงกรอบข้อความแจ้งเตือนสีแดงระบุอักษรตัวหนา `"File size exceeds maximum limit of 10 MB"` (อ้างอิงรหัสสีจากดีไซน์ซิสเต็ม `--color-error-red`)

---

## 5. Expected Output Summary (สรุปผลลัพธ์ที่ต้องการ)
1. หน้าส่วนต่อประสานการอัปโหลด 3 ช่องแบบลากวาง สไตล์ Clean UI ใช้โทนสีอ่อนและขอบเส้นประ
2. ป้ายแสดงผลเวอร์ชันแอปพลิเคชัน IREBA `v3.0.0` ที่ส่วนล่างสุดพร้อมกล่องแสดงประวัติคุณสมบัติ
3. ข้อมูลเอกสารพร้อมพารามิเตอร์และสถานะ `"documents_uploaded"` ได้รับการซิงค์ลงฐานข้อมูล `projects.json`
