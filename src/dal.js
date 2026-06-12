const path = require('path');
const fs = require('fs');

/**
 * Helper to determine if running on Vercel Serverless environment
 */
function checkIsVercel() {
  return !!(process.env.VERCEL || process.env.NOW_BUILD_TRIGGER || fs.existsSync('/var/task'));
}

/**
 * ฟังก์ชันค้นหาและคืนค่าพาธการบันทึกฐานข้อมูล projects.json
 * รองรับการย้ายพาธไปที่ /tmp อัตโนมัติเมื่อตรวจพบการรันบนระบบ Vercel
 */
function getStorageFilePath() {
  const isVercel = checkIsVercel();
  
  let targetDir;
  if (isVercel) {
    // กำหนดพาธชั่วคราว /tmp สำหรับ Vercel Serverless
    targetDir = '/tmp/data';
  } else {
    // กำหนดพาธตามค่าที่ตั้งใน .env หรือ fallback ไปยังโฟลเดอร์โครงการ
    targetDir = process.env.DATA_STORAGE_PATH || path.join(__dirname, '../data');
  }

  // สร้างโฟลเดอร์หากยังไม่มีอยู่ในระบบ
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return path.join(targetDir, 'projects.json');
}

/**
 * ฟังก์ชันค้นหาและคืนค่าพาธการจัดเก็บไฟล์อัปโหลดชั่วคราว (Upload Cache Path)
 * รองรับการย้ายพาธไปที่ /tmp อัตโนมัติเมื่อตรวจพบการรันบนระบบ Vercel
 */
function getUploadCacheDir() {
  const isVercel = checkIsVercel();
  let targetDir;
  if (isVercel) {
    // กำหนดพาธชั่วคราว /tmp สำหรับ Vercel Serverless
    targetDir = '/tmp/uploads';
  } else {
    // กำหนดพาธตามค่าที่ตั้งใน .env หรือ fallback ไปยังโฟลเดอร์โครงการ
    targetDir = process.env.UPLOAD_CACHE_PATH || path.join(__dirname, '../uploads');
  }

  // สร้างโฟลเดอร์หากยังไม่มีอยู่ในระบบ
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  return targetDir;
}

/**
 * ฟังก์ชันอ่านข้อมูลทั้งหมดจาก projects.json
 */
function readProjects() {
  const filePath = getStorageFilePath();
  if (!fs.existsSync(filePath)) {
    // คืนค่าอาร์เรย์ว่างเริ่มต้นหากไม่พบไฟล์ฐานข้อมูล
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอ่านไฟล์โครงการ:", error);
    return [];
  }
}

/**
 * ฟังก์ชันบันทึกชุดข้อมูลโครงการลงในไฟล์ projects.json
 */
function writeProjects(projectsArray) {
  const filePath = getStorageFilePath();
  try {
    const dataString = JSON.stringify(projectsArray, null, 2);
    fs.writeFileSync(filePath, dataString, 'utf-8');
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการเขียนไฟล์โครงการ:", error);
    throw new Error("ระบบไม่สามารถบันทึกข้อมูลโครงการลงฐานข้อมูลได้");
  }
}

module.exports = {
  checkIsVercel,
  getStorageFilePath,
  getUploadCacheDir,
  readProjects,
  writeProjects
};
