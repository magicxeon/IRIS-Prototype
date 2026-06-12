const fs = require('fs');
const path = require('path');
const { readProjects, writeProjects } = require('./dal');

// จำลองการรันเซิร์ฟเวอร์ย่อยสำหรับการทดสอบ API
const express = require('express');
const { approveProjectController } = require('./project-controller');

async function testProjectApproval() {
  console.log("========================================================");
  console.log("🧪 เริ่มการทดสอบการอนุมัติโครงการ (Approve Spec API)");
  console.log("========================================================");

  const testProjectId = "PRJ-TEST-APPROVAL";
  const projects = readProjects();

  // 1. จัดเตรียมโครงการจำลองสำหรับการทดสอบ
  console.log(`[Step 1] กำลังสร้างโครงการทดสอบ ID: ${testProjectId}...`);
  
  // ลบอันเดิมออกหากค้างอยู่ในระบบ
  const cleanProjects = projects.filter(p => p.projectId !== testProjectId);
  
  const mockProject = {
    projectId: testProjectId,
    projectName: "Test Approval Project",
    description: "For testing approveProjectController",
    createdAt: new Date().toISOString(),
    status: "analyzed",
    documents: { productSpec: null, pricingValuation: null, compliance: null },
    extractedRequirements: {
      landingPage: {
        productName: "Original Name",
        tagline: "Original Tagline",
        keyBenefits: [{ title: "Benefit 1", description: "Desc 1" }]
      }
    }
  };

  cleanProjects.push(mockProject);
  writeProjects(cleanProjects);
  console.log("✅ บันทึกโครงการทดสอบตั้งต้นสำเร็จ");

  // 2. ตั้งค่า Express App จำลองสำหรับส่ง Request
  const app = express();
  app.use(express.json());
  app.put('/api/projects/:projectId/approve', approveProjectController);

  const mockUpdatedRequirements = {
    landingPage: {
      productName: "FutureShield 99 Updated",
      tagline: "ความคุ้มครองตลอดชีพที่อัปเดตแล้ว",
      keyBenefits: [
        { title: "Benefit 1 Updated", description: "Desc 1 Updated" },
        { title: "New Benefit 2", description: "Desc 2" }
      ]
    }
  };

  // 3. จำลองการส่ง Request และประมวลผล
  console.log("\n[Step 2] กำลังทดสอบเรียกฟังก์ชัน approveProjectController...");
  
  // จำลอง Request และ Response Object
  const req = {
    params: { projectId: testProjectId },
    body: { updatedRequirements: mockUpdatedRequirements }
  };

  let resStatus = null;
  let resJson = null;

  const res = {
    status: function(code) {
      resStatus = code;
      return this;
    },
    json: function(payload) {
      resJson = payload;
      return this;
    }
  };

  // เรียกใช้คอนโทรลเลอร์
  approveProjectController(req, res);

  // 4. ตรวจสอบผลการเรียกใช้งาน
  console.log(`\n[Step 3] ผลลัพธ์จากการประมวลผล:`);
  console.log(`HTTP Status Code: ${resStatus}`);
  console.log(`Response Payload:`, resJson);

  if (resStatus === 200 && resJson.success === true && resJson.status === "approved") {
    console.log("✅ สำเร็จ: คอนโทรลเลอร์ตอบกลับสำเร็จด้วย HTTP 200");
  } else {
    console.error("❌ ล้มเหลว: คอนโทรลเลอร์ตอบกลับไม่ถูกต้อง");
    return;
  }

  // 5. โหลดค่าใน Database มาตรวจว่าถูกเซฟลง projects.json หรือไม่
  console.log("\n[Step 4] ตรวจสอบการบันทึกข้อมูลและสถานะลง projects.json...");
  const updatedProjects = readProjects();
  const savedProject = updatedProjects.find(p => p.projectId === testProjectId);

  if (savedProject) {
    console.log(`สถานะโปรเจกต์ในฐานข้อมูล: "${savedProject.status}" (ควรเป็น "approved")`);
    console.log(`เวลาประทับที่อนุมัติ (approvedAt): ${savedProject.approvedAt}`);
    console.log(`ชื่อผลิตภัณฑ์หลังอัปเดต: "${savedProject.extractedRequirements.landingPage.productName}"`);
    
    if (
      savedProject.status === "approved" &&
      savedProject.approvedAt &&
      savedProject.extractedRequirements.landingPage.productName === "FutureShield 99 Updated"
    ) {
      console.log("\n✅ ผ่านการตรวจสอบ: ข้อมูลทั้งหมดเซฟลง projects.json อย่างสมบูรณ์และถูกต้อง!");
    } else {
      console.error("❌ ล้มเหลว: ตรวจพบข้อมูลใน database ไม่สมบูรณ์");
    }
  } else {
    console.error("❌ ล้มเหลว: ไม่พบโปรเจกต์ที่เซฟลง database");
  }

  // 6. ลบโครงการจำลองทิ้งเพื่อความเรียบร้อย
  console.log("\n[Step 5] ทำการล้างโครงการทดสอบออกจากฐานข้อมูลเพื่อความสะอาด...");
  const finalProjects = updatedProjects.filter(p => p.projectId !== testProjectId);
  writeProjects(finalProjects);
  console.log("✅ ล้างข้อมูลโครงการทดสอบสำเร็จ");
  console.log("========================================================");
  console.log("🎉 เสร็จสิ้นการตรวจสอบผลทดสอบ!");
  console.log("========================================================");
}

// สั่งรัน
testProjectApproval().catch(console.error);
