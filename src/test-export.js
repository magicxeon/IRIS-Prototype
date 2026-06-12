/**
 * test-export.js
 * Integration test สำหรับ Section 06: Word & JIRA Export Engine
 * 
 * UAT Scenarios ที่ทดสอบ:
 * 1. ส่งออก JIRA CSV สำเร็จจากโครงการที่ approved - ตรวจสอบหัวตาราง Headers
 * 2. ปฏิเสธส่งออกเมื่อโครงการยังไม่ได้ approved (status !== 'approved')
 * 3. ส่งออก Word Document สำเร็จ - ตรวจสอบ MIME type และ Content-Disposition
 * 4. ปฏิเสธ Word export เมื่อโครงการยังไม่ approved
 */

require('dotenv').config();
const http = require('http');

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

// --- Helper: HTTP request utility ---
function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          // ลอง parse JSON ถ้าทำได้
          json: (() => { try { return JSON.parse(data); } catch (e) { return null; } })()
        });
      });
    });

    req.on('error', (err) => {
      // รองรับ AggregateError ใน Node.js v17+ สำหรับ ECONNREFUSED
      const code = err.code || (err.errors && err.errors[0]?.code);
      if (code === 'ECONNREFUSED') {
        reject(new Error(`❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (ECONNREFUSED) - กรุณารัน 'npm run dev' ก่อนทำการทดสอบ`));
      } else {
        reject(err);
      }
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// --- Test Runner ---
let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` → ${details}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('🧪 IREBA Section 06: Word & JIRA Export Engine - UAT Tests');
  console.log('============================================================\n');

  // ---------------------------------------------------------------------------
  // SETUP: สร้างโครงการใหม่สำหรับทดสอบ
  // ---------------------------------------------------------------------------
  console.log('🔧 Setup: Creating test project...');
  const createRes = await httpRequest('POST', '/api/projects', {
    projectName: 'Test Export Engine Project',
    description: 'โครงการทดสอบ export engine section 06'
  });
  assert(createRes.statusCode === 201, 'Create project returns 201');
  const testProjectId = createRes.json?.projectId;
  assert(!!testProjectId, 'Project ID assigned', `Got: ${testProjectId}`);
  console.log(`   → Created project: ${testProjectId}\n`);

  // ---------------------------------------------------------------------------
  // Scenario 2 (BRS): ปฏิเสธการ export เมื่อโครงการยังไม่ได้ approved
  // ---------------------------------------------------------------------------
  console.log('📋 Scenario 1: Reject JIRA CSV export on non-approved project...');
  const jiraBlockRes = await httpRequest('GET', `/api/projects/${testProjectId}/export/jira`);
  assert(jiraBlockRes.statusCode === 400, 'JIRA CSV blocked on non-approved project (HTTP 400)');
  assert(
    jiraBlockRes.json?.success === false,
    'Response success=false for blocked JIRA export'
  );
  console.log(`   → Response: ${jiraBlockRes.json?.message}\n`);

  console.log('📋 Scenario 2: Reject Word export on non-approved project...');
  const wordBlockRes = await httpRequest('GET', `/api/projects/${testProjectId}/export/word`);
  assert(wordBlockRes.statusCode === 400, 'Word export blocked on non-approved project (HTTP 400)');
  assert(
    wordBlockRes.json?.success === false,
    'Response success=false for blocked Word export'
  );
  console.log(`   → Response: ${wordBlockRes.json?.message}\n`);

  // ---------------------------------------------------------------------------
  // SETUP: Inject mock approved data directly via approve endpoint
  // ---------------------------------------------------------------------------
  console.log('🔧 Setup: Approving project with mock requirements...');
  const mockRequirements = {
    landingPage: {
      productName: 'IREBA Life Plus 10/5',
      tagline: 'คุ้มครองชีวิต คุ้มค่าเบี้ย',
      keyBenefits: [
        { title: 'คุ้มครองชีวิต', description: 'ทุนประกัน 110% เมื่อเสียชีวิต' },
        { title: 'ออมทรัพย์', description: 'รับเงินคืน 100% เมื่อครบสัญญา' }
      ]
    },
    quickQuote: {
      validationRules: {
        age: { min: 1, max: 75, dataType: 'integer', unit: 'ปี', errorMessage: 'อายุต้องอยู่ระหว่าง 1-75 ปี' },
        sumAssured: { min: 100000, max: 10000000, dataType: 'number', unit: 'บาท', errorMessage: 'ทุนประกันต้องอยู่ระหว่าง 100,000-10,000,000 บาท' }
      }
    },
    productCalculation: {
      formulas: {
        basePremium: 'ratePerThousand * (sumAssured / 1000)',
        discount: 'basePremium * discountRate',
        totalPremium: 'basePremium - discount'
      },
      discountTiers: [
        { minSA: 0, maxSA: 499999, rateDiscount: 0 },
        { minSA: 500000, maxSA: 999999, rateDiscount: 0.02 }
      ],
      premiumRateMatrix: {
        '30': { term_5: 18.5, term_10: 10.2, term_15: 7.8, term_99: 5.1 }
      }
    },
    saleProposal: {
      benefitProjectionRules: {
        cashValueRates: [
          { policyYear: 1, ratesByAge: { age_1: 50, age_30: 55, age_44: 60, age_60: 65 } }
        ]
      },
      taxBenefit: {
        maxDeductionLimit: 100000,
        ruleDescription: 'premium <= 100000 ? premium : 100000'
      },
      complianceDisclaimer: {
        sectionReference: 'ม.865 ประมวลกฎหมายแพ่งและพาณิชย์',
        disclaimerText: 'ผู้เอาประกันภัยควรศึกษาและทำความเข้าใจในเอกสารเสนอขาย'
      }
    }
  };

  const approveRes = await httpRequest('PUT', `/api/projects/${testProjectId}/approve`, {
    updatedRequirements: mockRequirements
  });
  assert(approveRes.statusCode === 200, 'Project approved successfully');
  assert(approveRes.json?.status === 'approved', 'Project status changed to approved');
  console.log(`   → Project ${testProjectId} is now approved\n`);

  // ---------------------------------------------------------------------------
  // Scenario 1 (BRS): ส่งออก JIRA CSV สำเร็จจากโครงการที่ approved
  // ---------------------------------------------------------------------------
  console.log('📋 Scenario 3: Export JIRA CSV from approved project...');
  const jiraExportRes = await httpRequest('GET', `/api/projects/${testProjectId}/export/jira`);
  assert(jiraExportRes.statusCode === 200, 'JIRA CSV export returns HTTP 200');
  assert(
    jiraExportRes.headers['content-type']?.includes('text/csv'),
    'Content-Type is text/csv',
    `Got: ${jiraExportRes.headers['content-type']}`
  );
  assert(
    jiraExportRes.headers['content-disposition']?.includes('.csv'),
    'Content-Disposition includes .csv filename',
    `Got: ${jiraExportRes.headers['content-disposition']}`
  );
  // ตรวจสอบหัวตาราง JIRA (BRS UAT Scenario 1)
  const csvLines = jiraExportRes.body.replace(/^\uFEFF/, '').split('\n'); // remove BOM
  assert(
    csvLines[0].trim() === 'Summary,Description,Issue Type,Priority',
    'JIRA CSV first row matches required headers: Summary,Description,Issue Type,Priority',
    `Got: "${csvLines[0].trim()}"`
  );
  assert(
    csvLines.length > 2,
    `JIRA CSV has multiple rows (got ${csvLines.length} lines including header)`
  );
  // ตรวจสอบว่ามีข้อมูลจาก Quick Quote
  const csvContainsQuickQuote = jiraExportRes.body.includes('[IREBA - Quick Quote]');
  assert(csvContainsQuickQuote, 'JIRA CSV contains Quick Quote rows');
  // ตรวจสอบว่ามี UTF-8 BOM
  const hasBOM = jiraExportRes.body.charCodeAt(0) === 0xFEFF;
  assert(hasBOM, 'JIRA CSV has UTF-8 BOM for Excel Thai language support');
  console.log(`   → CSV rows generated: ${csvLines.filter(l => l.trim()).length}\n`);

  // ---------------------------------------------------------------------------
  // Scenario 3: ส่งออก Word Document สำเร็จ
  // ---------------------------------------------------------------------------
  console.log('📋 Scenario 4: Export Word Document from approved project...');
  const wordExportRes = await httpRequest('GET', `/api/projects/${testProjectId}/export/word`);
  assert(wordExportRes.statusCode === 200, 'Word export returns HTTP 200');
  assert(
    wordExportRes.headers['content-type']?.includes('application/msword'),
    'Content-Type is application/msword',
    `Got: ${wordExportRes.headers['content-type']}`
  );
  assert(
    wordExportRes.headers['content-disposition']?.includes('.doc'),
    'Content-Disposition includes .doc filename',
    `Got: ${wordExportRes.headers['content-disposition']}`
  );
  // ตรวจสอบโครงสร้าง HTML ที่จะแปลงเป็น Word
  assert(wordExportRes.body.includes('<!DOCTYPE html>'), 'Word doc is valid HTML structure');
  assert(wordExportRes.body.includes('APPROVED FINAL SPECIFICATION'), 'Word doc includes APPROVED stamp');
  assert(wordExportRes.body.includes(testProjectId), 'Word doc includes Project ID');
  assert(wordExportRes.body.includes('IREBA Life Plus 10/5'), 'Word doc includes product name from Landing Page');
  assert(wordExportRes.body.includes('Quick Quote'), 'Word doc includes Quick Quote section');
  console.log(`   → Word document size: ${wordExportRes.body.length} bytes\n`);

  // ---------------------------------------------------------------------------
  // Scenario: 404 บน project ที่ไม่มีอยู่
  // ---------------------------------------------------------------------------
  console.log('📋 Scenario 5: Handle 404 for non-existent project...');
  const notFoundRes = await httpRequest('GET', '/api/projects/PRJ-XXXX-999/export/jira');
  assert(notFoundRes.statusCode === 404, 'Returns 404 for non-existent project');
  console.log();

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('============================================================');
  console.log(`🏁 Test Results: ${passed} passed, ${failed} failed out of ${passed + failed} total`);
  if (failed === 0) {
    console.log('🎉 All tests passed! Section 06 Export Engine is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the output above.');
  }
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  // รองรับ AggregateError (Node 17+) และ Error ธรรมดา
  const msg = err.message || 
    (err.errors && err.errors.map(e => e.message).join(', ')) ||
    String(err);
  console.error('\n❌ Test runner crashed:', msg);
  if (err.errors) {
    err.errors.forEach((e, i) => console.error(`  [${i}] ${e.code}: ${e.message}`));
  }
  process.exit(1);
});
