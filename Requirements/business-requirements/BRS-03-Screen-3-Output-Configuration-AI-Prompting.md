# BRS-03: Screen 3 - Output Configuration & AI Prompting

## 1. Introduction (บทนำ)
ความต้องการในเอกสารฉบับนี้กำหนดเกณฑ์และข้อกำหนดเชิงธุรกิจสำหรับ **หน้าจอที่ 3 (Screen 3): Output Configuration & AI Prompting** ของระบบ **IREBA** เพื่อเป็นแนวทางในการจัดรูปแบบฟอร์มเลือกความต้องการสกัดเอกสารและการเชื่อมต่อประมวลผลกับ **Gemini API** โดยเน้นดีไซน์การจัดวางกล่องเช็คบ็อกซ์และสถานะการรอคอยสไตล์กระจกฝ้า (Glassmorphism Loading State)

---

## 2. Business Requirements & UI Specs (ความต้องการทางธุรกิจ)

### 2.1 UI Component & Layout Specifications (การจัดวางและส่วนประกอบหน้าจอ)
* **Progress Steps Bar:** แถบแสดงสถานะด้านบนระบุการผ่านขั้นตอนที่ 1 และ 2 แล้ว และกำลังดำเนินการในขั้นตอนที่ 3 (Output Configuration)
* **Configuration Selection Cards (กล่องเลือกความต้องการ):**
  * จัดแบ่งเช็คบ็อกซ์ความต้องการ 4 ตัวเลือกหลัก ออกเป็นกล่องการ์ดแยกชิ้นวางเป็นแถวกริดแบบสะอาดตา (Clean Grid Layout)
  * เมื่อคลิกเลือกตัวเลือกใด ขอบการ์ดจะเปลี่ยนจากสีเบาบาง `--color-border-light` เป็นสีน้ำเงินหลัก `--color-primary-navy` พร้อมกับแสดงสัญลักษณ์เครื่องหมายถูก (Checked) เปล่งแสง
* **Analyze with Gemini AI (Action Button):**
  * ปุ่มกดขนาดใหญ่สีน้ำเงินหลักเด่นชัด พื้นหลังทึบ ขอบโค้งมน `--radius-md`
* **Glassmorphism Loading Overlay (สถานะการรอประมวลผลด้วยกระจกฝ้า):**
  * เมื่อกดปุ่มส่งข้อมูลเพื่อขอสกัดข้อมูลจาก AI ระบบต้องเรนเดอร์ชั้นเลเยอร์กึ่งโปร่งใส (Overlay) ครอบทับทั่วทั้งหน้าจอ โดยใช้สไตล์ **Glassmorphism** (มีฉากหลังกึ่งโปร่งใสร่วมกับการตั้งสไตล์ตัวกรอง CSS `backdrop-filter: blur(8px);` เพื่อทำให้พื้นหลังเบลอและดูพรีเมียม)
  * แสดงตัวหมุนสถานะ (Loading Spinner) พร้อมแสดงข้อความตัวอักษรหนาสี Slate คมชัด: `"AI is analyzing documents and extracting requirements..."`
* **Footer (เลขรุ่นและประวัติระบบ):**
  * บริเวณขวาล่างของส่วน Footer ต้องมีป้ายรุ่นแอปพลิเคชันระบุว่า `"IREBA App Version: v3.0.0"`
  * ป้ายตัวหนังสือสามารถคลิกเพื่อเปิด Popover/Modal แสดงคุณลักษณะของระบบรุ่นนี้

### 2.2 System & AI Integration Rules (กฎตรรกะระบบและการเชื่อมต่อ AI)
* ผู้ใช้ต้องเลือกเช็คบ็อกซ์อย่างน้อย **1 รายการ** ก่อนกดวิเคราะห์
* ระบบดึงชุดคำสั่งแม่แบบ Dynamic Prompts ตามหัวข้อที่เลือกรวมกับเอกสารใน Cache ส่งไปประมวลผลผ่าน Gemini API (ตั้งค่า `temperature: 0.1` และ `responseMimeType: "application/json"`)

---

## 3. Sub-Requirements: AI Prompt Templates (ชุดคำสั่งสำหรับการสกัดรายหัวข้อ)

### 3.1 Sub-req 3.1: Landing Page AI Prompt Specification
```markdown
[Landing Page Prompt Instruction]
ค้นหาข้อมูลในเอกสาร Product Specification เพื่อตอบสนองความต้องการต่อไปนี้:
1. "productName": ชื่อผลิตภัณฑ์ทางการค้าหลักของประกันชีวิตนี้
2. "tagline": คำสโลแกนประชาสัมพันธ์การขายสั้นๆ
3. "keyBenefits": สรุปจุดเด่นที่เป็นประโยชน์สำคัญของประกันชีวิตนี้มาอย่างน้อย 3 ข้อหลัก ระบุหัวข้อเด่น (title) และคำอธิบายสั้นๆ (description) 

โครงสร้างผลลัพธ์ JSON ที่กำหนด:
{
  "productName": "string",
  "tagline": "string",
  "keyBenefits": [
    { "title": "string", "description": "string" }
  ]
}
```

### 3.2 Sub-req 3.2: Quick Quote Validation AI Prompt Specification
```markdown
[Quick Quote Validation Prompt Instruction]
วิเคราะห์เอกสารข้อกำหนดผลิตภัณฑ์ประกันภัย เพื่อหาขอบเขตเงื่อนไขข้อจำกัดข้อมูลนำเข้าดังนี้:
1. "age": ช่วงอายุผู้เอาประกันภัยต่ำสุดและสูงสุดที่ระบบรับประกันภัยได้ (ปี)
2. "sumAssured": ขีดจำกัดขั้นต่ำและสูงสุดของการเสนอขายทุนประกันภัยหลัก (บาท)
3. "paymentTerm": ขอบเขตจำนวนปีระยะเวลาการชำระเบี้ยประกันภัยที่เป็นไปได้ (ปี)

โครงสร้างผลลัพธ์ JSON ที่กำหนด:
{
  "validationRules": {
    "age": { "min": "integer", "max": "integer", "dataType": "string", "unit": "string", "errorMessage": "string" },
    "sumAssured": { "min": "integer", "max": "integer", "dataType": "string", "unit": "string", "errorMessage": "string" },
    "paymentTerm": { "min": "integer", "max": "integer", "dataType": "string", "unit": "string", "errorMessage": "string" }
  }
}
```

### 3.3 Sub-req 3.3: Product Calculation Engine AI Prompt Specification
```markdown
[Actuarial Calculation Prompt Instruction]
วิเคราะห์เอกสาร Pricing & Valuation และ Product Specification เพื่อสกัดข้อมูลคำนวณเบี้ย:
1. สกัดสูตรคำนวณเชิงภาษาคณิตศาสตร์:
   - "basePremium": สูตรคำนวณเบี้ยประกันภัยฐาน
   - "discount": สูตรคำนวณส่วนลดเบี้ยประกันภัยสะสม
   - "totalPremium": สูตรคำนวณยอดเบี้ยประกันภัยสุทธิต่อปี
2. "discountTiers": สกัดตารางสัดส่วนส่วนลดเบี้ยต่อทุน 1,000 บาท ตามช่วงของทุนประกันภัยหลัก
3. "premiumRateMatrix": สกัดค่าอัตราเบี้ยประกันรายปีต่อทุน 1,000 บาท (เพศชาย) สำหรับกลุ่มอายุ 1, 35, 40, 44, 50, 75 ปี และระยะชำระเบี้ย 5, 10, 15, 99 ปี

โครงสร้างผลลัพธ์ JSON ที่กำหนด:
{
  "formulas": { "basePremium": "string", "discount": "string", "totalPremium": "string" },
  "discountTiers": [
    { "minSA": "number", "maxSA": "number", "rateDiscount": "number" }
  ],
  "premiumRateMatrix": {
    "ageString": { "term_5": "number", "term_10": "number", "term_15": "number", "term_99": "number" }
  }
}
```

### 3.4 Sub-req 3.4: Sale Proposal & Compliance AI Prompt Specification
```markdown
[Sale Proposal & Compliance Prompt Instruction]
ค้นหาข้อมูลจาก Pricing Spec, Product Spec และ Compliance Document เพื่อดึงเงื่อนไขเสนอขาย:
1. "cashValueRates": สกัดตารางอัตรามูลค่าเวนคืนต่อทุน 1,000 บาท (สำหรับแผนชำระเบี้ย 10 ปี) ในปีปฏิทินที่ 1, 2, 5, 10, 11, 20, 25 สำหรับอายุ 1, 30, 44, 60 ปี
2. "taxBenefit": ค้นหาขีดจำกัดสูงสุดการนำเบี้ยประกันภัยหลักไปหักลดหย่อนภาษีเงินได้บุคคลธรรมดา
3. "complianceDisclaimer": สกัดข้อความคำเตือนภาษาไทยอย่างเป็นทางการ เกี่ยวกับหน้าที่ของผู้เอาประกันตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 865

โครงสร้างผลลัพธ์ JSON ที่กำหนด:
{
  "benefitProjectionRules": {
    "cashValueRates": [
      { "policyYear": "integer", "ratesByAge": { "age_1": "number", "age_30": "number", "age_44": "number", "age_60": "number" } }
    ]
  },
  "taxBenefit": { "maxDeductionLimit": "number", "ruleDescription": "string" },
  "complianceDisclaimer": { "sectionReference": "string", "disclaimerText": "string" }
}
```

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: การสั่งการประมวลผลและแสดงหน้าต่างเบลอกระจกฝ้าสำเร็จ (UAT: Loading State & Glassmorphism Check)
* **Given** ผู้ใช้งานทำการเลือกเช็คบ็อกซ์ข้อกำหนดสำเร็จบนระบบ IREBA
* **When** ผู้ใช้งานคลิกปุ่ม `"Analyze with Gemini AI"`
* **Then** ระบบต้องแสดงหน้าต่างกึ่งโปร่งใสทับหน้าจอทั้งหมด
* **And** ระบบต้องประยุกต์ใช้เอฟเฟกต์เบลอ `backdrop-filter: blur(8px);` กับหน้าต่างเพื่อทำสไตล์ Glassmorphism
* **And** แถบหมุนสถานะพร้อมข้อความวิเคราะห์ต้องแสดงกึ่งกลางฉากหลังอย่างเด่นชัด

---

## 5. Expected Output Summary (สรุปผลลัพธ์ที่ต้องการ)
1. หน้าจอตัวเลือกการสกัดแบบ Clean UI และฟอนต์ Kanit 
2. แผงควบคุมประมวลผลและการแสดงผลสถานะกระจกฝ้าเบลอพรีเมียม (Glassmorphism Loading State)
3. โค้ดข้อกำหนด Prompts ดึงข้อมูล 4 หัวข้อ เพื่อส่งต่อให้ Gemini API ประมวลผลแบบ Structured JSON
