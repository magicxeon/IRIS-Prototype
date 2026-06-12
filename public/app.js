document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentProjectId = localStorage.getItem('currentProjectId') || null;
  let projectDocuments = {
    productSpec: null,
    pricingValuation: null,
    compliance: null
  };
  let currentProjectData = null;
  let extractionSchema = null;
  let searchTerm = '';
  let activeStatusFilter = 'all';

  // Screen Elements
  const screen1 = document.getElementById('screen-1');
  const screen2 = document.getElementById('screen-2');
  const screen3 = document.getElementById('screen-3');
  
  // Sidebar Elements & Navigation
  const navDashboard = document.getElementById('nav-dashboard');
  const navStep2 = document.getElementById('nav-step2');
  const navStep3 = document.getElementById('nav-step3');
  const navStep4 = document.getElementById('nav-step4');
  const sidebarProjectSection = document.getElementById('sidebar-project-section');
  const sidebarProjectName = document.getElementById('sidebar-project-name');
  const sidebarProjectStatus = document.getElementById('sidebar-project-status');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const appSidebar = document.getElementById('app-sidebar');

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

  // Dashboard stats & filters selectors
  const pillCountAll = document.getElementById('pill-count-all');
  const pillCountPending = document.getElementById('pill-count-pending');
  const pillCountAnalyzed = document.getElementById('pill-count-analyzed');
  const pillCountApproved = document.getElementById('pill-count-approved');
  const projectSearchInput = document.getElementById('project-search-input');
  const filterPills = document.querySelectorAll('.filter-pill');

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

  // Screen 3 Selectors
  const projectInfoSubtitleS3 = document.getElementById('project-info-subtitle-s3');
  const btnBackToS2 = document.getElementById('btn-back-to-s2');
  const btnAnalyzeGemini = document.getElementById('btn-analyze-gemini');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingStatusText = document.getElementById('loading-status-text');
  const loadingTitleText = document.getElementById('loading-title-text');
  // Screen 4 Selectors
  const screen4 = document.getElementById('screen-4');
  const projectInfoSubtitleS4 = document.getElementById('project-info-subtitle-s4');
  const screen4ApprovedBadge = document.getElementById('screen4-approved-badge');
  const btnBackToS3OrS1 = document.getElementById('btn-back-to-s3-or-s1');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportMd = document.getElementById('btn-export-md');
  const btnExportJira = document.getElementById('btn-export-jira');
  const btnExportWord = document.getElementById('btn-export-word');
  const btnApproveSpec = document.getElementById('btn-approve-spec');

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

  // Dashboard Search & Filters Event Listeners
  if (projectSearchInput) {
    projectSearchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      loadProjectsList();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeStatusFilter = pill.getAttribute('data-filter');
      loadProjectsList();
    });
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
  const updateSidebarNavStates = (status) => {
    navStep2.classList.add('disabled');
    navStep3.classList.add('disabled');
    navStep4.classList.add('disabled');
    
    // Step 2 is always enabled once inside project workflow
    navStep2.classList.remove('disabled');
    
    if (status === 'documents_uploaded') {
      navStep3.classList.remove('disabled');
    } else if (status === 'analyzed' || status === 'approved') {
      navStep3.classList.remove('disabled');
      navStep4.classList.remove('disabled');
    }
  };

  const updateBreadcrumbs = (screenNumber, projectName = '') => {
    if (screenNumber === 1) {
      breadcrumbs.innerHTML = `<span class="breadcrumb-item active">แดชบอร์ดโครงการ</span>`;
    } else {
      let stepName = '';
      if (screenNumber === 2) stepName = '1. นำเข้าเอกสารประกอบ';
      else if (screenNumber === 3) stepName = '2. ตั้งค่า & วิเคราะห์ AI';
      else if (screenNumber === 4) stepName = '3. ตรวจสอบ & ส่งออกข้อกำหนด';
      
      const projectDisplay = projectName ? projectName : 'กำลังโหลด...';
      breadcrumbs.innerHTML = `
        <span class="breadcrumb-item"><a href="#" id="breadcrumb-home" style="color: inherit; text-decoration: none;">แดชบอร์ด</a></span>
        <span class="breadcrumb-item">${projectDisplay}</span>
        <span class="breadcrumb-item active">${stepName}</span>
      `;
      
      const breadcrumbHome = document.getElementById('breadcrumb-home');
      if (breadcrumbHome) {
        breadcrumbHome.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('currentProjectId');
          currentProjectId = null;
          showScreen(1);
        });
      }
    }
  };

  const closeMobileSidebar = () => {
    if (appSidebar) appSidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('open');
  };

  const showScreen = async (screenNumber) => {
    // Collapse mobile sidebar when navigating
    closeMobileSidebar();

    // Hide all screens and remove transition animation class to reset
    [screen1, screen2, screen3, screen4].forEach(s => {
      if (s) {
        s.style.display = 'none';
        s.classList.remove('screen-view');
      }
    });

    // Reset active states for sidebar navigation items
    navDashboard.classList.remove('active');
    navStep2.classList.remove('active');
    navStep3.classList.remove('active');
    navStep4.classList.remove('active');

    // Show active screen and trigger transition animation
    const activeScreen = document.getElementById(`screen-${screenNumber}`);
    if (activeScreen) {
      activeScreen.style.display = 'block';
      void activeScreen.offsetWidth; // Force reflow
      activeScreen.classList.add('screen-view');
    }

    if (screenNumber === 1) {
      navDashboard.classList.add('active');
      sidebarProjectSection.style.display = 'none';
      updateBreadcrumbs(1);
      loadProjectsList();
    } else {
      sidebarProjectSection.style.display = 'block';
      updateBreadcrumbs(screenNumber);

      // Async sync sidebar information if project is open
      if (currentProjectId) {
        try {
          const response = await fetch(`/api/projects/${currentProjectId}`);
          const data = await response.json();
          if (response.ok && data.success) {
            const project = data.project;
            currentProjectData = project; // Cache locally
            sidebarProjectName.textContent = `${project.projectName}`;
            
            const statusTextMap = {
              initialized: 'รอโหลดเอกสาร',
              documents_uploaded: 'รอบังคับวิเคราะห์',
              analyzed: 'วิเคราะห์แล้ว',
              approved: 'อนุมัติแล้ว'
            };
            const statusLabel = statusTextMap[project.status] || 'ตั้งต้น';
            sidebarProjectStatus.textContent = statusLabel;
            sidebarProjectStatus.className = `status-pill ${project.status}`;
            
            updateSidebarNavStates(project.status);
            updateBreadcrumbs(screenNumber, project.projectName);
          }
        } catch (err) {
          console.error("Sidebar sync error:", err);
        }
      }

      if (screenNumber === 2) {
        navStep2.classList.add('active');
        loadProjectDetails();
      } else if (screenNumber === 3) {
        navStep3.classList.add('active');
        loadScreen3Details();
      } else if (screenNumber === 4) {
        navStep4.classList.add('active');
        loadScreen4Details();
      }
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
  const getProjectInitials = (name) => {
    if (!name) return 'PR';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getProjectAvatarColor = (projectId) => {
    let hash = 0;
    const idStr = String(projectId);
    for (let i = 0; i < idStr.length; i++) {
      hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradients = [
      'linear-gradient(135deg, #4f46e5, #06b6d4)', // Indigo to Cyan
      'linear-gradient(135deg, #10b981, #059669)', // Emerald to Green
      'linear-gradient(135deg, #6366f1, #a855f7)', // Indigo to Purple
      'linear-gradient(135deg, #f59e0b, #d97706)', // Amber to Orange
      'linear-gradient(135deg, #3b82f6, #1d4ed8)', // Blue to Navy
      'linear-gradient(135deg, #ec4899, #f43f5e)'  // Pink to Rose
    ];
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };
  const formatPillCount = (el, count) => {
    if (!el) return;
    if (count > 99) {
      el.textContent = '99+';
      el.title = `จำนวนจริง: ${count} โครงการ`;
    } else {
      el.textContent = count;
      el.removeAttribute('title');
    }
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
        
        // 1. Calculate Real-time Statistics
        const totalCount = projects.length;
        const pendingCount = projects.filter(p => p.status === 'initialized' || p.status === 'documents_uploaded').length;
        const analyzedCount = projects.filter(p => p.status === 'analyzed').length;
        const approvedCount = projects.filter(p => p.status === 'approved').length;

        // Update inline filter pill badges
        formatPillCount(pillCountAll, totalCount);
        formatPillCount(pillCountPending, pendingCount);
        formatPillCount(pillCountAnalyzed, analyzedCount);
        formatPillCount(pillCountApproved, approvedCount);

        if (totalCount === 0) {
          dashboardView.style.display = 'none';
          emptyStateView.style.display = 'block';
        } else {
          emptyStateView.style.display = 'none';
          dashboardView.style.display = 'block';
          
          // 2. Client-side Search and Filter application
          let filteredProjects = projects;
          
          // Apply search filter
          if (searchTerm) {
            const query = searchTerm.toLowerCase();
            filteredProjects = filteredProjects.filter(p => 
              p.projectId.toLowerCase().includes(query) ||
              p.projectName.toLowerCase().includes(query) ||
              (p.description && p.description.toLowerCase().includes(query))
            );
          }

          // Apply status pill filter
          if (activeStatusFilter !== 'all') {
            if (activeStatusFilter === 'pending') {
              filteredProjects = filteredProjects.filter(p => p.status === 'initialized' || p.status === 'documents_uploaded');
            } else {
              filteredProjects = filteredProjects.filter(p => p.status === activeStatusFilter);
            }
          }

          // Update count label with results mapping
          if (searchTerm || activeStatusFilter !== 'all') {
            projectCountLabel.textContent = `พบ ${filteredProjects.length} โครงการ (จากทั้งหมด ${totalCount} โครงการ)`;
          } else {
            projectCountLabel.textContent = `มีทั้งหมด ${totalCount} โครงการ`;
          }

          // Sort projects by createdAt descending
          filteredProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Map status values to Thai readable format
          const statusTextMap = {
            initialized: 'รอโหลดเอกสาร',
            documents_uploaded: 'รอบังคับวิเคราะห์',
            analyzed: 'วิเคราะห์แล้ว',
            approved: 'อนุมัติแล้ว'
          };

          if (filteredProjects.length === 0) {
            projectsTableBody.innerHTML = `
              <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
                  🔍 ไม่พบโครงการที่สอดคล้องกับเงื่อนไขการค้นหา
                </td>
              </tr>
            `;
          } else {
            projectsTableBody.innerHTML = filteredProjects.map(p => {
              const dateStr = new Date(p.createdAt).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const statusClass = p.status || 'initialized';
              const statusLabel = statusTextMap[p.status] || 'ตั้งต้น';

              // กำหนด label + สไตล์ปุ่มตามสถานะ
              let btnLabel, btnStyle;
              if (p.status === 'approved') {
                btnLabel = 'ดูรายงาน ✅';
                btnStyle = 'padding: 0.4rem 0.8rem; font-size: 0.85rem; min-width: auto; margin-top: 0; background: linear-gradient(135deg,#059669,#047857); color:white; border:none;';
              } else if (p.status === 'analyzed') {
                btnLabel = 'ดูผลลัพธ์ 📊';
                btnStyle = 'padding: 0.4rem 0.8rem; font-size: 0.85rem; min-width: auto; margin-top: 0; background: linear-gradient(135deg,#2563eb,#1d4ed8); color:white; border:none;';
              } else {
                btnLabel = 'เปิดดำเนินการ ➜';
                btnStyle = 'padding: 0.4rem 0.8rem; font-size: 0.85rem; min-width: auto; margin-top: 0;';
              }

              return `
                <tr>
                  <td style="padding: 1rem; font-weight: bold; color: var(--color-primary-navy);">${p.projectId}</td>
                  <td style="padding: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div class="project-avatar-circle" style="background: ${getProjectAvatarColor(p.projectId)}">
                        ${getProjectInitials(p.projectName)}
                      </div>
                      <div>
                        <strong>${p.projectName}</strong>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.25rem;">
                          ${p.description || 'ไม่มีรายละเอียดโครงการ'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style="padding: 1rem; color: var(--color-text-muted);">${dateStr}</td>
                  <td style="padding: 1rem;">
                    <span class="status-pill ${statusClass}">${statusLabel}</span>
                  </td>
                  <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-secondary btn-open-project" data-projectid="${p.projectId}" data-status="${p.status}" style="${btnStyle}">
                      ${btnLabel}
                    </button>
                  </td>
                </tr>
              `;
            }).join('');

            // Bind Action click handlers
            document.querySelectorAll('.btn-open-project').forEach(btn => {
              btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.btn-open-project');
                const projectId = targetBtn.getAttribute('data-projectid');
                const status = targetBtn.getAttribute('data-status');
                resumeProject(projectId, status);
              });
            });
          }
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
      showScreen(3);
    } else if (status === 'analyzed' || status === 'approved') {
      // ไปหน้าจอ 4 โดยตรงเพื่อดูผลลัพธ์ที่วิเคราะห์ไว้แล้ว
      showScreen(4);
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

  // Mobile Sidebar Hamburger & Overlay click handlers
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      if (appSidebar) appSidebar.classList.toggle('open');
      if (sidebarOverlay) sidebarOverlay.classList.toggle('open');
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  // Sidebar navigation handlers
  navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('currentProjectId');
    currentProjectId = null;
    showScreen(1);
  });

  navStep2.addEventListener('click', (e) => {
    e.preventDefault();
    if (navStep2.classList.contains('disabled')) return;
    showScreen(2);
  });

  navStep3.addEventListener('click', (e) => {
    e.preventDefault();
    if (navStep3.classList.contains('disabled')) return;
    showScreen(3);
  });

  navStep4.addEventListener('click', (e) => {
    e.preventDefault();
    if (navStep4.classList.contains('disabled')) return;
    showScreen(4);
  });

  // Screen 2 buttons
  btnBackToS1.addEventListener('click', () => {
    localStorage.removeItem('currentProjectId');
    currentProjectId = null;
    showScreen(1);
  });

  btnToS3.addEventListener('click', () => {
    showScreen(3);
  });

  // -------------------------------------------------------------
  // Screen 3: Output Configuration & AI Prompting Logic
  // -------------------------------------------------------------
  const loadExtractionSchema = async () => {
    try {
      const res = await fetch('/api/config/schema');
      if (res.ok) {
        extractionSchema = await res.json();
        renderScreen3Grid();
      } else {
        console.error("Failed to load schema");
      }
    } catch (err) {
      console.error("Error fetching schema:", err);
    }
  };

  const renderScreen3Grid = () => {
    const container = document.getElementById('analysis-grid-container');
    if (!container || !extractionSchema) return;
    
    container.innerHTML = extractionSchema.sections.map(sec => `
      <div class="analysis-card" data-section="${sec.key}" tabindex="0" role="checkbox" aria-checked="false" style="cursor: pointer;">
        <div class="analysis-card-header">
          <span class="analysis-card-icon">${sec.icon}</span>
          <h3 class="analysis-card-title">${sec.title}</h3>
        </div>
        <p class="analysis-card-desc">${sec.desc}</p>
        <div class="analysis-card-checkbox-wrapper" style="margin-top: 1rem; pointer-events: none;">
          <input type="checkbox" id="chk-${sec.key}" class="analysis-checkbox" tabindex="-1">
          <label for="chk-${sec.key}" class="checkbox-custom-label" style="font-weight: 600;">เลือกหัวข้อนี้</label>
        </div>
      </div>
    `).join('');

    // Bind event listeners to newly created cards
    const cards = container.querySelectorAll('.analysis-card');
    cards.forEach(card => {
      const chk = card.querySelector('.analysis-checkbox');
      card.addEventListener('click', () => {
        if (chk.disabled) return;
        const isSelected = card.classList.toggle('selected');
        chk.checked = isSelected;
        updateAnalyzeButtonState();
      });
      card.addEventListener('keydown', (e) => {
        if (chk.disabled) return;
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          const isSelected = card.classList.toggle('selected');
          chk.checked = isSelected;
          updateAnalyzeButtonState();
        }
      });
    });
  };

  const loadScreen3Details = async () => {
    if (!currentProjectId) {
      showScreen(1);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const project = data.project;
        projectInfoSubtitleS3.innerHTML = `โครงการ: <strong>${project.projectName}</strong> (${project.projectId})`;
        
        // ตรวจสอบข้อมูลความต้องการเดิมว่ามีอยู่หรือไม่ เพื่อเลือกตัวเลือกเดิมให้อัตโนมัติ
        const reqs = project.extractedRequirements || {};
        
        if (extractionSchema) {
          extractionSchema.sections.forEach(sec => {
            const card = document.querySelector(`.analysis-card[data-section="${sec.key}"]`);
            const chk = document.getElementById(`chk-${sec.key}`);
            if (card && chk) {
              if (reqs[sec.key]) {
                card.classList.add('selected');
                chk.checked = true;
              } else {
                card.classList.remove('selected');
                chk.checked = false;
              }
            }
          });
        }
        
        updateAnalyzeButtonState();
      } else {
        localStorage.removeItem('currentProjectId');
        currentProjectId = null;
        showScreen(1);
      }
    } catch (err) {
      console.error(err);
      showModalAlert("ข้อผิดพลาด", "ไม่สามารถโหลดรายละเอียดโครงการสำหรับวิเคราะห์ได้", "❌");
    }
  };

  const updateAnalyzeButtonState = () => {
    const selectedCount = document.querySelectorAll('.analysis-card.selected').length;
    btnAnalyzeGemini.disabled = selectedCount === 0;
  };

  btnBackToS2.addEventListener('click', () => {
    showScreen(2);
  });

  btnAnalyzeGemini.addEventListener('click', async () => {
    const selectedCards = document.querySelectorAll('.analysis-card.selected');
    if (selectedCards.length === 0) {
      showModalAlert('แจ้งเตือน', 'กรุณาเลือกหัวข้อสำหรับสกัดความต้องการอย่างน้อย 1 รายการ', '💡');
      return;
    }

    // 1. ตรวจสอบการเชื่อมต่อ Gemini API ก่อนเริ่มทำงาน
    btnAnalyzeGemini.disabled = true;
    btnBackToS2.disabled = true;
    
    const dynamicCards = document.querySelectorAll('.analysis-card');
    dynamicCards.forEach(card => {
      const chk = card.querySelector('.analysis-checkbox');
      if (chk) chk.disabled = true;
      card.style.cursor = 'not-allowed';
    });

    // แสดงหน้ากากรอโหลด Glassmorphism
    loadingOverlay.classList.add('open');
    loadingTitleText.textContent = "กำลังวิเคราะห์ข้อมูล";
    loadingStatusText.textContent = "กำลังเริ่มตรวจเช็คระบบการเชื่อมต่อ Gemini API...";

    // ล้างและสร้างหัวข้อขั้นตอนใหม่ในหน้ากากรอโหลดตาม Schema แบบ Dynamic
    const loadingStepsContainer = document.getElementById('loading-steps-container');
    if (loadingStepsContainer) {
      loadingStepsContainer.innerHTML = '';
      if (extractionSchema) {
        extractionSchema.sections.forEach((sec, idx) => {
          const stepDiv = document.createElement('div');
          stepDiv.id = `loading-step-${sec.key}`;
          stepDiv.style.display = 'flex';
          stepDiv.style.alignItems = 'center';
          stepDiv.style.justifyContent = 'space-between';
          
          const card = document.querySelector(`.analysis-card[data-section="${sec.key}"]`);
          const isSelected = card && card.classList.contains('selected');
          
          stepDiv.innerHTML = `
            <span>${idx + 1}. สกัดข้อมูล${sec.title}</span>
            <span class="step-icon-indicator" style="font-size: 1.1rem; font-weight: bold; margin-left: 0.5rem;">${isSelected ? '⚪' : '➖'}</span>
          `;
          if (!isSelected) {
            stepDiv.style.opacity = '0.5';
          }
          loadingStepsContainer.appendChild(stepDiv);
        });
      }
    }

    try {
      // ยิง Healthcheck เช็คคีย์ก่อน
      const checkRes = await fetch('/api/healthcheck/gemini');
      const checkData = await checkRes.json();
      
      if (!checkRes.ok || !checkData.success) {
        throw new Error(checkData.error || "ไม่สามารถเชื่อมต่อ Gemini API ได้ คีย์ไม่ถูกต้องหรืออินเทอร์เน็ตขัดข้อง");
      }

      // 2. รัน Sequential AJAX request ประมวลผลทีละหัวข้อแบบลูกโซ่ (Sequential Chain) จาก Schema
      if (extractionSchema) {
        for (const sec of extractionSchema.sections) {
          const card = document.querySelector(`.analysis-card[data-section="${sec.key}"]`);
          if (!card || !card.classList.contains('selected')) continue; // ข้ามตัวเลือกที่ไม่ถูกเลือก

          const stepDiv = document.getElementById(`loading-step-${sec.key}`);
          const indicator = stepDiv ? stepDiv.querySelector('.step-icon-indicator') : null;

          // เปลี่ยนหัวข้อเป็น Active
          if (stepDiv) stepDiv.classList.add('active-step');
          if (indicator) indicator.textContent = '⏳';
          loadingStatusText.textContent = `กำลังวิเคราะห์สกัดข้อมูล${sec.title}...`;

          // เรียก API หลังบ้านสกัดข้อมูล
          const res = await fetch(`/api/projects/${currentProjectId}/analyze/${sec.key}`, {
            method: 'POST'
          });
          const data = await res.json();

          if (!res.ok || !data.success) {
            if (indicator) indicator.textContent = '❌';
            throw new Error(data.message || `เกิดข้อผิดพลาดในการประมวลผลหัวข้อ ${sec.title}`);
          }

          // อัปเดตเมื่อวิเคราะห์หัวข้อนี้สำเร็จ
          if (stepDiv) {
            stepDiv.classList.remove('active-step');
            stepDiv.classList.add('completed-step');
          }
          if (indicator) indicator.textContent = '✅';
        }
      }

      // เสร็จสิ้นทั้งหมด
      loadingStatusText.textContent = "วิเคราะห์และสกัดข้อมูลทุกหัวข้อที่เลือกเสร็จสมบูรณ์เรียบร้อย!";
      
      // หน่วงเวลาเล็กน้อยเพื่อให้เห็นสถานะเสร็จสิ้นทั้งหมดชัดเจนก่อนปิด
      setTimeout(() => {
        loadingOverlay.classList.remove('open');
        showModalAlert(
          'วิเคราะห์สำเร็จ', 
          'ระบบทำการวิเคราะห์สกัดข้อกำหนดความต้องการด้วย Gemini AI เสร็จสิ้นทั้งหมดเรียบร้อยแล้ว!', 
          '🎉'
        );
        // พาผู้ใช้ไปยังหน้าจอที่ 4 เพื่อตรวจสอบและแก้ไขสเปกทันที
        showScreen(4);
      }, 1000);

    } catch (err) {
      console.error(err);
      loadingOverlay.classList.remove('open');
      showModalAlert('วิเคราะห์ล้มเหลว', err.message || 'เกิดข้อผิดพลาดขึ้นระหว่างดำเนินการวิเคราะห์ความต้องการ', '❌');
    } finally {
      // คืนค่า UI controls ทั้งหมดกลับมาทำงาน
      btnAnalyzeGemini.disabled = false;
      btnBackToS2.disabled = false;
      const dynamicCards = document.querySelectorAll('.analysis-card');
      dynamicCards.forEach(card => {
        const chk = card.querySelector('.analysis-checkbox');
        if (chk) chk.disabled = false;
        card.style.cursor = 'pointer';
      });
      updateAnalyzeButtonState();
    }
  });

  // -------------------------------------------------------------
  // Screen 4: BSA Editor & Approval Logic
  // -------------------------------------------------------------
  // Event delegation for Screen 4 Tab buttons switching
  const tabsBarS4 = document.getElementById('tabs-bar-s4');
  if (tabsBarS4) {
    tabsBarS4.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-link');
      if (!btn) return;
      
      const tabId = btn.getAttribute('data-tab');
      
      // Update active tab buttons styling
      tabsBarS4.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab panel display
      const container = document.getElementById('tab-contents-container');
      if (container) {
        container.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      }
    });
  }

  // Mapping helpers between UI flat rows and DB structured requirements
  const mapDataToFlatRows = (sectionKey, fieldKey, rawData) => {
    if (!rawData) return [];
    
    // Quick Quote - validationRules (Object of Objects)
    if (sectionKey === 'quickQuote' && fieldKey === 'validationRules') {
      return Object.keys(rawData).map(k => ({
        variable: k,
        min: rawData[k].min !== undefined ? rawData[k].min : '',
        max: rawData[k].max !== undefined ? rawData[k].max : '',
        dataType: rawData[k].dataType || '',
        unit: rawData[k].unit || '',
        errorMessage: rawData[k].errorMessage || ''
      }));
    }
    
    // Product Calculation - premiumRateMatrix (Object of Objects)
    if (sectionKey === 'productCalculation' && fieldKey === 'premiumRateMatrix') {
      return Object.keys(rawData).map(age => ({
        age: age,
        term_5: rawData[age].term_5 !== undefined ? rawData[age].term_5 : '',
        term_10: rawData[age].term_10 !== undefined ? rawData[age].term_10 : '',
        term_15: rawData[age].term_15 !== undefined ? rawData[age].term_15 : '',
        term_99: rawData[age].term_99 !== undefined ? rawData[age].term_99 : ''
      }));
    }
    
    // Sale Proposal - cashValueRates (Array of nested Objects)
    if (sectionKey === 'saleProposal' && fieldKey === 'cashValueRates') {
      return rawData.map(item => {
        const rates = item.ratesByAge || {};
        return {
          policyYear: item.policyYear !== undefined ? item.policyYear : '',
          age_1: rates.age_1 !== undefined ? rates.age_1 : '',
          age_30: rates.age_30 !== undefined ? rates.age_30 : '',
          age_44: rates.age_44 !== undefined ? rates.age_44 : '',
          age_60: rates.age_60 !== undefined ? rates.age_60 : ''
        };
      });
    }
    
    // Default: already flat array (e.g. keyBenefits, ridersList, discountTiers)
    return Array.isArray(rawData) ? rawData : [];
  };

  const mapFlatRowsToData = (sectionKey, fieldKey, flatRows, originalData) => {
    // Quick Quote - validationRules (Convert back to Object of Objects)
    if (sectionKey === 'quickQuote' && fieldKey === 'validationRules') {
      const result = {};
      flatRows.forEach(row => {
        const varName = row.variable;
        if (varName) {
          result[varName] = {
            min: isNaN(parseInt(row.min)) ? 0 : parseInt(row.min),
            max: isNaN(parseInt(row.max)) ? 0 : parseInt(row.max),
            dataType: row.dataType || '',
            unit: row.unit || '',
            errorMessage: row.errorMessage || ''
          };
        }
      });
      return result;
    }
    
    // Product Calculation - premiumRateMatrix (Convert back to Object of Objects)
    if (sectionKey === 'productCalculation' && fieldKey === 'premiumRateMatrix') {
      const result = {};
      flatRows.forEach(row => {
        const age = row.age;
        if (age) {
          result[age] = {
            term_5: isNaN(parseFloat(row.term_5)) ? 0 : parseFloat(row.term_5),
            term_10: isNaN(parseFloat(row.term_10)) ? 0 : parseFloat(row.term_10),
            term_15: isNaN(parseFloat(row.term_15)) ? 0 : parseFloat(row.term_15),
            term_99: isNaN(parseFloat(row.term_99)) ? 0 : parseFloat(row.term_99)
          };
        }
      });
      return result;
    }
    
    // Sale Proposal - cashValueRates (Convert back to Array of nested Objects)
    if (sectionKey === 'saleProposal' && fieldKey === 'cashValueRates') {
      return flatRows.map(row => ({
        policyYear: isNaN(parseInt(row.policyYear)) ? 0 : parseInt(row.policyYear),
        ratesByAge: {
          age_1: isNaN(parseFloat(row.age_1)) ? 0 : parseFloat(row.age_1),
          age_30: isNaN(parseFloat(row.age_30)) ? 0 : parseFloat(row.age_30),
          age_44: isNaN(parseFloat(row.age_44)) ? 0 : parseFloat(row.age_44),
          age_60: isNaN(parseFloat(row.age_60)) ? 0 : parseFloat(row.age_60)
        }
      }));
    }

    // Key benefits and discount tiers should have typed values if parsed
    if (sectionKey === 'landingPage' && fieldKey === 'keyBenefits') {
      return flatRows.map(row => ({
        title: row.title || '',
        description: row.description || ''
      }));
    }

    if (sectionKey === 'productCalculation' && fieldKey === 'discountTiers') {
      return flatRows.map(row => ({
        minSA: isNaN(parseFloat(row.minSA)) ? 0 : parseFloat(row.minSA),
        maxSA: isNaN(parseFloat(row.maxSA)) ? 0 : parseFloat(row.maxSA),
        rateDiscount: isNaN(parseFloat(row.rateDiscount)) ? 0 : parseFloat(row.rateDiscount)
      }));
    }

    if (sectionKey === 'supportedRiders' && fieldKey === 'ridersList') {
      return flatRows.map(row => ({
        riderName: row.riderName || '',
        riderType: row.riderType || '',
        entryAgeMin: isNaN(parseInt(row.entryAgeMin)) ? 0 : parseInt(row.entryAgeMin),
        entryAgeMax: isNaN(parseInt(row.entryAgeMax)) ? 0 : parseInt(row.entryAgeMax),
        renewalAgeLimit: isNaN(parseInt(row.renewalAgeLimit)) ? 0 : parseInt(row.renewalAgeLimit),
        renewalNote: row.renewalNote || ''
      }));
    }
    
    // Default: flat rows array
    return flatRows;
  };

  const loadScreen4Details = async () => {
    if (!currentProjectId) {
      showScreen(1);
      return;
    }

    try {
      const response = await fetch(`/api/projects/${currentProjectId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        currentProjectData = data.project;
        projectInfoSubtitleS4.innerHTML = `โครงการ: <strong>${currentProjectData.projectName}</strong> (${currentProjectData.projectId})`;
        
        const reqs = currentProjectData.extractedRequirements || {};
        const isApproved = currentProjectData.status === 'approved';
        const canEdit = !isApproved;

        // 1. ตั้งค่า Badges และการเปิด/ปิดดาวน์โหลด
        if (isApproved) {
          screen4ApprovedBadge.style.display = 'inline-block';
          btnApproveSpec.textContent = 'Approved ✓';
          btnApproveSpec.disabled = true;
          btnExportJson.style.display = 'inline-flex';
          btnExportMd.style.display = 'inline-flex';
          btnExportJira.style.display = 'inline-flex';
          btnExportWord.style.display = 'inline-flex';
        } else {
          screen4ApprovedBadge.style.display = 'none';
          btnApproveSpec.textContent = 'Approve Final Spec ✓';
          btnApproveSpec.disabled = false;
          btnExportJson.style.display = 'none';
          btnExportMd.style.display = 'none';
          btnExportJira.style.display = 'none';
          btnExportWord.style.display = 'none';
        }

        // 2. เรนเดอร์ Tab Buttons และ Tab Content Panels แบบ Dynamic ตาม Schema
        const tabsBar = document.getElementById('tabs-bar-s4');
        const contentsContainer = document.getElementById('tab-contents-container');
        
        if (!tabsBar || !contentsContainer || !extractionSchema) return;

        tabsBar.innerHTML = '';
        contentsContainer.innerHTML = '';

        let firstVisibleTab = null;

        extractionSchema.sections.forEach(sec => {
          // ถ้าหัวข้อนี้ได้รับการสกัดวิเคราะห์ข้อมูลแล้ว
          if (reqs[sec.key]) {
            if (!firstVisibleTab) firstVisibleTab = sec.key;
            
            // วาด Tab Button
            const tabBtn = document.createElement('button');
            tabBtn.className = 'tab-link';
            tabBtn.setAttribute('data-tab', `tab-${sec.key}`);
            tabBtn.id = `tab-btn-${sec.key}`;
            tabBtn.innerHTML = `${sec.icon} ${sec.title}`;
            tabsBar.appendChild(tabBtn);

            // วาด Tab Panel
            const panel = document.createElement('div');
            panel.className = 'tab-content-panel';
            panel.id = `tab-${sec.key}`;
            
            // วาดหัวข้อในแท็บ
            panel.innerHTML = `
              <h3 style="font-size: 1.15rem; font-weight: bold; color: var(--color-primary-navy); margin-bottom: 1rem; border-bottom: 2px solid var(--color-background-slate); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span>${sec.icon}</span> ${sec.title} Spec Overview
              </h3>
            `;

            // วาด Fields ภายในแท็บ
            sec.fields.forEach(field => {
              const fieldValue = reqs[sec.key][field.key];
              
              if (field.type === 'text') {
                const fieldDiv = document.createElement('div');
                fieldDiv.className = 'editable-field-group';
                fieldDiv.style.marginBottom = '1.25rem';
                fieldDiv.innerHTML = `
                  <label style="font-weight: bold; font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.25rem; display: block;">${field.label}</label>
                  <div class="editable-val" id="val-${sec.key}-${field.key}" contenteditable="${canEdit}" style="padding: 0.65rem 0.85rem; border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'}; border-radius: var(--radius-sm); font-size: 0.95rem; min-height: 38px; line-height: 1.5; outline: none; background: ${canEdit ? 'var(--color-background-light)' : 'transparent'}; box-shadow: ${canEdit ? 'inset 0 1px 2px rgba(0,0,0,0.02)' : 'none'};" data-section="${sec.key}" data-field="${field.key}">${fieldValue || ''}</div>
                `;
                panel.appendChild(fieldDiv);
              } else if (field.type === 'table') {
                const flatRows = mapDataToFlatRows(sec.key, field.key, fieldValue);
                
                const tableDiv = document.createElement('div');
                tableDiv.className = 'editable-table-group';
                tableDiv.style.marginBottom = '1.75rem';
                tableDiv.innerHTML = `
                  <h4 style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.5rem; color: var(--color-text-dark);">${field.label}</h4>
                  <div style="overflow-x: auto; border: 1px solid var(--color-border-light); border-radius: var(--radius-sm);">
                    <table class="zebra-table" style="width: 100%; font-size: 0.9rem; border-collapse: collapse;" id="table-${sec.key}-${field.key}" data-section="${sec.key}" data-field="${field.key}">
                      <thead>
                        <tr style="background-color: var(--color-background-slate); border-bottom: 2px solid var(--color-border-light);">
                          ${field.columns.map(col => `<th style="padding: 0.75rem; text-align: left; font-weight: 600; font-size: 0.85rem; color: var(--color-text-dark);">${col.label}</th>`).join('')}
                        </tr>
                      </thead>
                      <tbody>
                        ${flatRows.length === 0 ? `
                          <tr>
                            <td colspan="${field.columns.length}" style="text-align: center; color: var(--color-text-muted); padding: 1.5rem;">ไม่มีข้อมูลการสกัดส่วนนี้</td>
                          </tr>
                        ` : flatRows.map((row, rowIdx) => `
                          <tr style="border-bottom: 1px solid var(--color-border-light);">
                            ${field.columns.map((col, colIdx) => {
                              const cellVal = row[col.key] !== undefined ? row[col.key] : '';
                              const isKeyCol = colIdx === 0; // คอลัมน์แรกมักจะเป็นคีย์หลัก ห้ามแก้ไขเพื่อไม่ให้ข้อมูลพัง
                              const cellEditable = canEdit && !isKeyCol;
                              const cellStyle = isKeyCol ? 'font-weight: bold; color: var(--color-primary-navy); background: var(--color-background-light);' : '';
                              return `
                                <td contenteditable="${cellEditable}" data-col="${col.key}" style="padding: 0.75rem; border: 1px dashed ${cellEditable ? 'var(--color-secondary-indigo)' : 'transparent'}; outline: none; ${cellStyle}">
                                  ${cellVal}
                                </td>
                              `;
                            }).join('')}
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `;
                panel.appendChild(tableDiv);
              }
            });

            contentsContainer.appendChild(panel);
          }
        });

        // เปิดเฉพาะแท็บแรกที่มีข้อมูลจริง
        if (firstVisibleTab) {
          const firstTabBtn = document.getElementById(`tab-btn-${firstVisibleTab}`);
          const firstPanel = document.getElementById(`tab-${firstVisibleTab}`);
          if (firstTabBtn) firstTabBtn.classList.add('active');
          if (firstPanel) firstPanel.classList.add('active');
        }

      } else {
        localStorage.removeItem('currentProjectId');
        currentProjectId = null;
        showScreen(1);
      }
    } catch (err) {
      console.error(err);
      showModalAlert("ดึงข้อมูลล้มเหลว", "ไม่สามารถดึงรายละเอียดข้อกำหนดมาแสดงได้", "❌");
    }
  };

  // ปุ่มกดย้อนกลับจากหน้า 4
  btnBackToS3OrS1.addEventListener('click', () => {
    if (currentProjectData && currentProjectData.status === 'approved') {
      // หากอนุมัติเสร็จสมบูรณ์แล้ว ให้ถอยกลับไปหน้า Dashboard หลักเลย
      localStorage.removeItem('currentProjectId');
      currentProjectId = null;
      showScreen(1);
    } else {
      // หากยังไม่อนุมัติ ถอยกลับไปหน้าเลือก prompt สแกน AI
      showScreen(3);
    }
  });

  // รวบรวมข้อมูลแก้ไขจากกล่องตารางข้อความ
  const collectScreen4Requirements = () => {
    const reqs = {};
    const origReqs = currentProjectData.extractedRequirements || {};

    if (!extractionSchema) return origReqs;

    extractionSchema.sections.forEach(sec => {
      // ดำเนินการเฉพาะหัวข้อที่มีข้อมูลอยู่เดิม
      if (origReqs[sec.key]) {
        reqs[sec.key] = {};
        
        sec.fields.forEach(field => {
          if (field.type === 'text') {
            const el = document.getElementById(`val-${sec.key}-${field.key}`);
            const textVal = el ? el.textContent.trim() : '';
            // ใช้ค่าดั้งเดิมพิจารณาประเภทข้อมูล ถ้าค่าเดิมเป็นตัวเลข ให้พาร์สเป็นตัวเลข
            const originalVal = origReqs[sec.key][field.key];
            reqs[sec.key][field.key] = (typeof originalVal === 'number') 
              ? (isNaN(parseFloat(textVal)) ? 0 : parseFloat(textVal))
              : textVal;
          } else if (field.type === 'table') {
            const table = document.getElementById(`table-${sec.key}-${field.key}`);
            const flatRows = [];
            
            if (table) {
              const rows = table.querySelectorAll('tbody tr');
              rows.forEach(tr => {
                const tds = tr.querySelectorAll('td');
                if (tds.length === field.columns.length) {
                  const rowObj = {};
                  field.columns.forEach((col, colIdx) => {
                    rowObj[col.key] = tds[colIdx].textContent.trim();
                  });
                  flatRows.push(rowObj);
                }
              });
            }
            
            // นำ flat rows แปลงกลับสู่โครงสร้างดั้งเดิม (nested หรือ object of objects)
            const originalValue = origReqs[sec.key][field.key];
            reqs[sec.key][field.key] = mapFlatRowsToData(sec.key, field.key, flatRows, originalValue);
          }
        });
      }
    });

    return reqs;
  };

  // ยิงคำร้องอนุมัติโครงการสุดท้าย
  btnApproveSpec.addEventListener('click', async () => {
    if (!currentProjectId) return;
    if (!confirm("ต้องการอนุมัติผลสรุปข้อกำหนดความต้องการนี้ใช่หรือไม่? เมื่อกดยืนยันแล้วจะไม่สามารถแก้ไขเนื้อหาในระบบได้อีก")) return;

    btnApproveSpec.disabled = true;
    btnBackToS3OrS1.disabled = true;

    const updated = collectScreen4Requirements();

    try {
      const response = await fetch(`/api/projects/${currentProjectId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedRequirements: updated })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showModalAlert('อนุมัติสำเร็จ', 'บันทึกการตรวจสอบสเปกข้อกำหนดความต้องการและประทับอนุมัติสำเร็จเรียบร้อยแล้ว!', '🎉');
        await loadScreen4Details(); // รีโหลดสเตตเพื่อปิดกล่องแก้ไขและเปิดใช้ดาวน์โหลด
      } else {
        showModalAlert('ผิดพลาด', data.message || 'ไม่สามารถทำอนุมัติโครงการได้สำเร็จ', '❌');
        btnApproveSpec.disabled = false;
        btnBackToS3OrS1.disabled = false;
      }
    } catch (err) {
      console.error(err);
      showModalAlert('การเชื่อมต่อขัดข้อง', 'การยืนยันอนุมัติล้มเหลวเนื่องจากการเชื่อมต่อขัดข้อง', '🌐');
      btnApproveSpec.disabled = false;
      btnBackToS3OrS1.disabled = false;
    }
  });

  // ปุ่มส่งออกรายงาน JSON
  btnExportJson.addEventListener('click', () => {
    if (!currentProjectData) return;
    
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentProjectData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${currentProjectData.projectId}-insurance-specification.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      showModalAlert('ดาวน์โหลดล้มเหลว', 'เกิดข้อผิดพลาดในการแปลงข้อมูลดาวน์โหลดไฟล์ JSON', '❌');
    }
  });

  // ปุ่มส่งออกรายงาน Markdown
  btnExportMd.addEventListener('click', () => {
    if (!currentProjectData) return;

    try {
      const generateMarkdownReport = (project) => {
        let md = `# Insurance Technical Specification: ${project.projectName} (${project.projectId})\n\n`;
        md += `* **วันที่สร้างข้อกำหนด:** ${new Date(project.createdAt).toLocaleDateString('th-TH')}\n`;
        if (project.approvedAt) {
          md += `* **วันที่ได้รับการตรวจสอบอนุมัติ:** ${new Date(project.approvedAt).toLocaleDateString('th-TH')}\n`;
        }
        md += `* **สถานะความต้องการ:** APPROVED FINAL SPECIFICATION\n\n`;
        md += `---\n\n`;

        const reqs = project.extractedRequirements || {};

        if (extractionSchema) {
          extractionSchema.sections.forEach((sec, idx) => {
            if (reqs[sec.key]) {
              md += `## ${idx + 1}. ${sec.title} (${sec.desc})\n\n`;
              
              sec.fields.forEach(field => {
                const val = reqs[sec.key][field.key];
                
                if (field.type === 'text') {
                  md += `* **${field.label}:** ${val !== undefined && val !== '' ? val : '-'}\n`;
                } else if (field.type === 'table') {
                  md += `### ${field.label}:\n\n`;
                  
                  const flatRows = mapDataToFlatRows(sec.key, field.key, val);
                  if (flatRows.length === 0) {
                    md += `*ไม่มีข้อมูล*\n\n`;
                  } else {
                    md += `| ` + field.columns.map(c => c.label).join(' | ') + ` |\n`;
                    md += `| ` + field.columns.map(() => ':---').join(' | ') + ` |\n`;
                    flatRows.forEach(row => {
                      md += `| ` + field.columns.map(c => {
                        const cellVal = row[c.key] !== undefined ? row[c.key] : '';
                        return String(cellVal).replace(/\|/g, '\\|'); // หลบอักขระ table pipe
                      }).join(' | ') + ` |\n`;
                    });
                    md += `\n`;
                  }
                }
              });
              md += `\n---\n\n`;
            }
          });
        }

        return md;
      };

      const mdText = generateMarkdownReport(currentProjectData);
      const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdText);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${currentProjectData.projectId}-insurance-specification.md`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      showModalAlert('ดาวน์โหลดล้มเหลว', 'เกิดข้อผิดพลาดในการจัดทำเอกสารวิศวกรรมแบบรูปธรรม Markdown', '❌');
    }
  });

  // ปุ่มดาวน์โหลด JIRA CSV (server-side stream)
  btnExportJira.addEventListener('click', () => {
    if (!currentProjectId) return;
    // เปิด URL โดยตรง เพื่อให้ browser ดาวน์โหลดไฟล์ผ่าน HTTP response stream
    window.location.href = `/api/projects/${currentProjectId}/export/jira`;
  });

  // ปุ่มดาวน์โหลด Word Document (server-side stream)
  btnExportWord.addEventListener('click', () => {
    if (!currentProjectId) return;
    window.location.href = `/api/projects/${currentProjectId}/export/word`;
  });

  // -------------------------------------------------------------
  // Application Startup Logic
  // -------------------------------------------------------------
  // App initialization function
  const initApp = async () => {
    await loadExtractionSchema();
    if (currentProjectId) {
      try {
        const response = await fetch(`/api/projects/${currentProjectId}`);
        const data = await response.json();
        if (response.ok && data.success) {
          const status = data.project.status;
          if (status === 'initialized') {
            showScreen(2);
          } else if (status === 'documents_uploaded') {
            showScreen(3);
          } else if (status === 'analyzed' || status === 'approved') {
            showScreen(4);
          } else {
            showScreen(2);
          }
        } else {
          localStorage.removeItem('currentProjectId');
          currentProjectId = null;
          showScreen(1);
        }
      } catch (err) {
        showScreen(2);
      }
    } else {
      showScreen(1);
    }
  };
  initApp();
});
