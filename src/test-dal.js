// Set test database environment BEFORE loading any modules
process.env.DATA_STORAGE_PATH = './data/test';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load environment variables if any (using dotenv if available)
try {
  require('dotenv').config();
} catch (e) {
  // Ignore if not installed yet
}

const dal = require('./dal');

async function runTests() {
  console.log("=== เริ่มการทดสอบ Data Access Layer (DAL) ===");

  // -------------------------------------------------------------
  // Scenario 1: ตรวจสอบการจัดตั้งพาธไปที่โฟลเดอร์ /tmp เมื่อรันบน Vercel
  // -------------------------------------------------------------
  console.log("\n[Scenario 1] ตรวจสอบระบบย้ายพาธไปที่ /tmp เมื่อรันบน Vercel...");
  
  // จำลองตัวแปรสภาพแวดล้อม Vercel
  process.env.VERCEL = "1";
  
  const vercelPath = dal.getStorageFilePath();
  const vercelUploadDir = dal.getUploadCacheDir();
  
  console.log(`- Vercel storage file path: ${vercelPath}`);
  console.log(`- Vercel upload cache dir: ${vercelUploadDir}`);
  
  try {
    assert(vercelPath.startsWith('/tmp') || vercelPath.startsWith('\\tmp'), "พาธสำหรับ Vercel ต้องนำหน้าด้วย /tmp");
    assert(vercelUploadDir.startsWith('/tmp') || vercelUploadDir.startsWith('\\tmp'), "พาธสำหรับ Vercel upload cache ต้องนำหน้าด้วย /tmp");
    
    // ตรวจสอบว่าสร้างโฟลเดอร์ได้จริง
    assert(fs.existsSync(path.dirname(vercelPath)), "โฟลเดอร์สำหรับ Vercel storage path ต้องถูกสร้างขึ้นจริง");
    assert(fs.existsSync(vercelUploadDir), "โฟลเดอร์สำหรับ Vercel upload cache ต้องถูกสร้างขึ้นจริง");
    
    console.log("=> Scenario 1: ผ่าน (SUCCESS)");
  } catch (error) {
    console.error("=> Scenario 1: ล้มเหลว (FAILED):", error.message);
  } finally {
    // ล้างตัวแปรจำลอง
    delete process.env.VERCEL;
  }

  // -------------------------------------------------------------
  // Scenario 2: การอ่านและบันทึกข้อมูลโครงการแบบ Flat-file JSON
  // -------------------------------------------------------------
  console.log("\n[Scenario 2] ตรวจสอบการอ่านและบันทึกข้อมูลโครงการ...");
  
  const testProjects = [
    {
      projectId: "PRJ-TEST-999",
      name: "โครงการประกันภัยทดสอบ",
      status: "initialized",
      documents: {},
      createdDate: new Date().toISOString()
    }
  ];

  try {
    // ทดสอบเขียนข้อมูล
    const writeResult = dal.writeProjects(testProjects);
    assert.strictEqual(writeResult, true, "ฟังก์ชัน writeProjects ต้องคืนค่า true");
    
    // ทดสอบอ่านข้อมูลกลับมา
    const readResult = dal.readProjects();
    assert(Array.isArray(readResult), "ข้อมูลที่อ่านได้ต้องเป็น Array");
    
    const foundProject = readResult.find(p => p.projectId === "PRJ-TEST-999");
    assert(foundProject, "ต้องพบโครงการ PRJ-TEST-999 ที่เซฟไว้");
    assert.strictEqual(foundProject.name, "โครงการประกันภัยทดสอบ", "ชื่อโครงการต้องถูกต้องตรงกัน");
    assert.strictEqual(foundProject.status, "initialized", "สถานะโครงการต้องถูกต้องตรงกัน");
    
    console.log("=> Scenario 2: ผ่าน (SUCCESS)");
  } catch (error) {
    console.error("=> Scenario 2: ล้มเหลว (FAILED):", error.message);
  }

  // Clean up test file
  const testFile = dal.getStorageFilePath();
  if (fs.existsSync(testFile)) {
    try {
      fs.unlinkSync(testFile);
      console.log(`- ล้างไฟล์ทดสอบที่: ${testFile}`);
    } catch (e) {}
  }

  console.log("\n=== การทดสอบเสร็จสิ้น ===");
}

runTests().catch(console.error);
