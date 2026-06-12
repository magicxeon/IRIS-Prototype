# BRS-04: Screen 4 - Result Display & Export

## 1. Introduction (บทนำ)
ความต้องการในเอกสารฉบับนี้กำหนดเกณฑ์และข้อกำหนดเชิงธุรกิจสำหรับ **หน้าจอที่ 4 (Screen 4): Result Display & Export** ของระบบ **IREBA** เพื่อแสดงความต้องการในสไตล์สะอาดเป็นระเบียบ (Clean UI) สลับแท็บสัญญารับกลับ JSON จาก AI และออกรายงานในเครื่องผู้ใช้

---

## 2. Business Requirements & UI Specs (ความต้องการทางธุรกิจ)

### 2.1 UI Component & Layout Specifications (การจัดวางและส่วนประกอบหน้าจอ)
* **Progress Steps Bar:** แสดงสถานะผ่านขั้นตอนที่ 1, 2, 3 แล้ว และกำลังสรุปผลลัพธ์ในขั้นตอนที่ 4
* **Clean Result Tabs (แถบสลับแท็บผลลัพธ์):**
  * แถบสลับแท็บจัดทำแบบราบเรียบ (Flat Tabs) เส้นขอบล่างสีเทาเบาบาง `--color-border-light`
  * แท็บที่เลือกใช้งาน (Active Tab) ตัวหนังสือต้องเป็นตัวหนา และมีเส้นขีดล่างเน้นด้วยสีน้ำเงินหลัก `--color-primary-navy`
  * ซ่อนหรือแสดงแท็บตามการเช็คบ็อกซ์จาก Screen 3
* **Zebra-Striped Requirement Tables (ตารางแสดงข้อกำหนดความต้องการ):**
  * ข้อมูลถูกแสดงผลในตารางสเปก ตัวอักษรใช้ฟอนต์ Kanit 
  * แถวข้อมูลในตารางใช้สไตล์สลับสี (Zebra-striping) ด้วยสีพื้นหลังพื้นผิว `--color-surface-white` สลับสีเทาอ่อนสะอาด เพื่อให้อ่านแยกบรรทัดได้ง่าย
* **Export Buttons (ปุ่มดาวน์โหลดรายงาน):**
  * ปุ่มกดส่งออกจัดวางเป็นสัญลักษณ์ไอคอนร่วมกับข้อความเด่นชัดสีสะอาดตา (เช่น สีเขียวมะกอกสำหรับ JSON และสีน้ำเงินหลักสำหรับ Markdown) ขอบปุ่มโค้งมนมนุ่มนวล `--radius-md`
* **Footer (เลขรุ่นและประวัติระบบ):**
  * บริเวณขวาล่างของส่วน Footer ต้องมีป้ายรุ่นแอปพลิเคชันระบุว่า `"IREBA App Version: v3.0.0"`
  * ป้ายตัวหนังสือรองรับการคลิกเพื่อเรียกป๊อปอัพแสดงฟีเจอร์ของรุ่น

---

## 3. Sub-Requirements: Response Schemas & Verification Tables (ข้อกำหนดผลลัพธ์และการตรวจทาน)

### 3.1 Sub-req 4.1: Landing Page Output Schema
JSON ผลลัพธ์สำหรับ Tab 1:
```json
{
  "productName": "FutureShield 99",
  "tagline": "คุ้มครองตลอดชีพอย่างมั่นคง พร้อมความยืดหยุ่นทางการเงินยุคใหม่",
  "keyBenefits": [
    {
      "title": "จ่ายสั้น จบไว",
      "description": "เลือกระยะเวลาชำระเบี้ยสั้น 5, 10 หรือ 15 ปี ไม่ผูกพันระยะยาว"
    },
    {
      "title": "การันตีผลตอบแทน",
      "description": "ได้รับเงินคืนครบกำหนดสัญญาไม่น้อยกว่า 101% ของเบี้ยที่ชำระมาแล้วสะสมทั้งหมด"
    },
    {
      "title": "สภาพคล่องสูง",
      "description": "จัดการวิกฤตการเงินด้วยสิทธิ์หยุดพักชำระเบี้ย (Premium Holiday) หรือการขอถอนเงินสดบางส่วน (Partial Surrender)"
    }
  ]
}
```

### 3.2 Sub-req 4.2: Quick Quote Form Validation Schema
JSON ผลลัพธ์สำหรับ Tab 2:
```json
{
  "validationRules": {
    "age": { "min": 1, "max": 75, "dataType": "integer", "unit": "years", "errorMessage": "อายุต้องอยู่ระหว่าง 1 ถึง 75 ปี" },
    "sumAssured": { "min": 100000, "max": 9999999, "dataType": "integer", "unit": "baht", "errorMessage": "จำนวนเงินเอาประกันภัยหลักต้องมีค่าอยู่ระหว่าง 100,000 ถึง 9,999,999 บาท" },
    "paymentTerm": { "min": 5, "max": 99, "dataType": "integer", "unit": "years", "errorMessage": "ระยะเวลาชำระเบี้ยต้องอยู่ระหว่าง 5 ถึง 99 ปี" }
  }
}
```

### 3.3 Sub-req 4.3: Product Calculation QA Math Matrix & Schema
JSON ผลลัพธ์สำหรับ Tab 3:
```json
{
  "formulas": {
    "basePremium": "Base Premium = (Rate / 1000) * SA",
    "discount": "Discount = Rate Discount * (SA / 1000)",
    "totalPremium": "Total Premium = Base Premium - Discount"
  },
  "discountTiers": [
    { "minSA": 0, "maxSA": 499999, "rateDiscount": 0 },
    { "minSA": 500000, "maxSA": 999999, "rateDiscount": 2 },
    { "minSA": 1000000, "maxSA": 2999999, "rateDiscount": 3 },
    { "minSA": 3000000, "maxSA": 9999999, "rateDiscount": 4 }
  ],
  "premiumRateMatrix": {
    "44": { "term_5": 158.40, "term_10": 86.50, "term_15": 64.30, "term_99": 32.10 },
    "35": { "term_5": 132.50, "term_10": 71.20, "term_15": 52.10, "term_99": 23.50 },
    "50": { "term_5": 184.60, "term_10": 102.80, "term_15": 77.50, "term_99": 41.50 }
  }
}
```
* **ตารางตรวจสอบคำนวณเบี้ยประกันอ้างอิง (Math Verification Matrix สำหรับ QA):**
  * *Case CAL-001:* เพศชาย อายุ 44 ปี แผนชำระเบี้ย 10 ปี ทุน 2,000,000 บาท
    * อัตราเบี้ยจาก Matrix: `86.50`
    * เบี้ยฐาน (Base Premium) = `(86.50 / 1000) * 2,000,000 = 173,000` บาท
    * อัตราส่วนลดทุน 2M: `3`
    * ส่วนลด (Discount) = `3 * (2,000,000 / 1000) = 6,000` บาท
    * เบี้ยประกันสุทธิรายปี = `173,000 - 6,000 = 167,000` บาท

### 3.4 Sub-req 4.4: Sale Proposal Benefit Projections Table Math, Tax Logic & Compliance Disclaimer
JSON ผลลัพธ์สำหรับ Tab 4:
```json
{
  "benefitProjectionRules": {
    "cashValueRates": [
      { "policyYear": 1, "ratesByAge": { "age_44": 0.00 } },
      { "policyYear": 2, "ratesByAge": { "age_44": 45.00 } },
      { "policyYear": 5, "ratesByAge": { "age_44": 285.00 } },
      { "policyYear": 10, "ratesByAge": { "age_44": 840.00 } },
      { "policyYear": 11, "ratesByAge": { "age_44": 872.00 } },
      { "policyYear": 25, "ratesByAge": { "age_44": 1000.00 } }
    ]
  },
  "taxBenefit": { "maxDeductionLimit": 100000, "ruleDescription": "MIN(Total Premium, 100000)" },
  "complianceDisclaimer": {
    "sectionReference": "Civil and Commercial Code Section 865",
    "disclaimerText": "คำเตือน: การเปิดเผยข้อมูลสุขภาพเป็นปัจจัยสำคัญในการพิจารณารับประกันภัย ผู้ขอเอาประกันภัยมีหน้าที่แถลงข้อความจริงตามหลักความซื่อสัตย์อย่างยิ่ง (Utmost Good Faith) ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 865 หากมีการปกปิดข้อความจริงหรือแถลงข้อความอันเป็นเท็จ บริษัทประกันภัยมีสิทธิบอกล้างสัญญาประกันภัยภายในระยะเวลา 2 ปี นับตั้งแต่วันเริ่มมีผลคุ้มครองตามกรมธรรม์"
  }
}
```
* **ตารางประเมินผลลัพธ์ตารางผลประโยชน์รายปีสำหรับตรวจสอบ (Verification Table):**
  *(ตัวอย่างเคสเป้าหมาย: ทุนประกัน 2,000,000 บาท, เบี้ยรายปี 167,000 บาท, อายุ 44 ปี ชำระเบี้ย 10 ปี)*
  * สิ้นปีที่ 1: เบี้ยสะสม = `167,000`, เวนคืน = `0` (Rate 0), ความคุ้มครองชีวิต = **`2,000,000`**
  * สิ้นปีที่ 10: เบี้ยสะสม = `1,670,000`, เวนคืน = `1,680,000` (Rate 840.00), ความคุ้มครองชีวิต = **`2,000,000`**
  * สิ้นปีที่ 11: เบี้ยสะสม = `1,670,000`, เวนคืน = `1,744,000` (Rate 872.00), ความคุ้มครองชีวิต = **`2,000,000`**

### 3.5 Sub-req 4.5: Export Formats (Markdown & JSON Payloads)
* **Markdown (.md) Export Structure:** บันทึกโครงสร้างความต้องการโดยแบ่งปาร์สเซสชั่นตารางข้อมูลและ Disclaimer
* **JSON (.json) Export Payload:** บันทึกประวัติและผลวิเคราะห์ทั้งหมดในอาเรย์ระดับข้อมูลเดี่ยว

---

## 4. Test-Driven Development (TDD) & UAT Scenarios

### 4.1 Gherkin Test Scenarios

#### Scenario 1: การเปลี่ยนสีไฮไลท์ใต้แถบแท็บที่ผู้ใช้คลิกเลือก (UAT: Tab Highlight Styling)
* **Given** ผู้ใช้งานอยู่ในหน้าจอ Screen 4: Result Display ในระบบ IREBA
* **When** ผู้ใช้งานคลิกเลือกสลับแท็บจาก `"Marketing"` ไปยังแท็บ `"Calculations (Math Logic)"`
* **Then** แท็บ Marketing ต้องหมดสิทธิ์ไฮไลท์และฟอนต์เปลี่ยนเป็นตัวบางสีเทา
* **And** แท็บ Calculations ต้องแสดงตัวหนังสือสีน้ำเงินหลักหนาและมีเส้นใต้ทึบสี `--color-primary-navy` โผล่ใต้ปุ่มแท็บ
* **And** ข้อมูลตารางสูตรต้องปรากฏขึ้นอย่างสะอาดตาและอ่านง่ายในแบบตัวอักษร Kanit

---

## 5. Expected Output Summary (สรุปผลลัพธ์ที่ต้องการ)
1. หน้าจอ UI แสดงตารางผลลัพธ์แบบ Zebra-striped แยกสลับแท็บตามการเช็คบ็อกซ์ในดีไซน์แบบ Clean UI
2. ป้ายแสดงผลเวอร์ชันแอปพลิเคชัน IREBA `v3.0.0` ที่ส่วนล่างสุดพร้อมกล่องป๊อปอัพแสดงฟีเจอร์การอัปเดต
3. ปุ่มส่งออกข้อมูลสเปกเป็นเอกสาร Markdown และ JSON สำหรับ SE และ QA นำไปใช้งานต่อ
