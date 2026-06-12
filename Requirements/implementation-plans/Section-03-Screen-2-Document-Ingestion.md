# Section 03: Screen 2 - Document Ingestion (P2)

## 1. Objectives (วัตถุประสงค์)
สร้างหน้าจอสำหรับลากและอัปโหลดไฟล์ข้อกำหนดประกันภัย (Screen 2) และสร้างระบบหลังบ้านเพื่อรับส่งไฟล์แบบ Multipart Form-Data ทำการตรวจสอบความปลอดภัยของไฟล์ (ขนาดและนามสกุลไฟล์) เก็บรักษาไฟล์ลงโฟลเดอร์จัดเก็บชั่วคราว (Cache) และแก้ไขสถานะข้อมูลของโครงการลงฐานข้อมูล Flat-file JSON

---

## 2. API Specifications & Data Contracts (ข้อกำหนดทางเทคนิค)

### 2.1 Route Endpoint: อัปโหลดไฟล์เอกสารประจำโครงการ
* **Method:** `POST`
* **Path:** `/api/projects/:projectId/upload`
* **Request Header:** `Content-Type: multipart/form-data`
* **Request Parameter:** `:projectId` (เช่น `PRJ-2026-001`)
* **Form Data Payload:**
  * `docType` (string): ตัวเลือกค่าที่กำหนดคือ `"productSpec"` | `"pricingValuation"` | `"compliance"`
  * `file` (binary): ไฟล์เอกสารขีดจำกัดขนาดไม่เกิน 10 MB
* **Response Body (Success 200 OK):**
```json
{
  "success": true,
  "projectId": "PRJ-2026-001",
  "document": {
    "fileName": "Product Specification - FutureShield 99.docx",
    "fileSize": 13842,
    "uploadedAt": "2026-06-12T04:56:00Z"
  },
  "message": "อัปโหลดไฟล์ข้อกำหนดและบันทึกข้อมูลเรียบร้อย"
}
```

### 2.2 Route Endpoint: ลบไฟล์เอกสารประจำโครงการ
* **Method:** `DELETE`
* **Path:** `/api/projects/:projectId/documents/:docType`
* **Request Parameter:** `:projectId` (เช่น `PRJ-2026-001`), `:docType` (เช่น `productSpec`)
* **Response Body (Success 200 OK):**
```json
{
  "success": true,
  "projectId": "PRJ-2026-001",
  "message": "ลบไฟล์ออกจากระบบเรียบร้อย"
}
```

---

## 3. Node.js Backend Skeleton Code (โค้ดควบคุมทางเทคนิค)

นี่คือสเปกโค้ดอ้างอิงของระบบการอัปโหลดไฟล์โดยใช้ไลบรารี `multer` และเชื่อมโยงกับการจัดเก็บข้อมูลโครงการ:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readProjects, writeProjects } = require('./dal');

// กำหนดพาธจัดเก็บไฟล์แคชอ้างอิงตาม Section 01
const getUploadCacheDir = () => {
  const isVercel = process.env.VERCEL || process.env.NOW_BUILD_TRIGGER || fs.existsSync('/var/task');
  const targetDir = isVercel ? '/tmp/uploads' : (process.env.UPLOAD_CACHE_PATH || './uploads');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

// ตั้งค่า Multer Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadCacheDir());
  },
  filename: (req, file, cb) => {
    // กำหนดชื่อสุ่มเพิ่มความปลอดภัย
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// กรองประเภทนามสกุลไฟล์
const fileFilter = (req, file, cb) => {
  const allowedExtensions = {
    productSpec: ['.pdf', '.docx', '.md'],
    pricingValuation: ['.pdf', '.csv', '.xlsx'],
    compliance: ['.pdf', '.docx']
  };

  const docType = req.body.docType;
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions[docType] || !allowedExtensions[docType].includes(ext)) {
    return cb(new Error(`ประเภทไฟล์สำหรับ ${docType} ไม่ถูกต้อง นามสกุลที่อนุญาตคือ ${allowedExtensions[docType].join(', ')}`), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // ขีดจำกัด 10 MB
}).single('file');

/**
 * Controller สำหรับอัปโหลดไฟล์
 */
function uploadFileController(req, res) {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { projectId } = req.params;
    const { docType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "กรุณาส่งไฟล์เอกสารที่ต้องการอัปโหลด" });
    }

    try {
      const projects = readProjects();
      const projectIndex = projects.findIndex(p => p.projectId === projectId);
      
      if (projectIndex === -1) {
        // ลบไฟล์ทิ้งหากไม่พบโครงการในระบบ
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: "ไม่พบโครงการที่อ้างอิง" });
      }

      // บันทึกรายละเอียดไฟล์และเปลี่ยนสถานะโครงการเป็น documents_uploaded
      projects[projectIndex].documents[docType] = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString(),
        tempPath: req.file.path // จัดเก็บที่อยู่ไฟล์แคชบนเซิร์ฟเวอร์ชั่วคราว
      };
      
      projects[projectIndex].status = "documents_uploaded";
      writeProjects(projects);

      return res.status(200).json({
        success: true,
        projectId,
        document: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: projects[projectIndex].documents[docType].uploadedAt
        },
        message: "อัปโหลดไฟล์ข้อกำหนดและบันทึกข้อมูลเรียบร้อย"
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการนำเข้าไฟล์" });
    }
  });
}
```

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: การสแกนกรองปฏิเสธเมื่อขนาดไฟล์เกิดพารามิเตอร์จำกัด (UAT: API Max File Size Check)
* **Given** ระบบทำการจัดตั้งระบบ Endpoint `/api/projects/PRJ-2026-001/upload`
* **When** ผู้ใช้งานส่งคำร้องแนบไฟล์ขนาด 11 MB ผ่าน Multipart Form-Data
* **Then** ระบบ Multer ต้องทำการบล็อกไฟล์และส่ง Http Code กลับคืนเป็น `400 Bad Request`
* **And** ข้อความแจ้งผลลัพธ์ต้องระบุชัดเจนถึงขนาดของไฟล์

#### Scenario 2: การอัปโหลดลบไฟล์และเคลียร์ไฟล์ใน Cache (UAT: API Delete File verification)
* **Given** ข้อมูลโปรเจกต์ระบุพาร์ทไฟล์เอกสาร Product Spec ชี้ไปที่ `/tmp/uploads/file-xyz.docx`
* **When** คำร้องของ Endpoint `DELETE /api/projects/PRJ-2026-001/documents/productSpec` ถูกส่งเข้ามา
* **Then** ระบบหลังบ้านต้องตรวจสอบและลบไฟล์ `/tmp/uploads/file-xyz.docx` ออกจากดิสก์จริง
* **And** อัปเดตข้อมูลตัวแปร `productSpec` ใน `projects.json` กลับเป็นค่า `null`
