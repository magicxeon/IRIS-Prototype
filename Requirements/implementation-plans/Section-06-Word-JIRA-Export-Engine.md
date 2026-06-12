# Section 06: Word & JIRA Export Engine (P5)

## 1. Introduction (บทนำ)
ความต้องการในส่วนนี้ครอบคลุมการพัฒนาส่วนงานดาวน์โหลดและส่งออกสเปกสุดท้ายที่ได้รับการอนุมัติ (Approved Spec) ออกมาเป็น 2 ประเภทหลัก:
1. **JIRA Import CSV:** ไฟล์ตารางข้อมูลสำหรับให้ทีมพัฒนานำเข้าไปนำเสนอเป็นตั๋วงาน (Tickets) ในโปรแกรม JIRA (JIRA Issue Import) ได้อย่างรวดเร็ว
2. **Word Document (.docx):** ไฟล์เอกสารข้อกำหนดความต้องการซอฟต์แวร์ (SRS) ในรูปแบบเอกสาร Word สำหรับใช้บันทึกเป็นเอกสารรายงานของหน่วยงาน

---

## 2. JIRA Export Specifications (สเปกการแปลงไฟล์ JIRA CSV)

การส่งออกข้อมูลอ้างอิงของ JIRA จะแปลงผลลัพธ์ JSON ออกมาเป็นไฟล์ตาราง CSV (Comma-Separated Values) โดยใช้พาสเซสโครงสร้างหัวตาราง (Headers) ที่เป็นไปตามมาตรฐานการ Import ของ JIRA ดังนี้:

### 2.1 JIRA Header Mappings (การแมปข้อมูลโครงสร้าง)
* **Summary:** หัวข้อชื่อตั๋วงาน รูปแบบ: `"[IREBA - รหัสความต้องการ] ชื่อฟีเจอร์ย่อย"` 
  * *ตัวอย่าง:* `"[IREBA - REQ-QQ-001] Input: Age Validation"`
* **Description:** คำอธิบายรายละเอียดสเปกและเกณฑ์ UAT โดยแปลงข้อความแบบมีขึ้นบรรทัดใหม่
  * *ตัวอย่าง:* `"คำอธิบาย: อายุผู้เอาประกันภัย\nขีดจำกัดตัวแปร: Min 1 - Max 75 ปี\nแหล่งข้อมูลอ้างอิง: Product Spec"`
* **Issue Type:** กำหนดค่าเริ่มต้นเป็น `"Story"` หรือ `"Task"`
* **Priority:** กำหนดค่าเริ่มต้นเป็น `"Medium"`

---

## 3. Node.js Export Reference Skeletons (โค้ดอ้างอิงการจัดทำ)

โค้ดระบบหลังบ้านสำหรับการประมวลผลคำขอและส่งคืนข้อมูลในลักษณะของการบังคับให้ดาวน์โหลดไฟล์ผ่าน Web Browser:

### 3.1 Controller for JIRA CSV Export
```javascript
const { readProjects } = require('./dal');

/**
 * API Controller สำหรับแปลง Requirement JSON เป็น JIRA CSV
 */
function exportJiraCsvController(req, res) {
  const { projectId } = req.params;

  try {
    const projects = readProjects();
    const project = projects.find(p => p.projectId === projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่อ้างอิง" });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ success: false, message: "โครงการนี้ยังไม่ได้รับการอนุมัติอนุมัติสเปกขั้นสุดท้าย" });
    }

    const requirements = project.extractedRequirements;
    
    // 1. ตั้งหัวข้อ CSV Headers ตามเกณฑ์ของ JIRA
    let csvContent = "Summary,Description,Issue Type,Priority\n";

    // ฟังก์ชันช่วยจัดการเครื่องหมายอัญประกาศภายในข้อความ CSV
    const escapeCsv = (str) => `"${String(str).replace(/"/g, '""')}"`;

    // 2. จัดรูปแบบความต้องการย่อยของ Quick Quote (REQ-QQ-xxx)
    if (requirements.quickQuote && requirements.quickQuote.validationRules) {
      const rules = requirements.quickQuote.validationRules;
      Object.keys(rules).forEach(field => {
        const item = rules[field];
        const summary = escapeCsv(`[IREBA - Quick Quote] ${field} Validation`);
        const desc = escapeCsv(
          `คำอธิบาย: ${item.errorMessage || 'ข้อกำหนดความถูกต้อง'}\n` +
          `เกณฑ์จำกัด: Min ${item.min} - Max ${item.max} (${item.unit})\n` +
          `ชนิดข้อมูล: ${item.dataType}`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      });
    }

    // 3. จัดรูปแบบความต้องการย่อยของ Calculation (REQ-CAL-xxx)
    if (requirements.productCalculation && requirements.productCalculation.formulas) {
      const formulas = requirements.productCalculation.formulas;
      Object.keys(formulas).forEach(calcName => {
        const formulaStr = formulas[calcName];
        const summary = escapeCsv(`[IREBA - Calculation] ${calcName} Formula`);
        const desc = escapeCsv(`สูตรประมวลผล: ${formulaStr}\nกรุณาเขียนโปรแกรมคำนวณเบี้ยประกันหลังบ้านตามหลักคณิตศาสตร์ประกันภัยสูตรนี้`);
        csvContent += `${summary},${desc},Task,High\n`;
      });
    }

    // 4. ตั้งค่าหัวเรื่องสำหรับบังคับดาวน์โหลดไฟล์
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=JIRA_Import_${projectId}.csv`);
    
    // บรรจุ byte order mark (BOM) เพื่อให้ Microsoft Excel อ่านภาษาไทยถูกต้อง
    return res.status(200).send('\uFEFF' + csvContent);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งออก CSV:", error);
    return res.status(500).send("ระบบขัดข้องในการสร้างไฟล์ส่งออก");
  }
}
```

### 3.2 Specification for Word Export (ทางเลือกการสร้างไฟล์ Word)
วิศวกรซอฟต์แวร์สามารถประยุกต์ใช้วิธีการเขียนสตรีมไฟล์เพื่อประหยัดหน่วยความจำบน Vercel และไม่เปลืองเนื้อที่ลงแพ็กเกจหนักๆ โดยการส่งกลับข้อมูลโครงสร้างรูปแบบ HTML พร้อมกำหนด MIME Type เป็น Word:
* **Mime-type:** `application/msword`
* **ระบบหลังบ้าน:** 
  * ทำการสร้างเทมเพลต HTML ที่รองรับการจัดเอกสารสเปกหลัก มีโครงสร้าง `<table>`, `<h1>`, `<blockquote>` สอดรับตามดีไซน์ซิสเต็ม
  * ส่งข้อมูลเนื้อหา HTML ที่ปาร์สข้อมูลสเปกสำเร็จกลับไปในรูปแบบ Stream
  * เมื่อ Microsoft Word ทำการเปิดไฟล์ดังกล่าว จะแปลงโครงสร้างข้อมูล HTML เป็นโครงสร้างเอกสาร Word ให้อัตโนมัติ

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: ข้อมูลส่งออก JIRA CSV มีหัวตารางถูกต้องและแสดงอักษรภาษาไทยไม่เพี้ยน (UAT: JIRA CSV Data Integrity)
* **Given** โครงการรหัส `"PRJ-2026-001"` อนุมัติข้อมูลสเปกสำเร็จเรียบร้อยแล้ว
* **When** ผู้ใช้งานคลิกปุ่มดาวน์โหลด `"Export as JIRA CSV"`
* **Then** บราวเซอร์ต้องได้รับผลดาวน์โหลดเป็นไฟล์สกุล `.csv`
* **And** แถวแรกสุดของไฟล์ต้องมีข้อความระบุถึงหัวตาราง JIRA: `Summary,Description,Issue Type,Priority`
* **And** อักษรภาษาไทยในคำอธิบายสเปกต้องเข้ารหัสแบบ `UTF-8` และแสดงรายละเอียดขอบเขตครบถ้วนไม่เพี้ยนเมื่อเปิดดู

#### Scenario 2: การปฏิเสธดาวน์โหลดเมื่อโครงการยังไม่ได้ Approve (UAT: Block Export before Approval)
* **Given** โครงการรหัส `"PRJ-2026-001"` ยังมีสถานะการทำงานในระบบเป็น `"analyzed"` (ยังไม่ได้ ApproveFinal)
* **When** มีการยิงคำขอเพื่อขอสกัด CSV ที่พาธ `/api/projects/PRJ-2026-001/export/jira`
* **Then** ระบบต้องไม่ดำเนินการสร้างไฟล์
* **And** ส่ง Http Code กลับเป็น `400 Bad Request` พร้อมข้อความแจ้งเตือนสีแดงระบุว่าต้องทำการอนุมัติสเปกก่อน
