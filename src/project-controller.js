const { readProjects, writeProjects } = require('./dal');

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
    // เรียงลำดับตามรหัสโครงการเพื่อความถูกต้อง
    projectsThisYear.sort((a, b) => a.projectId.localeCompare(b.projectId));
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
      },
      extractedRequirements: null
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

/**
 * API Controller สำหรับดึงข้อมูลโครงการทั้งหมด (ช่วยในการแสดงผล/จัดการ)
 */
function getProjectsController(req, res) {
  try {
    const projects = readProjects();
    return res.status(200).json({
      success: true,
      projects
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงรายการโปรเจกต์:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถดึงข้อมูลรายการโครงการได้"
    });
  }
}

/**
 * API Controller สำหรับดึงรายละเอียดโครงการรายโครงการ
 */
function getProjectByIdController(req, res) {
  const { projectId } = req.params;
  try {
    const projects = readProjects();
    const project = projects.find(p => p.projectId === projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบโครงการที่ต้องการค้นหา"
      });
    }
    return res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลโครงการ:", error);
    return res.status(500).json({
      success: false,
      message: "ไม่สามารถดึงข้อมูลโครงการได้"
    });
  }
}

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

/**
 * Controller สำหรับส่งออกข้อกำหนดเป็นไฟล์ JIRA CSV
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
      return res.status(400).json({ success: false, message: "โครงการนี้ยังไม่ได้รับการอนุมัติขั้นสุดท้าย" });
    }

    const requirements = project.extractedRequirements || {};

    // ฟังก์ชันช่วยจัดการเครื่องหมายอัญประกาศภายในข้อความ CSV
    const escapeCsv = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    // 1. ตั้งหัวข้อ CSV Headers ตามเกณฑ์ของ JIRA
    let csvContent = "Summary,Description,Issue Type,Priority\n";

    // 2. เพิ่มแถวข้อมูลจาก Landing Page
    if (requirements.landingPage) {
      const lp = requirements.landingPage;
      const productName = lp.productName || 'Product';
      const summary = escapeCsv(`[IREBA - Landing Page] ${productName} - Marketing & Identity`);
      const desc = escapeCsv(
        `ชื่อทางการค้า: ${lp.productName || '-'}\n` +
        `คำสโลแกน: ${lp.tagline || '-'}\n` +
        `กลุ่มเป้าหมาย: ${lp.targetAudience || '-'}\n` +
        `จุดเด่นหลัก: ${(lp.keyBenefits || []).map(b => b.title).join(', ')}`
      );
      csvContent += `${summary},${desc},Story,High\n`;

      // เพิ่มแถวสำหรับแต่ละ Key Benefit
      (lp.keyBenefits || []).forEach(b => {
        const s = escapeCsv(`[IREBA - Landing Page] Benefit: ${b.title}`);
        const d = escapeCsv(`หัวข้อ: ${b.title}\nรายละเอียด: ${b.description}`);
        csvContent += `${s},${d},Story,Medium\n`;
      });
    }

    // 3. เพิ่มแถวข้อมูลจาก Quick Quote Validation Rules
    if (requirements.quickQuote) {
      const qq = requirements.quickQuote;
      const rules = qq.validationRules || {};
      Object.keys(rules).forEach(field => {
        const item = rules[field];
        const summary = escapeCsv(`[IREBA - Quick Quote] Input: ${field} Validation`);
        const desc = escapeCsv(
          `คำอธิบาย: กฎการตรวจสอบข้อมูลรับเข้าของ ${field}\n` +
          `ขีดจำกัดตัวแปร: Min ${item.min} - Max ${item.max} (${item.unit || 'N/A'})\n` +
          `ชนิดข้อมูล: ${item.dataType || 'N/A'}\n` +
          `ข้อความแจ้งเตือน: ${item.errorMessage || 'N/A'}`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      });

      if (qq.paymentModes || qq.paymentTerms) {
        const summary = escapeCsv(`[IREBA - Quick Quote] Payment Options Config`);
        const desc = escapeCsv(
          `งวดชำระเบี้ยที่รองรับ: ${qq.paymentModes || '-'}\n` +
          `ระยะเวลาชำระเบี้ย: ${qq.paymentTerms || '-'}`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      }
    }

    // 4. เพิ่มแถวข้อมูลจาก Product Calculation Formulas
    if (requirements.productCalculation) {
      const pc = requirements.productCalculation;
      // รองรับทั้งแบบ flat (schema v2) และ nested (v1)
      const baseFormula = pc.formulaBasePremium || pc.formulas?.basePremium || '-';
      const discountFormula = pc.formulaDiscount || pc.formulas?.discount || '-';
      const totalFormula = pc.formulaTotalPremium || pc.formulas?.totalPremium || '-';

      const summary = escapeCsv(`[IREBA - Calculation] Formula Engine Implementation`);
      const desc = escapeCsv(
        `สูตรประมวลผลเบี้ยประกันฐาน (basePremium): ${baseFormula}\n` +
        `สูตรประมวลผลส่วนลดเบี้ยประกันภัย (discount): ${discountFormula}\n` +
        `สูตรประมวลผลเบี้ยสุทธิต่อปี (totalPremium): ${totalFormula}\n` +
        `กรุณาเขียนโปรแกรมคำนวณเบี้ยประกันหลังบ้านตามหลักคณิตศาสตร์ประกันภัยสูตรนี้`
      );
      csvContent += `${summary},${desc},Task,High\n`;
    }

    // 5. เพิ่มแถวสัญญาเพิ่มเติมที่รองรับ (Supported Riders)
    if (requirements.supportedRiders && requirements.supportedRiders.ridersList) {
      requirements.supportedRiders.ridersList.forEach(rider => {
        const summary = escapeCsv(`[IREBA - Supported Riders] Rider: ${rider.riderName}`);
        const desc = escapeCsv(
          `ชื่อสัญญาเพิ่มเติม: ${rider.riderName}\n` +
          `ประเภท: ${rider.riderType || 'N/A'}\n` +
          `อายุรับประกัน: ${rider.entryAgeMin || 0} - ${rider.entryAgeMax || 0} ปี\n` +
          `อายุคุ้มครองสูงสุด: ถึงอายุ ${rider.renewalAgeLimit || 0} ปี\n` +
          `หมายเหตุการต่ออายุ: ${rider.renewalNote || 'N/A'}`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      });
    }

    // 6. เพิ่มแถวข้อมูลจาก Sale Proposal & Compliance
    if (requirements.saleProposal) {
      const sp = requirements.saleProposal;
      // รองรับทั้งแบบ flat (schema v2) และ nested (v1)
      const maxDeductionLimit = sp.taxDeductionLimit || sp.taxBenefit?.maxDeductionLimit || '-';
      const taxRuleDescription = sp.taxRuleDescription || sp.taxBenefit?.ruleDescription || '-';
      const sectionReference = sp.complianceSectionRef || sp.complianceDisclaimer?.sectionReference || '-';
      const disclaimerText = sp.complianceDisclaimerText || sp.complianceDisclaimer?.disclaimerText || '-';

      const taxSummary = escapeCsv(`[IREBA - Sale Proposal] Tax Benefit Deduction Logic`);
      const taxDesc = escapeCsv(
        `ขีดจำกัดสิทธิ์ลดหย่อนสูงสุด: ${maxDeductionLimit} บาท\n` +
        `สูตรตรรกะ: ${taxRuleDescription}`
      );
      csvContent += `${taxSummary},${taxDesc},Story,Medium\n`;

      const compSummary = escapeCsv(`[IREBA - Compliance] Legal Disclaimer (${sectionReference})`);
      const compDesc = escapeCsv(`อ้างอิง: ${sectionReference}\nข้อความคำเตือน: ${disclaimerText}`);
      csvContent += `${compSummary},${compDesc},Task,Low\n`;

      // ฟิลด์กฎหมายความคุ้มครองเพิ่มเติม
      if (sp.freeLookPeriodDays || sp.incontestabilityPeriodYears || sp.suicideExclusionYears) {
        const summary = escapeCsv(`[IREBA - Compliance] Policy Terms & Clauses`);
        const desc = escapeCsv(
          `ระยะเวลาขอยกเลิก Free-look: ${sp.freeLookPeriodDays || '-'} วัน\n` +
          `ระยะเวลาไม่โต้แย้งความไม่สมบูรณ์: ${sp.incontestabilityPeriodYears || '-'} ปี\n` +
          `ข้อยกเว้นกรณีการฆ่าตัวตาย: ${sp.suicideExclusionYears || '-'} ปี`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      }

      if (sp.premiumHolidayRules || sp.partialSurrenderRules) {
        const summary = escapeCsv(`[IREBA - Compliance] Policy Flexibility`);
        const desc = escapeCsv(
          `สิทธิ์หยุดพักชำระเบี้ย (Premium Holiday): ${sp.premiumHolidayRules || '-'}\n` +
          `สิทธิ์ถอนเงินสดบางส่วน (Partial Surrender): ${sp.partialSurrenderRules || '-'}`
        );
        csvContent += `${summary},${desc},Story,Medium\n`;
      }
    }

    // 7. ตั้งค่าหัวเรื่องสำหรับบังคับดาวน์โหลดไฟล์
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=JIRA_Import_${projectId}.csv`);

    // บรรจุ byte order mark (BOM) เพื่อให้ Microsoft Excel อ่านภาษาไทยได้ถูกต้อง
    return res.status(200).send('\uFEFF' + csvContent);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งออก JIRA CSV:", error);
    return res.status(500).send("ระบบขัดข้องในการสร้างไฟล์ส่งออก");
  }
}

/**
 * Controller สำหรับส่งออกข้อกำหนดเป็น Word Document (HTML → .doc with MIME trick)
 */
function exportWordDocController(req, res) {
  const { projectId } = req.params;

  try {
    const projects = readProjects();
    const project = projects.find(p => p.projectId === projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่อ้างอิง" });
    }

    if (project.status !== 'approved') {
      return res.status(400).json({ success: false, message: "โครงการนี้ยังไม่ได้รับการอนุมัติขั้นสุดท้าย" });
    }

    const reqs = project.extractedRequirements || {};
    const createdDate = new Date(project.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const approvedDate = project.approvedAt ? new Date(project.approvedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

    // สร้างเนื้อหา HTML สำหรับ Word
    let html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>IREBA Insurance Specification: ${project.projectName}</title>
  <style>
    body { font-family: 'TH SarabunPSK', 'Angsana New', 'Cordia New', Arial, sans-serif; font-size: 14pt; margin: 2cm; color: #1a1a2e; }
    h1 { font-size: 24pt; color: #0d3b7a; border-bottom: 3px solid #0d3b7a; padding-bottom: 8pt; }
    h2 { font-size: 18pt; color: #1a3f7a; margin-top: 24pt; border-left: 6px solid #3b82f6; padding-left: 10pt; }
    h3 { font-size: 14pt; color: #2d5089; margin-top: 16pt; }
    p, li { font-size: 13pt; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; margin: 12pt 0; font-size: 12pt; }
    th { background-color: #0d3b7a; color: white; padding: 8pt 10pt; text-align: left; font-weight: bold; }
    td { border: 1px solid #c0cfe0; padding: 7pt 10pt; vertical-align: top; }
    tr:nth-child(even) { background-color: #eef4fb; }
    .meta-table td { border: none; padding: 4pt 8pt; }
    .label { font-weight: bold; color: #555; width: 220pt; }
    blockquote { background: #fef9e7; border-left: 4px solid #f39c12; padding: 8pt 12pt; margin: 8pt 0; font-style: italic; }
    .stamp { text-align: center; padding: 12pt; border: 3px double #27ae60; color: #27ae60; font-size: 16pt; font-weight: bold; display: inline-block; margin: 12pt 0; }
    hr { border: none; border-top: 1px solid #c0cfe0; margin: 18pt 0; }
  </style>
</head>
<body>

<h1>รายงานข้อกำหนดความต้องการประกันภัย (IREBA Specification)</h1>
<h2 style="border:none; font-size:16pt;">${project.projectName} (${project.projectId})</h2>

<table class="meta-table">
  <tr><td class="label">วันที่สร้างโครงการ:</td><td>${createdDate}</td></tr>
  <tr><td class="label">วันที่อนุมัติขั้นสุดท้าย:</td><td>${approvedDate}</td></tr>
  <tr><td class="label">สถานะเอกสาร:</td><td><strong>✅ APPROVED FINAL SPECIFICATION</strong></td></tr>
  <tr><td class="label">คำอธิบายโครงการ:</td><td>${project.description || '-'}</td></tr>
</table>

<div class="stamp">✅ APPROVED ✅</div>
<hr>
`;

    // Section 1: Landing Page
    if (reqs.landingPage) {
      const lp = reqs.landingPage;
      html += `<h2>1. ข้อมูลประชาสัมพันธ์และจุดเด่นหลัก (Marketing &amp; Identity)</h2>`;
      html += `<table class="meta-table">`;
      html += `<tr><td class="label">ชื่อทางการค้า (Product Name):</td><td><strong>${lp.productName || '-'}</strong></td></tr>`;
      html += `<tr><td class="label">คำสโลแกน (Tagline):</td><td><em>${lp.tagline || '-'}</em></td></tr>`;
      html += `<tr><td class="label">กลุ่มเป้าหมาย (Target Audience):</td><td>${lp.targetAudience || '-'}</td></tr>`;
      html += `</table>`;
      html += `<h3>ผลประโยชน์และจุดขายสำคัญ (Key Benefits)</h3>`;
      html += `<table><thead><tr><th>หัวข้อ (Title)</th><th>รายละเอียด (Description)</th></tr></thead><tbody>`;
      (lp.keyBenefits || []).forEach(b => {
        html += `<tr><td><strong>${b.title || ''}</strong></td><td>${b.description || ''}</td></tr>`;
      });
      html += `</tbody></table><hr>`;
    }

    // Section 2: Quick Quote
    if (reqs.quickQuote) {
      const qq = reqs.quickQuote;
      const rules = qq.validationRules || {};
      html += `<h2>2. กฎการตรวจสอบข้อมูลรับเข้า Quick Quote (Validation Rules)</h2>`;
      html += `<table><thead><tr><th>ตัวแปร</th><th>Min</th><th>Max</th><th>ประเภทข้อมูล</th><th>หน่วย</th><th>ข้อความแจ้งเตือน</th></tr></thead><tbody>`;
      Object.keys(rules).forEach((k) => {
        const r = rules[k];
        html += `<tr><td><strong>${k}</strong></td><td>${r.min}</td><td>${r.max}</td><td>${r.dataType || ''}</td><td>${r.unit || ''}</td><td>${r.errorMessage || ''}</td></tr>`;
      });
      html += `</tbody></table>`;
      
      html += `<table class="meta-table" style="margin-top: 10pt;">`;
      html += `<tr><td class="label">งวดชำระเบี้ยที่รองรับ (Payment Modes):</td><td>${qq.paymentModes || '-'}</td></tr>`;
      html += `<tr><td class="label">ระยะเวลาชำระเบี้ยประกันภัย (Payment Terms):</td><td>${qq.paymentTerms || '-'}</td></tr>`;
      html += `</table><hr>`;
    }

    // Section 3: Product Calculation
    if (reqs.productCalculation) {
      const pc = reqs.productCalculation;
      const baseFormula = pc.formulaBasePremium || pc.formulas?.basePremium || '-';
      const discountFormula = pc.formulaDiscount || pc.formulas?.discount || '-';
      const totalFormula = pc.formulaTotalPremium || pc.formulas?.totalPremium || '-';

      html += `<h2>3. กลไกคำนวณเบี้ยประกันภัย (Actuarial Calculation Engine)</h2>`;
      html += `<h3>สูตรความสัมพันธ์เชิงคณิตศาสตร์อ้างอิง:</h3>`;
      html += `<table class="meta-table">`;
      html += `<tr><td class="label">เบี้ยประกันภัยฐาน (basePremium):</td><td><code>${baseFormula}</code></td></tr>`;
      html += `<tr><td class="label">ส่วนลดเบี้ยประกันภัย (discount):</td><td><code>${discountFormula}</code></td></tr>`;
      html += `<tr><td class="label">เบี้ยประกันภัยสุทธิ (totalPremium):</td><td><code>${totalFormula}</code></td></tr>`;
      html += `</table>`;

      html += `<h3>ตารางอัตราส่วนลดทุนประกัน (Discount Tiers):</h3>`;
      html += `<table><thead><tr><th>ทุนประกันขั้นต่ำ (Min SA)</th><th>ทุนประกันสูงสุด (Max SA)</th><th>ส่วนลดต่อทุน 1,000 บาท</th></tr></thead><tbody>`;
      (pc.discountTiers || []).forEach(t => {
        const minSAStr = t.minSA !== null && t.minSA !== undefined ? Number(t.minSA).toLocaleString() : '0';
        const maxSAStr = t.maxSA !== null && t.maxSA !== undefined ? Number(t.maxSA).toLocaleString() : 'ไม่จำกัด';
        html += `<tr><td>${minSAStr}</td><td>${maxSAStr}</td><td>${t.rateDiscount}</td></tr>`;
      });
      html += `</tbody></table>`;

      html += `<h3>ตารางสัมประสิทธิ์อัตราเบี้ยประกันรายปีต่อทุน 1,000 บาท (Premium Rate Matrix):</h3>`;
      html += `<table><thead><tr><th>อายุ</th><th>แผน 5 ปี</th><th>แผน 10 ปี</th><th>แผน 15 ปี</th><th>แผน 99 ปี</th></tr></thead><tbody>`;
      Object.keys(pc.premiumRateMatrix || {}).forEach(age => {
        const m = pc.premiumRateMatrix[age];
        html += `<tr><td><strong>${age}</strong></td><td>${m.term_5}</td><td>${m.term_10}</td><td>${m.term_15}</td><td>${m.term_99}</td></tr>`;
      });
      html += `</tbody></table><hr>`;
    }

    // Section 4: Supported Riders
    if (reqs.supportedRiders && reqs.supportedRiders.ridersList) {
      html += `<h2>4. สัญญาเพิ่มเติมประกันภัยที่รองรับ (Supported Riders)</h2>`;
      html += `<table><thead><tr><th>ชื่อสัญญาเพิ่มเติม</th><th>ประเภท</th><th>อายุรับประกันต่ำสุด</th><th>อายุรับประกันสูงสุด</th><th>อายุคุ้มครองสูงสุด</th><th>หมายเหตุการต่ออายุ</th></tr></thead><tbody>`;
      reqs.supportedRiders.ridersList.forEach(rider => {
        html += `<tr>` +
          `<td><strong>${rider.riderName || '-'}</strong></td>` +
          `<td>${rider.riderType || '-'}</td>` +
          `<td>${rider.entryAgeMin || 0} ปี</td>` +
          `<td>${rider.entryAgeMax || 0} ปี</td>` +
          `<td>ถึงอายุ ${rider.renewalAgeLimit || 0} ปี</td>` +
          `<td>${rider.renewalNote || '-'}</td>` +
          `</tr>`;
      });
      html += `</tbody></table><hr>`;
    }

    // Section 5: Sale Proposal & Compliance
    if (reqs.saleProposal) {
      const sp = reqs.saleProposal;
      const cashValueRates = sp.cashValueRates || sp.benefitProjectionRules?.cashValueRates || [];
      const maxDeductionLimit = sp.taxDeductionLimit || sp.taxBenefit?.maxDeductionLimit || 0;
      const taxRuleDescription = sp.taxRuleDescription || sp.taxBenefit?.ruleDescription || '-';
      const sectionReference = sp.complianceSectionRef || sp.complianceDisclaimer?.sectionReference || '-';
      const disclaimerText = sp.complianceDisclaimerText || sp.complianceDisclaimer?.disclaimerText || '';

      html += `<h2>5. ตารางมูลค่าเวนคืนและข้อกฎหมาย (Benefit Projection &amp; Compliance)</h2>`;
      html += `<h3>ตารางอัตรามูลค่าเวนคืนกรมธรรม์ต่อทุน 1,000 บาท:</h3>`;
      html += `<table><thead><tr><th>ปีกรมธรรม์</th><th>อายุ 1 ปี</th><th>อายุ 30 ปี</th><th>อายุ 44 ปี</th><th>อายุ 60 ปี</th></tr></thead><tbody>`;
      cashValueRates.forEach(v => {
        const r = v.ratesByAge || {};
        html += `<tr><td><strong>ปีที่ ${v.policyYear}</strong></td><td>${r.age_1}</td><td>${r.age_30}</td><td>${r.age_44}</td><td>${r.age_60}</td></tr>`;
      });
      html += `</tbody></table>`;

      html += `<h3>สิทธิ์ประโยชน์ลดหย่อนภาษี:</h3>`;
      html += `<table class="meta-table">`;
      html += `<tr><td class="label">วงเงินลดหย่อนภาษีสูงสุด:</td><td>${Number(maxDeductionLimit).toLocaleString()} บาท</td></tr>`;
      html += `<tr><td class="label">เกณฑ์หักลดหย่อนภาษี:</td><td>${taxRuleDescription}</td></tr>`;
      html += `</table>`;

      html += `<h3>เงื่อนไขระยะเวลาประกันภัยและความยืดหยุ่น:</h3>`;
      html += `<table class="meta-table">`;
      html += `<tr><td class="label">ระยะเวลา Free-look (วัน):</td><td>${sp.freeLookPeriodDays || '-'} วัน</td></tr>`;
      html += `<tr><td class="label">ระยะเวลาไม่โต้แย้งความไม่สมบูรณ์ (ปี):</td><td>${sp.incontestabilityPeriodYears || '-'} ปี</td></tr>`;
      html += `<tr><td class="label">ข้อยกเว้นกรณีฆ่าตัวตาย (ปี):</td><td>${sp.suicideExclusionYears || '-'} ปี</td></tr>`;
      html += `<tr><td class="label">เกณฑ์ Premium Holiday:</td><td>${sp.premiumHolidayRules || '-'}</td></tr>`;
      html += `<tr><td class="label">เกณฑ์ Partial Surrender:</td><td>${sp.partialSurrenderRules || '-'}</td></tr>`;
      html += `</table>`;

      html += `<h3>ข้อกำหนดทางกฎหมายและคำเตือน:</h3>`;
      html += `<table class="meta-table">`;
      html += `<tr><td class="label">อ้างอิงกฎหมาย:</td><td><em>${sectionReference}</em></td></tr>`;
      html += `</table>`;
      html += `<blockquote>${disclaimerText}</blockquote>`;
    }

    html += `
</body>
</html>`;

    res.setHeader('Content-Type', 'application/msword; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=IREBA_Spec_${projectId}.doc`);
    return res.status(200).send(html);

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการส่งออก Word Document:", error);
    return res.status(500).send("ระบบขัดข้องในการสร้างไฟล์ Word Document");
  }
}

module.exports = {
  generateNextProjectId,
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  approveProjectController,
  exportJiraCsvController,
  exportWordDocController
};
