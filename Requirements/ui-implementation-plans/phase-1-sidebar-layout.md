# Phase 1: โครงสร้าง Sidebar Layout และ Navigation (Sidebar Restructuring)

แผนปฏิบัติการขั้นแรกมีจุดประสงค์หลักเพื่อปรับโครงสร้างมิติของหน้าจอ (Layout Grid) จากรูปแบบเดิมที่ใช้ Stepper แนวนอนด้านบน มาเป็น **Left Sidebar (แถบนำทางด้านข้าง)** เพื่อให้ระบบดูเป็น Enterprise SaaS Workspace และยืดหยุ่นในการสลับเปลี่ยนขั้นตอนมากขึ้น

---

## 🛠️ รายละเอียดการเปลี่ยนแปลงของไฟล์ (Proposed Code Changes)

### 1. [index.html](file:///d:/development/IRIS-Training/IRIS-Prototype/public/index.html)
* **เอาส่วนประกอบเก่าออก**:
  * ลบโครงสร้าง Header เดิม (`<header>...</header>`) ที่บรรทัด 12-20
  * ลบโครงสร้าง Stepper Container เก่า (`<div class="steps-container">...</div>`) ที่บรรทัด 23-42
* **เพิ่มโครงสร้างครอบแบบใหม่ (Layout Wrapper)**:
  * สร้าง `<div class="app-layout">` ครอบแอปพลิเคชันทั้งหมด
  * ภายใต้ `.app-layout` ให้แบ่งเป็น 2 คอลัมน์หลัก:
    1. **`<aside class="sidebar">` (แถบนำทางด้านซ้าย)**:
       * ส่วนหัว: โลโก้แบรนด์ IREBA
       * ส่วนเมนู: ลิงก์เมนู Dashboard หลัก และกลุ่มเมนูขั้นตอนของโครงการ (ซึ่งจะแสดง/ซ่อนผ่าน CSS/JS เมื่อมี Active Project)
       * ส่วนล่าง: Version badge ปุ่มสำหรับดูบันทึก Changelog
    2. **`<div class="main-content-wrapper">` (พื้นที่ทำงานด้านขวา)**:
       * **`<header class="workspace-header">`**: ประกอบด้วย Breadcrumbs นำทาง และโปรไฟล์ผู้ใช้แบบง่าย
       * **`<main>`**: ตัวครอบ `#screen-container` และ `#screen-1` ถึง `#screen-4` (ของเดิม)
       * **`<footer>`**: วางไว้ส่วนท้ายสุดของเนื้อหาด้านขวา

---

### 2. [style.css](file:///d:/development/IRIS-Training/IRIS-Prototype/public/style.css)
เพิ่มคลาสสไตล์ใหม่สำหรับควบคุม Grid และการแสดงผล Sidebar ดังนี้:
* **`.app-layout`**:
  ```css
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow: hidden;
  ```
* **`.sidebar`**:
  * กว้าง `260px` และใช้สีพื้นหลังเข้มระดับพรีเมียม (`#0f172a` - Slate 900) เพื่อตัดกับตัวเนื้อหาด้านขวา
  * `flex-shrink: 0`, `display: flex`, `flex-direction: column`
* **`.sidebar-nav .nav-item`**:
  * ปุ่มเมนูที่มีไอคอน มีการกำหนดสถานะ `:hover`, `.active` (สีครามสว่าง เช่น `#4f46e5`), และ `.disabled` (สีเทาจางและเคอร์เซอร์แบบห้ามกด)
* **`.main-content-wrapper`**:
  * `flex: 1`, `display: flex`, `flex-direction: column`, `background-color: var(--color-background-slate)`
  * กำหนด `overflow-y: auto` และ `height: 100vh` เพื่อให้แถบ Sidebar ตรึงอยู่กับที่เสมอ
* **`.workspace-header`**:
  * ออกแบบให้เป็นแถบโปร่งแสงเบลอขาว (Glassmorphic) ความสูงประมาณ `64px` ประกอบด้วย Breadcrumbs แสดงลำดับโฟลเดอร์ปัจจุบัน

---

### 3. [app.js](file:///d:/development/IRIS-Training/IRIS-Prototype/public/app.js)
แก้ไขตรรกะ JavaScript เพื่อควบคุม Sidebar และการอัปเดตระบบสลับหน้าจอ (Screen Routing):
* **ดึง DOM Elements ใหม่**:
  * ดึงอ้างอิงเมนูใน Sidebar: `navDashboard`, `navStep2`, `navStep3`, `navStep4`
  * ดึงส่วนโครงการปัจจุบัน: `sidebarProjectSection`, `sidebarProjectName`, `sidebarProjectStatus`
  * ดึง Breadcrumbs container
* **ปรับปรุงฟังก์ชัน `showScreen(screenNumber)`**:
  * แก้ไขการรีเซ็ตและการเพิ่มคลาส `.active` ของเมนูใน Sidebar แทน `step1`-`step4` เดิม
  * เมื่อแสดงผลหน้าจอใด ให้ทำแถบเมนูข้างเคียงใน Sidebar ไฮไลท์ตามหน้านั้น
* **เพิ่มฟังก์ชัน `updateBreadcrumbs(screenNumber, projectName)`**:
  * หน้าจอ 1 (Dashboard): แสดง `แดชบอร์ดโครงการ`
  * หน้าจอ 2-4: แสดง `แดชบอร์ด / โครงการ [ชื่อโครงการ] / [ขั้นตอนปัจจุบัน]`
* **จัดการสิทธิ์ในการคลิกนำทาง (Sidebar Navigation Click Handlers)**:
  * ผูก Event listener เข้ากับเมนูใน Sidebar ทุกปุ่ม
  * อนุญาตให้ผู้ใช้คลิกสลับหน้าไปยังขั้นตอนที่ผ่านความสำเร็จแล้วได้ทันที (เช่น หากสถานะโครงการเป็น `analyzed` ผู้ใช้สามารถกดไปมาระหว่างเมนู *นำเข้าเอกสาร*, *สกัดวิเคราะห์ AI* และ *ตรวจสอบ & ส่งออก* ได้โดยไม่ต้องกดปุ่ม Back ด้านล่างจอ)

---

## 🔍 แผนการตรวจสอบความถูกต้อง (Verification Details)
1. **ตรวจสอบความสมบูรณ์ของ Layout**: ตรวจสอบว่าแผง Sidebar และพื้นที่ Main content อยู่ในทิศทางด้านข้างอย่างถูกต้อง หน้าจอไม่ล้นจอหรือยุบตัว
2. **ทดสอบการทำงานของปุ่มนำทาง Sidebar**: 
   * เมื่อคลิกเปลี่ยนหน้าจาก Sidebar หน้าจอจริงด้านขวาจะต้องสลับไปมาตามที่ระบุ
   * ตรวจสอบว่าเมื่อเพิ่งสร้างโครงการใหม่ เมนูขั้นตอนที่ 3 และ 4 ใน Sidebar จะต้องถูกปิดใช้งานไว้ (disabled) ป้องกันการข้ามสเต็ป
3. **ตรวจสอบความลื่นไหล**: ไม่มีอาการกระตุกหรือเพจรีโหลดหน้าในขณะที่ผู้ใช้คลิกสลับหน้าจอในระบบ Single Page Application (SPA)
