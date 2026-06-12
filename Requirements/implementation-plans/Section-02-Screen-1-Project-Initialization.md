# Section 02: Screen 1 - Project Initialization (P1)

## 1. Objectives (วัตถุประสงค์)
สร้างหน้าจอกรอกข้อมูลโครงการเริ่มต้น (Screen 1) และเขียนตรรกะระบบควบคุมหลังบ้าน (Controller API) เพื่อตรวจสอบความถูกต้องของข้อมูลนำเข้า สร้างรหัสโครงการอัตโนมัติ (Project ID) และทำการเพิ่มประวัติลงฐานข้อมูล Flat-file JSON

---

## 2. API Specifications & Data Contracts (ข้อกำหนดทางเทคนิค)

### 2.1 Route Endpoint: สร้างโปรเจกต์ใหม่
* **Method:** `POST`
* **Path:** `/api/projects`
* **Request Header:** `Content-Type: application/json`
* **Request Body Payload:**
```json
{
  "projectName": "FutureShield 99 Implementation",
  "description": "วิเคราะห์การทำใบเสนอขายประกันภัยประจำปี 2026"
}
```
* **Response Body (Success 201 Created):**
```json
{
  "success": true,
  "projectId": "PRJ-2026-001",
  "message": "โปรเจกต์ได้รับการสร้างและบันทึกข้อมูลเรียบร้อย"
}
```
* **Response Body (Error 400 Bad Request):**
```json
{
  "success": false,
  "message": "ชื่อโครงการมีความจำเป็นต้องกรอก และต้องมีความยาว 3 ถึง 100 ตัวอักษร"
}
```

---

## 3. Node.js Backend Skeleton Code (โค้ดควบคุมทางเทคนิค)

วิศวกรซอฟต์แวร์สามารถเขียนตรรกะประมวลผลหลังบ้านของ API Controller อ้างอิงตามรูปแบบดังต่อไปนี้:

### 3.1 Controller Handler for Project Creation
```javascript
const { readProjects, writeProjects } = require('./dal'); // อ้างอิงโมดูลจาก Section 01

/**
 * ฟังก์ชันสร้างรหัส Project ID รันตัวเลขอัตโนมัติในรูปแบบ PRJ-YYYY-XXX
 */
function generateNextProjectId(existingProjects) {
  const currentYear = new Date().getFullYear();
  const prefix = `PRJ-${currentYear}-`;
  
  // ค้นหาโครงการในปีปัจจุบัน เพื่อรันหมายเลขถัดไป
  const projectsThisYear = existingProjects.filter(p => p.projectId.startsWith(prefix));
  
  let nextNumber = 1;
  if (projectsThisYear.length > 0) {
    // คัดกรองตัวเลข 3 ตัวหลังสุดของรหัสโครงการล่าสุดของปีนี้
    const lastProject = projectsThisYear[projectsThisYear.length - 1];
    const lastNumberStr = lastProject.projectId.split('-')[2];
    nextNumber = parseInt(lastNumberStr, 10) + 1;
  }
  
  // ปัดตัวเลขให้ได้ 3 ตำแหน่ง เช่น 001, 002
  const sequentialId = String(nextNumber).padStart(3, '0');
  return `${prefix}${sequentialId}`;
}

/**
 * API Controller สำหรับสร้างโครงการใหม่
 */
function createProjectController(req, res) {
  const { projectName, description } = req.body;

  // 1. ตรรกะตรวจสอบข้อมูลเข้า (Validation Rule)
  if (!projectName || typeof projectName !== 'string' || projectName.trim().length < 3 || projectName.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "ชื่อโครงการมีความจำเป็นต้องกรอก และต้องมีความยาว 3 ถึง 100 ตัวอักษร"
    });
  }

  try {
    const projects = readProjects();
    const newProjectId = generateNextProjectId(projects);

    // 2. สร้างโครงสร้างข้อมูลโครงการตั้งต้นตาม BRS
    const newProject = {
      projectId: newProjectId,
      projectName: projectName.trim(),
      description: description ? description.trim() : "",
      createdAt: new Date().toISOString(),
      status: "initialized",
      documents: {
        productSpec: null,
        pricingValuation: null,
        compliance: null
      }
    };

    projects.push(newProject);
    writeProjects(projects); // บันทึกข้อมูลโครงการอัปเดตลง JSON

    return res.status(201).json({
      success: true,
      projectId: newProjectId,
      message: "โปรเจกต์ได้รับการสร้างและบันทึกข้อมูลเรียบร้อย"
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างโปรเจกต์:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในระบบหลังบ้าน ไม่สามารถบันทึกโครงการได้"
    });
  }
}
```

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: การคำนวณหมายเลขลำดับโครงการถัดไปถูกต้องเมื่อปีปัจจุบันเปลี่ยน (UAT: Auto Sequence ID Generation)
* **Given** ระบบทำการจัดเก็บโครงการเก่าในไฟล์ `projects.json` ไว้เป็นอาเรย์ว่างเปล่า
* **When** ผู้ใช้งานคนแรกทำเรื่องลงทะเบียนโครงการใหม่เข้ามาในปี 2026
* **Then** ระบบต้องสร้างรหัส Project ID เป็นตัวหนังสือมีค่าคือ `"PRJ-2026-001"`
* **And** หากมีผู้ใช้งานอีกคนทำเรื่องลงทะเบียนโครงการถัดมาในปีเดียวกัน ระบบต้องรันเลขรหัสเป็น `"PRJ-2026-002"`

#### Scenario 2: การตรวจสอบและส่งข้อความเตือนเมื่ออินพุตไม่เข้าเกณฑ์ (UAT: API Validation Error)
* **Given** ระบบเตรียมรับสัญญาณยิงคำร้องที่ Endpoint `/api/projects`
* **When** คำร้องถูกส่งเข้ามาโดยมีฟิลด์ `projectName` เป็นตัวอักษรว่าง
* **Then** ผลลัพธ์ตอบกลับจาก API ต้องแสดงสถานะ Http Code เป็น `400 Bad Request`
* **And** ภายในข้อมูลตอบกลับต้องมีฟิลด์ `success = false` พร้อมข้อความแจ้งรายละเอียดเตือนความผิดพลาด
