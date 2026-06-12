// Set test database environment BEFORE loading any modules
process.env.DATA_STORAGE_PATH = './data/test';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { generateNextProjectId } = require('./project-controller');

// Load environment variables if any
try {
  require('dotenv').config();
} catch (e) {
  // Ignore
}

async function runTests() {
  console.log("=== เริ่มการทดสอบ Screen 1 Project Initialization (TDD) ===");

  // -------------------------------------------------------------
  // Scenario 1: การคำนวณหมายเลขลำดับโครงการถัดไปถูกต้องเมื่อปีปัจจุบันเปลี่ยน (Auto Sequence ID Generation)
  // -------------------------------------------------------------
  console.log("\n[Scenario 1] ตรวจสอบความถูกต้องของระบบสร้าง Project ID อัตโนมัติ...");
  
  const currentYear = new Date().getFullYear();
  
  // เคส 1: ฐานข้อมูลว่างเปล่า
  const emptyProjects = [];
  const id1 = generateNextProjectId(emptyProjects);
  console.log(`- เคสฐานข้อมูลว่างเปล่า: ${id1}`);
  assert.strictEqual(id1, `PRJ-${currentYear}-001`, `ต้องได้รับรหัส PRJ-${currentYear}-001`);
  
  // เคส 2: มีโครงการอยู่แล้วในระบบในปีเดียวกัน
  const existingProjects = [
    { projectId: `PRJ-${currentYear}-001`, projectName: "Project A" },
    { projectId: `PRJ-${currentYear}-002`, projectName: "Project B" }
  ];
  const id2 = generateNextProjectId(existingProjects);
  console.log(`- เคสมีโครงการเก่าอยู่แล้ว: ${id2}`);
  assert.strictEqual(id2, `PRJ-${currentYear}-003`, `ต้องได้รับรหัส PRJ-${currentYear}-003`);
  
  // เคส 3: มีโครงการปีอื่นปะปนอยู่ด้วย
  const mixedProjects = [
    { projectId: `PRJ-${currentYear - 1}-001`, projectName: "Old Project A" },
    { projectId: `PRJ-${currentYear - 1}-002`, projectName: "Old Project B" },
    { projectId: `PRJ-${currentYear}-001`, projectName: "Project A" }
  ];
  const id3 = generateNextProjectId(mixedProjects);
  console.log(`- เคสมีโครงการปะปนหลายปี: ${id3}`);
  assert.strictEqual(id3, `PRJ-${currentYear}-002`, `ต้องได้รับรหัส PRJ-${currentYear}-002 โดยไม่สับสนกับของปีเก่า`);

  console.log("=> Scenario 1: ผ่าน (SUCCESS)");

  // -------------------------------------------------------------
  // Scenario 2: การตรวจสอบและส่งข้อความเตือนเมื่ออินพุตไม่เข้าเกณฑ์ (API Validation Error)
  // -------------------------------------------------------------
  console.log("\n[Scenario 2] จำลองการยิง API และตรวจสอบอินพุต (Validation)...");
  
  // Mock request และ response สำหรับทดสอบ createProjectController
  const { createProjectController } = require('./project-controller');
  
  // เคสชื่อโครงการสั้นเกินไป (< 3 ตัวอักษร)
  let statusResult = 0;
  let jsonResult = {};
  
  const mockReqShort = {
    body: { projectName: "Pr", description: "Short Name Test" }
  };
  const mockResShort = {
    status: function(code) {
      statusResult = code;
      return this;
    },
    json: function(data) {
      jsonResult = data;
      return this;
    }
  };
  
  createProjectController(mockReqShort, mockResShort);
  
  console.log(`- ผลการส่งชื่อสั้นเกินไป: Status ${statusResult}, success = ${jsonResult.success}`);
  assert.strictEqual(statusResult, 400, "ควรส่งค่ากลับเป็น Status 400");
  assert.strictEqual(jsonResult.success, false, "success ควรเป็น false");
  assert.notStrictEqual(jsonResult.message, undefined, "ควรระบุข้อความเตือนผู้ใช้งาน");
  
  // เคสชื่อโครงการว่างหรือไม่มี
  const mockReqEmpty = {
    body: { projectName: "", description: "Empty Name Test" }
  };
  createProjectController(mockReqEmpty, mockResShort);
  console.log(`- ผลการส่งชื่อว่างเปล่า: Status ${statusResult}, success = ${jsonResult.success}`);
  assert.strictEqual(statusResult, 400, "ควรส่งค่ากลับเป็น Status 400");
  assert.strictEqual(jsonResult.success, false, "success ควรเป็น false");
  
  console.log("=> Scenario 2: ผ่าน (SUCCESS)");
  
  // Clean up test file
  const dal = require('./dal');
  const testFile = dal.getStorageFilePath();
  if (fs.existsSync(testFile)) {
    try {
      fs.unlinkSync(testFile);
      console.log(`- ล้างไฟล์ทดสอบที่: ${testFile}`);
    } catch (e) {}
  }

  console.log("\n=== การทดสอบทั้งหมดเสร็จสิ้น ===");
}

runTests().catch(console.error);
