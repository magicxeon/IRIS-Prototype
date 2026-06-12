# BRS-01: Screen 1 - Project Initialization

## 1. Introduction (บทนำ)
ความต้องการในเอกสารฉบับนี้กำหนดเกณฑ์และข้อกำหนดเชิงธุรกิจสำหรับ **หน้าจอที่ 1 (Screen 1): Project Initialization** ของระบบ **IREBA** เพื่อรองรับฟอร์มการสร้างโครงการในรูปแบบหน้าจอที่สะอาด เป็นระเบียบ (Clean & Professional Style) โดยอ้างอิงตามชุดตัวแปรของ [BRS-UX-CSS-Design-System.md](file:///d:/development/IRIS-Training/IRIS-Prototype/Requirements/business-requirements/BRS-UX-CSS-Design-System.md)

---

## 2. Business Requirements & UI Specs (ความต้องการทางธุรกิจ)

### 2.1 UI Component & Layout Specifications (การจัดวางและส่วนประกอบหน้าจอ)
การออกแบบหน้าจอต้องมีลักษณะสะอาดตา (Clean UI) ใช้ชุดรูปแบบตัวอักษรและสีที่นำเข้าจากดีไซน์ซิสเต็ม โดยมีองค์ประกอบดังนี้:
* **Global Header:** แสดงชื่อระบบ **"IREBA"** ขนาดเด่นชัดสีน้ำเงินหลัก `--color-primary-navy`
* **Project Form Card:** กล่องการ์ดเนื้อหากึ่งกลางหน้าจอที่มีเส้นขอบโค้งมนตามตัวแปร `--radius-lg` และเงาฟุ้งเบาบาง `--shadow-soft`
  * **Project Name Input:** ช่องรับข้อมูลตัวหนังสือขอบโค้ง `--radius-md` มีคำอธิบายฟิลด์ชัดเจน (จำเป็นต้องกรอก 3-100 ตัวอักษร)
  * **Project Description Input:** กล่องข้อความ TextArea ขอบโค้งมนปรับยืดหยุ่นได้
  * **Action Button:** ปุ่มกด `"Create Project & Continue"` ใช้สีน้ำเงินหลักพื้นผิวทึบ เมื่อชี้เมาส์ (Hover) จะเปลี่ยนเป็นสีครามสะท้อน `--color-secondary-indigo`
* **Footer (เลขรุ่นและประวัติระบบ):**
  * บริเวณขวาล่างของส่วน Footer ต้องมีป้ายรุ่นแอปพลิเคชันระบุว่า `"IREBA App Version: v3.0.0"` 
  * ป้ายข้อความนี้รองรับการโฮเวอร์ (Cursor Pointer) และเมื่อทำการคลิก ระบบต้องเปิดหน้าต่างรายละเอียดฟีเจอร์ของรุ่นตามที่ระบุในข้อกำหนดระบบการออกแบบ

### 2.2 System Processing Rules (กฎการประมวลผลระบบ)
* เมื่อผู้ใช้บันทึกสำเร็จ ระบบต้องสร้างรหัสโปรเจกต์อัตโนมัติ `PRJ-YYYY-XXX` 
* ระบบนำข้อมูลบันทึกลงไฟล์ `projects.json` บนเซิร์ฟเวอร์ โดยจัดส่งสถานะเริ่มต้นโครงการเป็น `"initialized"`
* ส่งต่อผู้ใช้งานไปยังหน้าจอที่ 2

---

## 3. Data Schema Specifications (โครงสร้างข้อกำหนดข้อมูล)

### 3.1 Flat-File Database Schema (`projects.json` structure)
```json
[
  {
    "projectId": "PRJ-2026-001",
    "projectName": "FutureShield 99 Implementation",
    "description": "โครงการวิเคราะห์และสกัดข้อมูลแบบประกันภัยเพื่อการพัฒนาและทดสอบระบบ",
    "createdAt": "2026-06-12T04:55:07Z",
    "status": "initialized",
    "documents": {
      "productSpec": null,
      "pricingValuation": null,
      "compliance": null
    }
  }
]
```

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: การลงทะเบียนสร้างโครงการใหม่สำเร็จและเข้าสู่หน้าถัดไป (UAT: Initial Project Creation)
* **Given** ผู้ใช้งานเข้าสู่หน้าแรกระบบ IREBA ที่เรนเดอร์ในแบบตัวอักษร Kanit อย่างสวยงาม
* **When** ผู้ใช้งานกรอกชื่อโครงการเป็น `"FutureShield 99"`
* **And** คลิกปุ่ม `"Create Project & Continue"`
* **Then** ระบบต้องทำการสร้างรหัสโครงการรูปแบบตัวอักษร `"PRJ-2026-001"` ในฐานข้อมูล `projects.json`
* **And** ระบบต้องทำการนำทางเปลี่ยนหน้าจอผู้ใช้งานไปยัง Screen 2

#### Scenario 2: การเปิดรายละเอียดประวัติการอัปเดตแอปพลิเคชันผ่าน Footer (UAT: Open Changelog Popup)
* **Given** ผู้ใช้งานเปิดหน้าจอ Screen 1 ของระบบ
* **When** ผู้ใช้งานคลิกข้อความเลขรุ่น `"IREBA App Version: v3.0.0"` ที่บริเวณ Footer ขวาล่าง
* **Then** หน้าจอต้องแสดงกรอบข้อความ Modal/Popover แสดงรายละเอียดฟีเจอร์ทั้ง 5 ข้อของรุ่น
* **And** เมื่อคลิกพื้นที่อื่นภายนอกกล่อง หรือกดปุ่มปิด กล่องรายละเอียดต้องหดหายไป

---

## 5. Expected Output Summary (สรุปผลลัพธ์ที่ต้องการ)
1. หน้าฟอร์ม UI แบบ Clean & Professional สไตล์การ์ดขอบโค้งมน ใช้ฟอนต์ Kanit 
2. ป้ายแสดงผลเวอร์ชันแอปพลิเคชัน IREBA `v3.0.0` ที่ส่วนล่างสุดพร้อมกล่องป๊อปอัพแสดงฟีเจอร์การอัปเดต
3. แฟ้มข้อมูลโครงการ `projects.json` บันทึกสถานะตั้งต้นสำเร็จ
