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

module.exports = {
  generateNextProjectId,
  createProjectController,
  getProjectsController,
  getProjectByIdController
};
