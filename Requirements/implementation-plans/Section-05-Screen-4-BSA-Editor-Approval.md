# Section 05: Screen 4 - BSA Editor & Approval (P4)

## 1. Objectives (วัตถุประสงค์)
สร้างระบบจัดแสดงผลลัพธ์แยกแท็บ (Screen 4) และเพิ่มคุณลักษณะ **BSA Inline Editor** เพื่อให้ผู้ใช้ (Business Systems Analyst) สามารถเข้ามาแก้ไขปรับแต่งเนื้อหาความต้องการ (สโลแกน, กฎ Validation, ตารางตัวเลขเบี้ย หรือคำเตือนกฎหมาย) ที่ AI สกัดออกมาได้โดยตรง และกดปุ่ม **"Approve Final Spec"** เพื่อบันทึกข้อมูลเวอร์ชันสุดท้ายและเปลี่ยนสถานะโครงการเป็นอนุมัติผ่านเกณฑ์

---

## 2. API Specifications & Data Contracts (ข้อกำหนดทางเทคนิค)

เพื่อรองรับการแก้ไขข้อมูลและการบันทึกสเปกสุดท้ายที่ตรวจสอบแล้ว ระบบหลังบ้านจะจัดตั้งคำสั่ง Endpoint เพื่อรับการบันทึกแก้ไขและอนุมัติโครงการ:

### 2.1 Route Endpoint: บันทึกข้อมูลและอนุมัติแบบร่างสเปกขั้นสุดท้าย (Approve Spec)
* **Method:** `PUT`
* **Path:** `/api/projects/:projectId/approve`
* **Request Header:** `Content-Type: application/json`
* **Request Body Payload:**
```json
{
  "updatedRequirements": {
    "landingPage": {
      "productName": "FutureShield 99",
      "tagline": "ความคุ้มครองตลอดชีพที่มั่นคงร่วมกับความยืดหยุ่นที่เหนือกว่า" // ตัวอย่างฟิลด์ที่ BSA แก้ไขข้อความ
      // ... รายละเอียดคุณสมบัติอื่นของ Landing Page
    },
    "quickQuote": {
      // ... รายละเอียดคุณสมบัติของ Quick Quote
    },
    "productCalculation": {
      // ... รายละเอียดคุณสมบัติของ Calculation
    },
    "saleProposal": {
      // ... รายละเอียดคุณสมบัติของ Sale Proposal
    }
  }
}
```
* **Response Body (Success 200 OK):**
```json
{
  "success": true,
  "projectId": "PRJ-2026-001",
  "status": "approved",
  "message": "โครงการได้รับการตรวจสอบและยืนยันอนุมัติขั้นสุดท้ายเรียบร้อย"
}
```

---

## 3. Node.js Backend Skeleton Code (โค้ดควบคุมทางเทคนิค)

ตรรกะระบบควบคุมการเซฟข้อมูลแก้ไขและการเปลี่ยนผ่านสถานะโปรเจกต์เป็น `"approved"`:

```javascript
const { readProjects, writeProjects } = require('./dal');

/**
 * Controller สำหรับบันทึกความต้องการที่ BSA แก้ไขและเปลี่ยนสถานะเป็นอนุมัติ
 */
function approveProjectController(req, res) {
  const { projectId } = req.params;
  const { updatedRequirements } = req.body;

  if (!updatedRequirements || typeof updatedRequirements !== 'object') {
    return res.status(400).json({
      success: false,
      message: "ไม่พบข้อมูลความต้องการอัปเดต หรือรูปแบบข้อมูลไม่ถูกต้อง"
    });
  }

  try {
    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.projectId === projectId);

    if (projectIndex === -1) {
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่กำหนด" });
    }

    // 1. ทับข้อมูลความต้องการเดิมด้วยข้อมูลล่าสุดที่ BSA ทำการแก้ไข (BSA Final Edit)
    projects[projectIndex].extractedRequirements = updatedRequirements;
    
    // 2. ปรับปรุงสถานะเป็นอนุมัติ (approved) เพื่อให้ระบบอื่นทราบว่าเป็นแบบไฟนอล
    projects[projectIndex].status = "approved";
    projects[projectIndex].approvedAt = new Date().toISOString();

    writeProjects(projects); // บันทึกลงดิสก์ projects.json

    return res.status(200).json({
      success: true,
      projectId,
      status: "approved",
      message: "โครงการได้รับการตรวจสอบและยืนยันอนุมัติขั้นสุดท้ายเรียบร้อย"
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกอนุมัติโครงการ:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบหลังบ้าน ไม่สามารถบันทึกอนุมัติโครงการได้"
    });
  }
}
```

---

## 4. UI/UX Inline Editing Specifications (การแก้ไขบนหน้าจอ)

เพื่อความเป็นมิตรต่อผู้ใช้งานสูงสุด (User Friendly UI) ฝั่งหน้าจอจะใช้คุณลักษณะการแสดงผลดังนี้:
* **Editable Fields (ช่องแก้ไขข้อมูล):**
  * ในตารางเรนเดอร์ข้อมูลสเปกทุกแท็บ ตัวหนังสือหัวข้อหลักและคำอธิบายจะถูกครอบไว้ในรูปแบบฟอร์มแก้ไขเบื้องต้น หรือใช้พารามิเตอร์ HTML5 `contenteditable="true"` ร่วมกับคลาส CSS ที่ระบุขอบบางสีเทา
  * เมื่อนำเมาส์ไปคลิกที่ตัวหนังสือ ข้อความจะกลายเป็นช่องรับข้อมูลทันที และมีไอคอนดินสอตัวจิ๋วแสดงบอกสถานะการแก้ไขได้
* **Approve & Lock State UI:**
  * เมื่อผู้ใช้กดปุ่ม `"Approve Final Spec"` และได้รับการตอบกลับยืนยันสำเร็จ ระบบจะต้องปิดโหมดการแก้ไข (เปลี่ยน `contenteditable` เป็น `false` หรือซ่อนอินพุตฟิลด์)
  * แสดงป้ายประทับหัวข้อมุมบนเด่นชัดสีเขียว: `"[APPROVED FINAL]"`
  * เปิดการใช้งานปุ่มดาวน์โหลดรายงาน (Export buttons) เพื่อนำไปใช้งานขั้นถัดไป

---

## 5. Test-Driven Development (TDD) & UAT Scenarios

### 5.1 Gherkin Test Scenarios

#### Scenario 1: การอนุญาตให้ BSA แก้ไขข้อมูลบนหน้าจอและส่งบันทึกสำเร็จ (UAT: BSA Edit & Approval Flow)
* **Given** ผู้ใช้งานตรวจสอบผลลัพธ์การวิเคราะห์ของ AI ในหน้าจอ Screen 4 สำเร็จ
* **When** ผู้ใช้งานคลิกแก้ไขข้อความสโลแกนในแท็บ Marketing เป็นคำใหม่
* **And** ผู้ใช้งานคลิกปุ่มสีน้ำเงินครามระบุข้อความ `"Approve Final Spec"`
* **Then** ระบบต้องทำการยิงคำร้องแบบ `PUT` ส่งข้อมูลข้อความสโลแกนตัวใหม่ไปยังหลังบ้าน
* **And** ข้อมูลในไฟล์ `projects.json` ต้องมีข้อความตัวใหม่แทนที่คำเดิม
* **And** สถานะโครงการต้องปรับเป็น `"status": "approved"`

#### Scenario 2: การปิดกั้นแก้ไขและแสดงเครื่องหมายอนุมัติสำเร็จบนหน้าจอ (UAT: Lock UI after approval)
* **Given** ข้อมูลโครงการรหัส `"PRJ-2026-001"` มีสถานะในระบบเป็น `"approved"` แล้ว
* **When** ผู้ใช้ทำการเปิดหน้าจอแสดงผลลัพธ์ของโครงการนี้
* **Then** ฟิลด์ข้อมูลและตารางสเปกต้องอยู่ในสถานะอ่านอย่างเดียว (Read-only) ไม่อนุญาตให้คีย์แก้ไขตัวอักษรใดๆ
* **And** ปุ่ม Export รายงานประเภทต่างๆ ต้องเปิดสิทธิ์ให้สามารถคลิกกดดาวน์โหลดได้
