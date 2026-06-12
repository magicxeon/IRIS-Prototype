const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readProjects, writeProjects, getUploadCacheDir } = require('./dal');

// ตั้งค่า Multer Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = getUploadCacheDir();
    console.log(`[Multer DiskStorage] กำหนดจุดบันทึกไฟล์ชั่วคราว: ${uploadDir}`);
    // ตรวจสอบสิทธิ์การเข้าถึงโฟลเดอร์ในระดับระบบปฏิบัติการ
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log(`[Multer DiskStorage] ตรวจสอบสิทธิ์การเขียนโฟลเดอร์สำเร็จ (Writable)`);
    } catch (accessErr) {
      console.error(`[Multer DiskStorage] ❌ ไม่มีสิทธิ์เขียนไฟล์ลงโฟลเดอร์ ${uploadDir}:`, accessErr.message);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const generatedName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log(`[Multer DiskStorage] ตั้งชื่อไฟล์ใหม่ในระบบ: ${generatedName}`);
    cb(null, generatedName);
  }
});

// กรองประเภทนามสกุลไฟล์โดยรวมในเบื้องต้นเพื่อความปลอดภัย
const fileFilter = (req, file, cb) => {
  const allAllowedExtensions = ['.pdf', '.docx', '.md', '.csv', '.xlsx'];
  const ext = path.extname(file.originalname).toLowerCase();
  console.log(`[Multer FileFilter] ตรวจสอบไฟล์อัปโหลด: ${file.originalname} (นามสกุล: ${ext})`);
  
  if (!allAllowedExtensions.includes(ext)) {
    console.warn(`[Multer FileFilter] ⚠️ ไฟล์ถูกปฏิเสธ: นามสกุล ${ext} ไม่ได้รับสิทธิ์`);
    return cb(new Error("นามสกุลไฟล์ไม่ได้รับการอนุญาตในระบบ"), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // ขีดจำกัด 10 MB (10,485,760 bytes)
}).single('file');

/**
 * Controller สำหรับอัปโหลดไฟล์
 */
function uploadFileController(req, res) {
  const { projectId } = req.params;
  console.log(`\n--- [Upload API] เริ่มการร้องขออัปโหลดสำหรับโปรเจกต์ ID: "${projectId}" ---`);

  upload(req, res, (err) => {
    if (err) {
      console.error(`[Upload API] ❌ ข้อผิดพลาดระหว่างการทำ Multer Upload:`, err.message);
      // ตรวจจับข้อผิดพลาดเรื่องขนาดไฟล์จาก Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: "File size exceeds maximum limit of 10 MB" 
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    const { docType } = req.body;
    console.log(`[Upload API] รับข้อมูลตัวแปร: docType="${docType}"`);

    if (!req.file) {
      console.error(`[Upload API] ❌ ไม่พบไฟล์ที่แนบมา (req.file is undefined)`);
      return res.status(400).json({ success: false, message: "กรุณาส่งไฟล์เอกสารที่ต้องการอัปโหลด" });
    }

    console.log(`[Upload API] บันทึกไฟล์สำเร็จในแคชดิสก์: ${req.file.path} (${req.file.size} bytes)`);

    if (!docType || !['productSpec', 'pricingValuation', 'compliance'].includes(docType)) {
      console.error(`[Upload API] ❌ ปฏิเสธการบันทึก: ค่า docType ไม่ถูกต้องหรือว่างเปล่า`);
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[Upload API] ล้างไฟล์ขยะชั่วคราวสำเร็จ`);
      } catch (unlinkErr) {
        console.error(`[Upload API] ไม่สามารถล้างไฟล์ขยะชั่วคราวได้:`, unlinkErr.message);
      }
      return res.status(400).json({ success: false, message: "ไม่ระบุประเภทเอกสาร (docType) หรือระบุไม่ถูกต้อง" });
    }

    // ตรวจสอบนามสกุลไฟล์โดยละเอียดแยกตามประเภทเอกสาร
    const allowedExtensions = {
      productSpec: ['.pdf', '.docx', '.md'],
      pricingValuation: ['.pdf', '.csv', '.xlsx', '.docx'],
      compliance: ['.pdf', '.docx']
    };
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions[docType].includes(ext)) {
      console.error(`[Upload API] ❌ นามสกุลไฟล์ ${ext} ไม่สอดคล้องกับประเภทเอกสาร ${docType}`);
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[Upload API] ล้างไฟล์ขยะเนื่องจากข้อผิดพลาดนามสกุลไม่สอดคล้องสำเร็จ`);
      } catch (unlinkErr) {
        console.error(`[Upload API] ล้างไฟล์ขยะขัดข้อง:`, unlinkErr.message);
      }
      return res.status(400).json({ 
        success: false, 
        message: `ประเภทไฟล์สำหรับ ${docType} ไม่ถูกต้อง นามสกุลที่อนุญาตคือ ${allowedExtensions[docType].join(', ')}` 
      });
    }

    try {
      const projects = readProjects();
      const projectIndex = projects.findIndex(p => p.projectId === projectId);
      
      if (projectIndex === -1) {
        console.warn(`[Upload API] ⚠️ ปฏิเสธบันทึก: ไม่พบรหัสโปรเจกต์ "${projectId}" ในฐานข้อมูล`);
        console.log(`[Upload API] รายการ ID โครงการที่มีทั้งหมดในระบบในปัจจุบัน:`, projects.map(p => p.projectId));
        
        try {
          fs.unlinkSync(req.file.path);
          console.log(`[Upload API] ล้างไฟล์ออกจากระบบเนื่องจากไม่พบโปรเจกต์อ้างอิงสำเร็จ`);
        } catch (unlinkErr) {
          console.error(`[Upload API] ล้างไฟล์ล้มเหลว:`, unlinkErr.message);
        }
        return res.status(404).json({ success: false, message: "ไม่พบโครงการที่อ้างอิง" });
      }

      // ลบไฟล์เก่าหากเคยมีการอัปโหลดในประเภทนี้ไว้ก่อนแล้ว
      const oldDoc = projects[projectIndex].documents[docType];
      if (oldDoc && oldDoc.tempPath && fs.existsSync(oldDoc.tempPath)) {
        try {
          fs.unlinkSync(oldDoc.tempPath);
          console.log(`[Upload API] ทำการล้างไฟล์อันเก่าออกเพื่อประหยัดพื้นที่แคช: ${oldDoc.tempPath}`);
        } catch (unlinkErr) {
          console.error(`[Upload API] ลบไฟล์เก่าล้มเหลว:`, unlinkErr.message);
        }
      }

      // อัปเดตข้อมูลไฟล์และสถานะโครงการ
      projects[projectIndex].documents[docType] = {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString(),
        tempPath: req.file.path
      };
      
      projects[projectIndex].status = "documents_uploaded";
      
      // บันทึกการอัปเดตลง JSON
      writeProjects(projects);
      console.log(`[Upload API] ✅ อัปเดตข้อมูลโครงการ "${projectId}" ใน database และปรับสถานะเป็น "documents_uploaded" สำเร็จ`);

      return res.status(200).json({
        success: true,
        projectId,
        document: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadedAt: projects[projectIndex].documents[docType].uploadedAt
        },
        message: "อัปโหลดไฟล์ข้อกำหนดและบันทึกข้อมูลเรียบร้อย"
      });
    } catch (error) {
      console.error(`[Upload API] ❌ เกิดข้อผิดพลาดร้ายแรงระหว่างการอัปเดตโครงการ:`, error);
      if (fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unErr) {
          console.error(`[Upload API] ล้างไฟล์ขยะผิดพลาด:`, unErr.message);
        }
      }
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการนำเข้าไฟล์" });
    }
  });
}

/**
 * Controller สำหรับลบไฟล์เอกสารประจำโครงการ
 */
function deleteFileController(req, res) {
  const { projectId, docType } = req.params;
  console.log(`\n--- [Delete Document API] เริ่มคำร้องขอลบไฟล์ประเภท: "${docType}" สำหรับโครงการ: "${projectId}" ---`);

  if (!['productSpec', 'pricingValuation', 'compliance'].includes(docType)) {
    console.error(`[Delete Document API] ❌ ประเภทเอกสารไม่สอดคล้องกับระบบ`);
    return res.status(400).json({ success: false, message: "ประเภทเอกสารไม่ถูกต้อง" });
  }

  try {
    const projects = readProjects();
    const projectIndex = projects.findIndex(p => p.projectId === projectId);

    if (projectIndex === -1) {
      console.warn(`[Delete Document API] ⚠️ ไม่พบโครงการรหัส: "${projectId}" ในฐานข้อมูล`);
      console.log(`[Delete Document API] รายการโครงการทั้งหมดที่มี:`, projects.map(p => p.projectId));
      return res.status(404).json({ success: false, message: "ไม่พบโครงการที่อ้างอิง" });
    }

    const doc = projects[projectIndex].documents[docType];
    if (doc) {
      if (doc.tempPath && fs.existsSync(doc.tempPath)) {
        try {
          fs.unlinkSync(doc.tempPath);
          console.log(`[Delete Document API] ลบไฟล์บนดิสก์สำเร็จ: ${doc.tempPath}`);
        } catch (unlinkErr) {
          console.error(`[Delete Document API] ❌ ลบไฟล์บนฮาร์ดดิสก์ขัดข้อง:`, unlinkErr.message);
        }
      } else {
        console.warn(`[Delete Document API] ⚠️ ไม่พบไฟล์บนดิสก์จริง ณ พาธ: ${doc.tempPath || 'null'}`);
      }

      // ล้างข้อมูลกลับเป็น null
      projects[projectIndex].documents[docType] = null;

      // ตรวจสอบว่ายังมีไฟล์ที่เหลืออยู่หรือไม่
      const docStates = projects[projectIndex].documents;
      const hasAnyDocs = !!(docStates.productSpec || docStates.pricingValuation || docStates.compliance);
      
      if (!hasAnyDocs) {
        console.log(`[Delete Document API] ไม่มีไฟล์เหลือในโครงการแล้ว ปรับลดสถานะกลับเป็น "initialized"`);
        projects[projectIndex].status = "initialized";
      }

      writeProjects(projects);
      console.log(`[Delete Document API] ✅ ปรับปรุงฐานข้อมูลโครงการ "${projectId}" สำเร็จ`);
      
      return res.status(200).json({
        success: true,
        projectId,
        message: "ลบไฟล์ออกจากระบบเรียบร้อย"
      });
    } else {
      console.warn(`[Delete Document API] ⚠️ ไม่พบประวัติอัปโหลดของไฟล์ประเภท "${docType}" ในระบบฐานข้อมูลโครงการนี้`);
      return res.status(400).json({ success: false, message: "ไม่พบไฟล์ที่ระบุในโครงการนี้" });
    }
  } catch (error) {
    console.error(`[Delete Document API] ❌ เกิดข้อผิดพลาดภายในในการลบไฟล์:`, error);
    return res.status(500).json({ success: false, message: "ไม่สามารถลบไฟล์เอกสารออกจากระบบได้" });
  }
}

module.exports = {
  uploadFileController,
  deleteFileController
};
