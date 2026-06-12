# Section 01: Environment & Data Storage DAL (P0)

## 1. Objectives (วัตถุประสงค์)
ตั้งค่าสภาพแวดล้อม (Environment Configuration) ของระบบ **IREBA** และสร้างชั้นประมวลผลข้อมูล (Data Access Layer - DAL) ในการอ่านและบันทึกประวัติโครงการในไฟล์ `projects.json` โดยออกแบบโครงสร้างให้รองรับการทำงานทั้งบนคอมพิวเตอร์ส่วนบุคคล (Local Dev) และบน Vercel (Serverless Environment)

---

## 2. Environment Configurations (`.env` template)
ทีมนักพัฒนาต้องสร้างไฟล์ `.env` ไว้ที่โฟลเดอร์หลัก (Root Directory) ของโครงการเพื่อเก็บบันทึกค่ากำหนดระบบเหล่านี้:

```bash
# พอร์ตการรันระบบ Local Dev
PORT=3000

# คีย์รับรองการใช้งาน Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# ระบุสภาพแวดล้อมการใช้งาน (development / production)
NODE_ENV=development

# พาธบันทึกไฟล์ฐานข้อมูลจำลอง (จะสลับอัตโนมัติหากรันบน Vercel)
# Local: ./data/projects.json
# Vercel: /tmp/data/projects.json
DATA_STORAGE_PATH=./data

# พาธจัดเก็บไฟล์อัปโหลดแคชชั่วคราว
# Local: ./uploads
# Vercel: /tmp/uploads
UPLOAD_CACHE_PATH=./uploads
```

---

## 3. Data Access Layer (DAL) Reference Skeletons (โค้ดอ้างอิงของชั้นข้อมูล)

เพื่อให้วิศวกรซอฟต์แวร์ (SE) นำไปพัฒนาต่อยอดได้ทันที นี่คือสเปกโครงสร้างลอจิกการแก้ปัญหาการบันทึกข้อมูลของ Vercel Serverless Function (ซึ่งเป็นแบบ Read-Only ยกเว้นโฟลเดอร์ `/tmp`):

### 3.1 Path Resolution Logic (ระบบสลับพาธการจัดเก็บอัตโนมัติ)
```javascript
const path = require('path');
const fs = require('fs');

/**
 * ฟังก์ชันค้นหาและคืนค่าพาธการบันทึกฐานข้อมูล projects.json
 * รองรับการย้ายพาธไปที่ /tmp อัตโนมัติเมื่อตรวจพบการรันบนระบบ Vercel
 */
function getStorageFilePath() {
  const isVercel = process.env.VERCEL || process.env.NOW_BUILD_TRIGGER || fs.existsSync('/var/task');
  
  let targetDir;
  if (isVercel) {
    // กำหนดพาธชั่วคราว /tmp สำหรับ Vercel Serverless
    targetDir = '/tmp/data';
  } else {
    // กำหนดพาธตามค่าที่ตั้งใน .env หรือ fallback ไปยังโฟลเดอร์โครงการ
    targetDir = process.env.DATA_STORAGE_PATH || path.join(__dirname, '../data');
  }

  // สร้างโฟลเดอร์หากยังไม่มีอยู่ในระบบ
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return path.join(targetDir, 'projects.json');
}
```

### 3.2 File Handler Functions (ฟังก์ชันการอ่าน/เขียน JSON)
```javascript
/**
 * ฟังก์ชันอ่านข้อมูลทั้งหมดจาก projects.json
 */
function readProjects() {
  const filePath = getStorageFilePath();
  if (!fs.existsSync(filePath)) {
    // คืนค่าอาร์เรย์ว่างเริ่มต้นหากไม่พบไฟล์ฐานข้อมูล
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอ่านไฟล์โครงการ:", error);
    return [];
  }
}

/**
 * ฟังก์ชันบันทึกชุดข้อมูลโครงการลงในไฟล์ projects.json
 */
function writeProjects(projectsArray) {
  const filePath = getStorageFilePath();
  try {
    const dataString = JSON.stringify(projectsArray, null, 2);
    fs.writeFileSync(filePath, dataString, 'utf-8');
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเขียนไฟล์โครงการ:", error);
    throw new Error("ระบบไม่สามารถบันทึกข้อมูลโครงการลงฐานข้อมูลได้");
  }
}
```

---

## 4. Test-Driven Development (TDD) & Verification Scenarios

### 4.1 UAT & Test Scenarios

#### Scenario 1: ตรวจสอบการจัดตั้งพาธไปที่โฟลเดอร์ /tmp เมื่อรันบน Vercel (DAL Environment Routing)
* **Given** ระบบทำการเซ็ตค่าสถานะการจำลองรันบนเซิร์ฟเวอร์ Vercel (เช่น `process.env.VERCEL` มีค่า)
* **When** เรียกใช้งานฟังก์ชันค้นหาพาธ `getStorageFilePath()`
* **Then** ผลลัพธ์พาธที่ได้รับคืนกลับมาต้องมีคำนำหน้าขึ้นต้นด้วยโครงสร้าง `"/tmp/data/"`
* **And** ระบบต้องทำการสร้างโฟลเดอร์ `/tmp/data` บนพื้นที่บันทึกข้อมูลเรียบร้อย

#### Scenario 2: การอ่านและบันทึกข้อมูลโครงการได้สำเร็จแบบ Flat-file (DAL Read/Write Verification)
* **Given** ระบบจัดเตรียมชุดข้อมูลโครงการว่างเปล่า
* **When** เรียกใช้งานฟังก์ชันบันทึกโครงการ `writeProjects()` พร้อมป้อนอาร์เรย์ข้อมูลทดสอบ
* **Then** ฟังก์ชันต้องส่งค่าคืนกลับมาเป็นผลสำเร็จ (`true`)
* **And** เมื่อทำการเรียกใช้งานฟังก์ชันอ่านข้อมูลโครงการ `readProjects()` ทันที ข้อมูลที่ได้รับกลับมาต้องสอดคล้องกับอาร์เรย์ข้อมูลทดสอบตัวเดิมอย่างถูกต้องครบทุกฟิลด์
