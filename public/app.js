document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentProjectId = localStorage.getItem('currentProjectId') || null;
  let projectDocuments = {
    productSpec: null,
    pricingValuation: null,
    compliance: null
  };

  // Screen Elements
  const screen1 = document.getElementById('screen-1');
  const screen2 = document.getElementById('screen-2');
  
  // Step Indicators
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');

  // Changelog Modal Selectors
  const versionBadge = document.getElementById('versionBadge');
  const changelogModal = document.getElementById('changelogModal');
  const modalClose = document.getElementById('modalClose');

  // Custom Alert Modal Selectors
  const alertDialogModal = document.getElementById('alertDialogModal');
  const alertModalTitle = document.getElementById('alertModalTitle');
  const alertModalMessage = document.getElementById('alertModalMessage');
  const alertModalIcon = document.getElementById('alertModalIcon');
  const btnAlertModalOk = document.getElementById('btnAlertModalOk');

  // Screen 1: Dashboard and Project Modal Selectors
  const dashboardView = document.getElementById('dashboard-view');
  const emptyStateView = document.getElementById('empty-state-view');
  const projectCreateModal = document.getElementById('projectCreateModal');
  const btnNewProject = document.getElementById('btn-new-project');
  const btnEmptyCreate = document.getElementById('btn-empty-create');
  const projectCreateModalClose = document.getElementById('projectCreateModalClose');
  const btnCancelProject = document.getElementById('btn-cancel-project');
  const projectsTableBody = document.getElementById('projects-table-body');
  const projectCountLabel = document.getElementById('project-count-label');

  // Screen 1 Form Selectors
  const projectForm = document.getElementById('project-form');
  const projectNameInput = document.getElementById('projectName');
  const descriptionInput = document.getElementById('description');
  const projectNameError = document.getElementById('projectName-error');
  const btnSubmit = document.getElementById('btn-submit');

  // Screen 2 Selectors
  const projectInfoSubtitle = document.getElementById('project-info-subtitle');
  const uploadAlert = document.getElementById('upload-alert');
  const btnBackToS1 = document.getElementById('btn-back-to-s1');
  const btnToS3 = document.getElementById('btn-to-s3');
  const dropzones = {
    productSpec: document.getElementById('dropzone-productSpec'),
    pricingValuation: document.getElementById('dropzone-pricingValuation'),
    compliance: document.getElementById('dropzone-compliance')
  };

  // -------------------------------------------------------------
  // Custom Alert Modal Logic
  // -------------------------------------------------------------
  const showModalAlert = (title, message, icon = '💡') => {
    alertModalTitle.textContent = title;
    alertModalMessage.textContent = message;
    alertModalIcon.textContent = icon;
    alertDialogModal.classList.add('open');
    btnAlertModalOk.focus();
  };

  const closeAlertModal = () => {
    alertDialogModal.classList.remove('open');
  };

  btnAlertModalOk.addEventListener('click', closeAlertModal);
  alertDialogModal.addEventListener('click', (e) => {
    if (e.target === alertDialogModal) closeAlertModal();
  });

  // -------------------------------------------------------------
  // Project Creation Modal Logic
  // -------------------------------------------------------------
  const openCreateModal = () => {
    projectCreateModal.classList.add('open');
    projectNameInput.focus();
  };

  const closeCreateModal = () => {
    projectCreateModal.classList.remove('open');
    // Clear validation state
    projectNameInput.value = '';
    descriptionInput.value = '';
    projectNameInput.style.borderColor = 'var(--color-border-light)';
    projectNameError.style.display = 'none';
  };

  btnNewProject.addEventListener('click', openCreateModal);
  btnEmptyCreate.addEventListener('click', openCreateModal);
  projectCreateModalClose.addEventListener('click', closeCreateModal);
  btnCancelProject.addEventListener('click', closeCreateModal);
  
  projectCreateModal.addEventListener('click', (e) => {
    if (e.target === projectCreateModal) closeCreateModal();
  });

  // -------------------------------------------------------------
  // Changelog Modal Logic
  // -------------------------------------------------------------
  const openModal = () => {
    changelogModal.classList.add('open');
    changelogModal.focus();
  };

  const closeModal = () => {
    changelogModal.classList.remove('open');
  };

  versionBadge.addEventListener('click', openModal);
  versionBadge.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });

  modalClose.addEventListener('click', closeModal);
  changelogModal.addEventListener('click', (e) => {
    if (e.target === changelogModal) closeModal();
  });

  // Global Keydown Listeners (ESC Key)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (changelogModal.classList.contains('open')) closeModal();
      if (projectCreateModal.classList.contains('open')) closeCreateModal();
      if (alertDialogModal.classList.contains('open')) closeAlertModal();
    }
  });

  // -------------------------------------------------------------
  // Screen Router & UI state managers
  // -------------------------------------------------------------
  const showScreen = (screenNumber) => {
    // Hide all screens
    screen1.style.display = 'none';
    screen2.style.display = 'none';

    // Reset step styles
    step1.className = 'step-item';
    step2.className = 'step-item';
    step3.className = 'step-item';
    step4.className = 'step-item';

    if (screenNumber === 1) {
      screen1.style.display = 'block';
      step1.classList.add('active');
      loadProjectsList();
    } else if (screenNumber === 2) {
      screen2.style.display = 'block';
      step1.classList.add('completed');
      step2.classList.add('active');
      loadProjectDetails();
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const showAlert = (message) => {
    uploadAlert.style.display = 'flex';
    uploadAlert.innerHTML = `<span>⚠️</span> <strong>ข้อผิดพลาด:</strong> ${message}`;
    uploadAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const hideAlert = () => {
    uploadAlert.style.display = 'none';
    uploadAlert.textContent = '';
  };

  // -------------------------------------------------------------
  // Screen 1: Dashboard List Loading
  // -------------------------------------------------------------
  const loadProjectsList = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();

      if (response.ok && data.success) {
        const projects = data.projects || [];
        projectCountLabel.textContent = `มีทั้งหมด ${projects.length} โครงการ`;

        if (projects.length === 0) {
          dashboardView.style.display = 'none';
          emptyStateView.style.display = 'block';
        } else {
          emptyStateView.style.display = 'none';
          dashboardView.style.display = 'block';
          
          // Sort projects by createdAt descending
          projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Map status values to Thai readable format
          const statusTextMap = {
            initialized: 'รอโหลดเอกสาร',
            documents_uploaded: 'รอบังคับวิเคราะห์',
            analyzed: 'วิเคราะห์แล้ว',
            approved: 'อนุมัติแล้ว'
          };

          projectsTableBody.innerHTML = projects.map(p => {
            const dateStr = new Date(p.createdAt).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const statusClass = p.status || 'initialized';
            const statusLabel = statusTextMap[p.status] || 'ตั้งต้น';

            return `
              <tr>
                <td style="padding: 1rem; font-weight: bold; color: var(--color-primary-navy);">${p.projectId}</td>
                <td style="padding: 1rem;">
                  <strong>${p.projectName}</strong>
                  <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                    ${p.description || 'ไม่มีรายละเอียดโครงการ'}
                  </div>
                </td>
                <td style="padding: 1rem; color: var(--color-text-muted);">${dateStr}</td>
                <td style="padding: 1rem;">
                  <span class="status-pill ${statusClass}">${statusLabel}</span>
                </td>
                <td style="padding: 1rem; text-align: right;">
                  <button class="btn btn-secondary btn-open-project" data-projectid="${p.projectId}" data-status="${p.status}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; min-width: auto; margin-top: 0;">
                    เปิดดำเนินการ ➜
                  </button>
                </td>
              </tr>
            `;
          }).join('');

          // Bind Action click handlers
          document.querySelectorAll('.btn-open-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const projectId = e.target.getAttribute('data-projectid');
              const status = e.target.getAttribute('data-status');
              resumeProject(projectId, status);
            });
          });
        }
      } else {
        showModalAlert('ดึงข้อมูลล้มเหลว', 'ไม่สามารถเชื่อมต่อดึงข้อมูลประวัติโครงการจากเซิร์ฟเวอร์ได้', '❌');
      }
    } catch (err) {
      console.error(err);
      showModalAlert('การเชื่อมต่อขัดข้อง', 'เกิดข้อผิดพลาดในการโหลดรายการโครงการ', '🌐');
    }
  };

  const resumeProject = (projectId, status) => {
    console.log(`Resuming project: ${projectId} with status: ${status}`);
    currentProjectId = projectId;
    localStorage.setItem('currentProjectId', projectId);

    if (status === 'initialized') {
      showScreen(2);
    } else if (status === 'documents_uploaded') {
      // Navigate to Screen 3
      showScreen(2); // Fallback to Screen 2
      showModalAlert(
        'กำลังเปิดระบบวิเคราะห์', 
        `โครงการ ${projectId} อัปโหลดเอกสารไว้แล้ว ระบบกำลังส่งต่อคุณไปยังหน้าจอวิเคราะห์ (เนื่องจาก Screen 3 อยู่ในระหว่างรอพัฒนาส่วนงานถัดไป ระบบจะพาคุณมาพักที่หน้านำเข้าเอกสารชั่วคราว)`, 
        '⏳'
      );
    } else if (status === 'analyzed' || status === 'approved') {
      // Navigate to Screen 4
      showScreen(2); // Fallback to Screen 2
      showModalAlert(
        'การวิเคราะห์เสร็จสิ้น', 
        `โครงการ ${projectId} ได้ทำการสกัดวิเคราะห์ AI หรือตรวจสอบแล้ว (เนื่องจาก Screen 4 อยู่ในระหว่างรอพัฒนาส่วนงานถัดไป ระบบจะพาคุณมาพักที่หน้านำเข้าเอกสารชั่วคราว)`, 
        '⏳'
      );
    } else {
      showScreen(2);
    }
  };

  // -------------------------------------------------------------
  // Screen 1: Project Initialization Form
  // -------------------------------------------------------------
  const validateProjectName = () => {
    const value = projectNameInput.value.trim();
    if (value.length < 3 || value.length > 100) {
      projectNameInput.style.borderColor = 'var(--color-error-red)';
      projectNameError.style.display = 'flex';
      return false;
    } else {
      projectNameInput.style.borderColor = 'var(--color-border-light)';
      projectNameError.style.display = 'none';
      return true;
    }
  };

  projectNameInput.addEventListener('input', () => {
    if (projectNameError.style.display === 'flex') validateProjectName();
  });

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateProjectName()) return;

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'กำลังเตรียมสร้างโครงการ...';

    const payload = {
      projectName: projectNameInput.value.trim(),
      description: descriptionInput.value.trim()
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        currentProjectId = data.projectId;
        localStorage.setItem('currentProjectId', currentProjectId);
        closeCreateModal();
        showScreen(2);
      } else {
        showModalAlert('สร้างโครงการไม่สำเร็จ', data.message || 'เกิดข้อผิดพลาดในการสร้างโครงการ', '❌');
      }
    } catch (err) {
      console.error(err);
      showModalAlert('การเชื่อมต่อขัดข้อง', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง', '🌐');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Create Project & Continue ➜';
    }
  });

  // -------------------------------------------------------------
  // Screen 2: Document Ingestion (Upload & Delete)
  // -------------------------------------------------------------
  const loadProjectDetails = async () => {
    if (!currentProjectId) {
      showScreen(1);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const project = data.project;
        projectInfoSubtitle.innerHTML = `โครงการ: <strong>${project.projectName}</strong> (${project.projectId})`;
        
        // Populate document statuses
        projectDocuments = project.documents || { productSpec: null, pricingValuation: null, compliance: null };
        updateUploadersUI();
      } else {
        localStorage.removeItem('currentProjectId');
        currentProjectId = null;
        showScreen(1);
      }
    } catch (err) {
      console.error(err);
      showAlert("ไม่สามารถโหลดรายละเอียดโครงการจากเซิร์ฟเวอร์ได้");
    }
  };

  const updateUploadersUI = () => {
    let hasAtLeastOneFile = false;

    Object.keys(dropzones).forEach(docType => {
      const zoneCard = dropzones[docType];
      const defaultDiv = document.getElementById(`default-${docType}`);
      const loadingDiv = document.getElementById(`loading-${docType}`);
      const detailsDiv = document.getElementById(`details-${docType}`);
      const fileData = projectDocuments[docType];

      // Reset card visual classes
      zoneCard.classList.remove('uploaded', 'dragover');
      
      // Hide loading div by default
      loadingDiv.style.display = 'none';

      if (fileData) {
        hasAtLeastOneFile = true;
        zoneCard.classList.add('uploaded');
        defaultDiv.style.display = 'none';
        
        // Update details display
        detailsDiv.style.display = 'block';
        detailsDiv.innerHTML = `
          <div class="file-details">
            <div class="file-name" title="${fileData.fileName}">${fileData.fileName}</div>
            <div class="file-meta">
              ขนาด: ${formatBytes(fileData.fileSize)} | อัปโหลดเมื่อ: ${new Date(fileData.uploadedAt).toLocaleTimeString()}
            </div>
            <button class="btn-delete" data-doctype="${docType}">
              <span class="btn-delete-icon">🗑️</span> ลบไฟล์
            </button>
          </div>
        `;

        // Register Delete button listener
        detailsDiv.querySelector('.btn-delete').addEventListener('click', (e) => {
          e.stopPropagation(); // Avoid triggering file selection
          deleteFile(docType);
        });
      } else {
        defaultDiv.style.display = 'block';
        detailsDiv.style.display = 'none';
        detailsDiv.innerHTML = '';
      }
    });

    // Toggle next button
    btnToS3.disabled = !hasAtLeastOneFile;
  };

  const handleFileUpload = async (file, docType) => {
    hideAlert();
    
    // Check file size on client side
    if (file.size > 10 * 1024 * 1024) {
      showAlert("ขนาดไฟล์เกิดข้อจำกัด: ขนาดไฟล์ห้ามเกิน 10 MB");
      return;
    }

    const formData = new FormData();
    formData.append('docType', docType);
    formData.append('file', file);

    const zoneCard = dropzones[docType];
    const defaultDiv = document.getElementById(`default-${docType}`);
    const loadingDiv = document.getElementById(`loading-${docType}`);
    const loadingFileName = document.getElementById(`loading-file-name-${docType}`);
    const detailsDiv = document.getElementById(`details-${docType}`);

    // Show loading state, hide default/details
    zoneCard.classList.remove('uploaded');
    defaultDiv.style.display = 'none';
    detailsDiv.style.display = 'none';
    
    loadingFileName.textContent = file.name;
    loadingDiv.style.display = 'block';

    try {
      const response = await fetch(`/api/projects/${currentProjectId}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok && data.success) {
        await loadProjectDetails();
      } else {
        showAlert(data.message || "อัปโหลดไฟล์ไม่สำเร็จ");
        loadingDiv.style.display = 'none';
        updateUploadersUI();
      }
    } catch (err) {
      console.error(err);
      showAlert("การอัปโหลดไฟล์ล้มเหลวเนื่องจากการเชื่อมต่อขัดข้อง");
      loadingDiv.style.display = 'none';
      updateUploadersUI();
    }
  };

  const deleteFile = async (docType) => {
    if (!confirm(`ต้องการลบไฟล์เอกสาร ${docType} ใช่หรือไม่?`)) return;

    hideAlert();

    try {
      const response = await fetch(`/api/projects/${currentProjectId}/documents/${docType}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (response.ok && data.success) {
        await loadProjectDetails();
      } else {
        showModalAlert('ลบไฟล์ไม่สำเร็จ', data.message || "ไม่สามารถลบไฟล์จากระบบได้", '❌');
      }
    } catch (err) {
      console.error(err);
      showModalAlert('การเชื่อมต่อขัดข้อง', 'เกิดข้อผิดพลาดในการลบไฟล์เนื่องจากการเชื่อมต่อขัดข้อง', '🌐');
    }
  };

  // Setup Drag & Drop Handlers for each zone
  const setupDropzoneHandlers = (docType) => {
    const zoneCard = dropzones[docType];
    const fileInput = document.getElementById(`file-${docType}`);

    // Trigger input click on card click (only if not uploaded)
    zoneCard.addEventListener('click', (e) => {
      if (!projectDocuments[docType]) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file, docType);
        // Clear input value to allow re-upload of same file
        fileInput.value = '';
      }
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      zoneCard.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!projectDocuments[docType]) {
          zoneCard.classList.add('dragover');
        }
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zoneCard.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        zoneCard.classList.remove('dragover');
      }, false);
    });

    zoneCard.addEventListener('drop', (e) => {
      if (projectDocuments[docType]) return; // ignore drop if already has file
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file) {
        handleFileUpload(file, docType);
      }
    }, false);
  };

  // Initialize dropzones
  Object.keys(dropzones).forEach(setupDropzoneHandlers);

  // Screen 2 buttons
  btnBackToS1.addEventListener('click', () => {
    localStorage.removeItem('currentProjectId');
    currentProjectId = null;
    showScreen(1);
  });

  btnToS3.addEventListener('click', () => {
    showModalAlert('อยู่ระหว่างรอพัฒนา', 'ระบบส่วนที่ 3 (Screen 3: AI Output Configuration) กำลังรอพัฒนาในส่วนงานถัดไปครับ!', '⏳');
  });

  // -------------------------------------------------------------
  // Application Startup Logic
  // -------------------------------------------------------------
  if (currentProjectId) {
    showScreen(2);
  } else {
    showScreen(1);
  }
});
