# Section 02: Screen 1 - Landing Dashboard & Project Initialization (P1)

## 1. Objectives (วัตถุประสงค์)
สร้างหน้าจอแรกของระบบ **IREBA** โดยทำหน้าที่หลักเป็น **แดชบอร์ดโครงการ (Landing Dashboard & Project History)** เพื่อให้ผู้ใช้งานมองเห็นความคืบหน้าของโครงการที่ผ่านมาทั้งหมด ดึงสเปกรายการโครงการเก่า และสนับสนุนการสร้างโครงการใหม่ผ่านกล่อง Modal ป๊อปอัพ โดยเขียนตรรกะฝั่งลูกข่ายให้สอดคล้องตามสถานะโครงการปัจจุบัน (initialized / documents_uploaded / analyzed / approved)

---

## 2. API Specifications & Data Contracts (ข้อกำหนดทางเทคนิค)

### 2.1 Route Endpoint: ดึงรายการโครงการทั้งหมด
* **Method:** `GET`
* **Path:** `/api/projects`
* **Response Body (Success 200 OK):**
```json
{
  "success": true,
  "projects": [
    {
      "projectId": "PRJ-2026-001",
      "projectName": "FutureShield 99 Implementation",
      "description": "โครงการวิเคราะห์และสกัดข้อมูลแบบประกันภัย",
      "createdAt": "2026-06-12T04:55:07Z",
      "status": "initialized",
      "documents": {
        "productSpec": null,
        "pricingValuation": null,
        "compliance": null
      }
    }
  ]
}
```

### 2.2 Route Endpoint: สร้างโปรเจกต์ใหม่
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

---

## 3. Node.js Backend Code Specifications (ตัวอย่างระบบควบคุมหลังบ้าน)

วิศวกรซอฟต์แวร์สามารถเขียนตรรกะประมวลผลหลังบ้านของ API Controller ในไฟล์ `src/project-controller.js` ดังนี้:

### 3.1 Controller Handler for Project Retrieval & Creation
```javascript
const { readProjects, writeProjects } = require('./dal');

/**
 * API Controller สำหรับดึงโครงการทั้งหมด
 */
function getProjectsController(req, res) {
  try {
    const projects = readProjects();
    return res.status(200).json({ success: true, projects });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงรายการโครงการ:", error);
    return res.status(500).json({ success: false, message: "ไม่สามารถดึงข้อมูลรายการโครงการได้" });
  }
}

/**
 * ฟังก์ชันสร้างรหัส Project ID รันตัวเลขอัตโนมัติในรูปแบบ PRJ-YYYY-XXX
 */
function generateNextProjectId(existingProjects) {
  const currentYear = new Date().getFullYear();
  const prefix = `PRJ-${currentYear}-`;
  
  const projectsThisYear = existingProjects.filter(p => p.projectId.startsWith(prefix));
  
  let nextNumber = 1;
  if (projectsThisYear.length > 0) {
    projectsThisYear.sort((a, b) => a.projectId.localeCompare(b.projectId));
    const lastProject = projectsThisYear[projectsThisYear.length - 1];
    const lastNumberStr = lastProject.projectId.split('-')[2];
    nextNumber = parseInt(lastNumberStr, 10) + 1;
  }
  
  const sequentialId = String(nextNumber).padStart(3, '0');
  return `${prefix}${sequentialId}`;
}

/**
 * API Controller สำหรับสร้างโครงการใหม่
 */
function createProjectController(req, res) {
  const { projectName, description } = req.body;

  if (!projectName || typeof projectName !== 'string' || projectName.trim().length < 3 || projectName.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: "ชื่อโครงการมีความจำเป็นต้องกรอก และต้องมีความยาว 3 ถึง 100 ตัวอักษร"
    });
  }

  try {
    const projects = readProjects();
    const newProjectId = generateNextProjectId(projects);

    const newProject = {
      projectId: newProjectId,
      projectName: projectName.trim(),
      description: description ? description.trim() : "",
      createdAt: new Date().toISOString(),
      status: "initialized",
      documents: { productSpec: null, pricingValuation: null, compliance: null },
      extractedRequirements: null
    };

    projects.push(newProject);
    writeProjects(projects);

    return res.status(201).json({
      success: true,
      projectId: newProjectId,
      message: "โปรเจกต์ได้รับการสร้างและบันทึกข้อมูลเรียบร้อย"
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างโปรเจกต์:", error);
    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในหลังบ้าน ไม่สามารถบันทึกโครงการได้"
    });
  }
}
```

---

## 4. Frontend Client-Side Specification (ระบบการนำทางฝั่งลูกข่าย)

ฝั่งลูกข่าย `public/app.js` ต้องมีลอจิกในการจัดการสลับหน้าและเปลี่ยนผ่านตามสเตทข้อมูลโครงการจริง:

### 4.1 UI State Switching Logic
1. **การดาวน์โหลดประวัติโครงการ (Load History):** เมื่อเริ่มต้นหน้าเว็บ ให้เรียกใช้ `GET /api/projects`
   * หากได้อาร์เรย์ว่าง `[]` -> แสดงหน้าจอ Empty State (ซ่อนตารางโครงการ)
   * หากมีข้อมูลโครงการ -> แสดงตารางโครงการแดชบอร์ด แสดงปุ่ม และป้ายสีสถานะแยกตามค่า `status` (ซ่อนแผง Empty State)
2. **การเปิด Modal สร้างโครงการใหม่:**
   * คลิกปุ่ม "+ New Project" หรือปุ่ม Empty State -> สั่งเปิดกล่องสร้างโปรเจกต์ (ป๊อปอัพ Modal แบบลอย)
3. **ตรรกะการนำทางประวัติโครงการ (Dynamic State Routing):**
   * เมื่อผู้ใช้คลิกเลือกปุ่มเข้าดำเนินการโครงการ ระบบต้องดำเนินการดังนี้:
     * ดึงค่าสถานะ `status` และบันทึกรหัสโครงการเก็บลง `localStorage.setItem('currentProjectId', projectId)`
     * ทำการสลับเปิดหน้าจอ (Screen) และตั้งค่าสถานะสเตตัสบาร์ (Step Progress Indicator) อ้างอิงตามตาราง:
       * `initialized` -> แสดงผล **Screen 2: Document Ingestion** (Step 2 active, Step 1 completed)
       * `documents_uploaded` -> แสดงผล **Screen 3: AI Configuration** (Step 3 active, Step 1 & 2 completed)
       * `analyzed` หรือ `approved` -> แสดงผล **Screen 4: Result Specification** (Step 4 active, Step 1-3 completed)

---

## 5. Test-Driven Development (TDD) & UAT Scenarios

### 5.1 Gherkin Test Scenarios

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
