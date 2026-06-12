// Set test database environment BEFORE loading any modules
process.env.DATA_STORAGE_PATH = './data/test';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { deleteFileController } = require('./upload-controller');
const dal = require('./dal');

// Load env variables
try {
  require('dotenv').config();
} catch (e) {}

async function runTests() {
  console.log("=== เริ่มการทดสอบ Screen 2 Document Ingestion (TDD) ===");

  // -------------------------------------------------------------
  // Scenario 2: การอัปโหลดลบไฟล์และเคลียร์ไฟล์ใน Cache (UAT: API Delete File verification)
  // -------------------------------------------------------------
  console.log("\n[Scenario 2] ตรวจสอบการลบไฟล์และล้างพื้นที่ Cache...");

  const testProjectId = "PRJ-TEST-UPLOAD";
  
  // 1. สร้างโฟลเดอร์แคชสำหรับอัปโหลด และสร้างไฟล์จำลอง
  const cacheDir = dal.getUploadCacheDir();
  const dummyFilePath = path.join(cacheDir, `test-spec-${Date.now()}.docx`);
  fs.writeFileSync(dummyFilePath, "dummy content", "utf-8");
  console.log(`- สร้างไฟล์จำลองเพื่อทดสอบที่: ${dummyFilePath}`);
  assert(fs.existsSync(dummyFilePath), "ไฟล์จำลองต้องถูกสร้างสำเร็จ");

  // 2. เซ็ตข้อมูลเริ่มต้นโปรเจกต์ทดสอบใน database
  const initialProjects = [
    {
      projectId: testProjectId,
      projectName: "โครงการทดสอบไฟล์อัปโหลด",
      status: "documents_uploaded",
      documents: {
        productSpec: {
          fileName: "Product Spec Test.docx",
          fileSize: 13,
          uploadedAt: new Date().toISOString(),
          tempPath: dummyFilePath
        },
        pricingValuation: null,
        compliance: null
      }
    }
  ];
  dal.writeProjects(initialProjects);

  // 3. จำลองการเรียกใช้งาน deleteFileController
  let statusResult = 0;
  let jsonResult = {};

  const mockReq = {
    params: {
      projectId: testProjectId,
      docType: "productSpec"
    }
  };

  const mockRes = {
    status: function(code) {
      statusResult = code;
      return this;
    },
    json: function(data) {
      jsonResult = data;
      return this;
    }
  };

  // เรียกใช้คอนโทรลเลอร์
  deleteFileController(mockReq, mockRes);

  console.log(`- ผลลัพธ์ API Delete: Status ${statusResult}, success = ${jsonResult.success}`);
  
  try {
    // ยืนยันสถานะ HTTP 200 OK
    assert.strictEqual(statusResult, 200, "ควรส่งค่ากลับเป็น Status 200");
    assert.strictEqual(jsonResult.success, true, "ผลลัพธ์ success ควรเป็น true");

    // ยืนยันว่าไฟล์ในแคชโดนลบจริง
    const fileExistsAfterDelete = fs.existsSync(dummyFilePath);
    console.log(`- ตรวจพบไฟล์หลังเรียกลบ: ${fileExistsAfterDelete}`);
    assert.strictEqual(fileExistsAfterDelete, false, "ไฟล์แคชต้องถูกลบออกจากดิสก์จริง");

    // ยืนยันว่าอัปเดตข้อมูลใน projects.json กลับเป็น null และกลับเป็น initialized
    const updatedProjects = dal.readProjects();
    const targetProject = updatedProjects.find(p => p.projectId === testProjectId);
    
    assert(targetProject, "ต้องพบโปรเจกต์ทดสอบ");
    assert.strictEqual(targetProject.documents.productSpec, null, "ค่าของ productSpec ต้องเปลี่ยนกลับเป็น null");
    assert.strictEqual(targetProject.status, "initialized", "สถานะโครงการต้องปรับลดกลับมาเป็น initialized เนื่องจากไม่มีเอกสารเหลือ");

    console.log("=> Scenario 2: ผ่าน (SUCCESS)");
  } catch (error) {
    console.error("=> Scenario 2: ล้มเหลว (FAILED):", error.message);
  } finally {
    // ล้างไฟล์ทดสอบหากยังตกค้าง
    if (fs.existsSync(dummyFilePath)) {
      try {
        fs.unlinkSync(dummyFilePath);
      } catch (e) {}
    }
    
    // ล้างไฟล์ฐานข้อมูลทดสอบ
    const testFile = dal.getStorageFilePath();
    if (fs.existsSync(testFile)) {
      try {
        fs.unlinkSync(testFile);
        console.log(`- ล้างไฟล์ทดสอบที่: ${testFile}`);
      } catch (e) {}
    }
  }

  console.log("\n=== การทดสอบเสร็จสิ้น ===");
}

runTests().catch(console.error);
