document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let currentProjectId = localStorage.getItem('currentProjectId') || null;
  let projectDocuments = {
    productSpec: null,
    pricingValuation: null,
    compliance: null
  };
  let currentProjectData = null;
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
  const analysisCards = document.querySelectorAll('.analysis-card');

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
  const tabButtons = document.querySelectorAll('#tabs-bar-s4 .tab-link');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

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
        const sections = ['landingPage', 'quickQuote', 'productCalculation', 'saleProposal'];
        
        sections.forEach(sec => {
          const card = document.querySelector(`.analysis-card[data-section="${sec}"]`);
          const chk = document.getElementById(`chk-${sec}`);
          
          if (reqs[sec]) {
            card.classList.add('selected');
            chk.checked = true;
          } else {
            card.classList.remove('selected');
            chk.checked = false;
          }
        });
        
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

  // ผูกการคลิกเลือกกล่องการ์ดวิเคราะห์
  analysisCards.forEach(card => {
    const chk = card.querySelector('.analysis-checkbox');
    const secName = card.getAttribute('data-section');

    card.addEventListener('click', () => {
      // ตรวจสอบว่าโดน Lock หรือไม่
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
    analysisCards.forEach(card => {
      card.querySelector('.analysis-checkbox').disabled = true;
      card.style.cursor = 'not-allowed';
    });

    // แสดงหน้ากากรอโหลด Glassmorphism
    loadingOverlay.classList.add('open');
    loadingTitleText.textContent = "กำลังวิเคราะห์ข้อมูล";
    loadingStatusText.textContent = "กำลังเริ่มตรวจเช็คระบบการเชื่อมต่อ Gemini API...";

    // รีเซ็ตสถานะหัวข้อทั้งหมดในหน้ากากรอโหลด
    const sections = ['landingPage', 'quickQuote', 'productCalculation', 'saleProposal'];
    sections.forEach(sec => {
      const stepDiv = document.getElementById(`loading-step-${sec}`);
      const indicator = stepDiv.querySelector('.step-icon-indicator');
      
      stepDiv.className = ''; // ล้าง CSS classes
      const card = document.querySelector(`.analysis-card[data-section="${sec}"]`);
      
      if (card.classList.contains('selected')) {
        indicator.textContent = '⚪';
      } else {
        indicator.textContent = '➖';
        stepDiv.style.opacity = '0.5';
      }
    });

    try {
      // ยิง Healthcheck เช็คคีย์ก่อน
      const checkRes = await fetch('/api/healthcheck/gemini');
      const checkData = await checkRes.json();
      
      if (!checkRes.ok || !checkData.success) {
        throw new Error(checkData.error || "ไม่สามารถเชื่อมต่อ Gemini API ได้ คีย์ไม่ถูกต้องหรืออินเทอร์เน็ตขัดข้อง");
      }

      // 2. รัน Sequential AJAX request ประมวลผลทีละหัวข้อแบบลูกโซ่ (Sequential Chain)
      const messageMap = {
        landingPage: {
          loading: "กำลังวิเคราะห์สกัดข้อมูลคุณสมบัติผลิตภัณฑ์ (Landing Page Spec)...",
          success: "สกัดข้อมูลผลิตภัณฑ์เสร็จสิ้น!"
        },
        quickQuote: {
          loading: "กำลังสแกนวิเคราะห์เกณฑ์ข้อจำกัดผู้เอาประกันภัย (Validation constraints)...",
          success: "วิเคราะห์เกณฑ์เสนอขายเสร็จสิ้น!"
        },
        productCalculation: {
          loading: "กำลังสกัดสูตรคำนวณ ตารางส่วนลดเบี้ย และอัตราเบี้ย (Premium formulas)...",
          success: "สกัดสูตรเบี้ยประกันภัยเสร็จสิ้น!"
        },
        saleProposal: {
          loading: "กำลังสืบค้นแผนผังตารางมูลค่าเวนคืน ลดหย่อนภาษี และข้อกฎหมาย ม. 865...",
          success: "สกัดตารางมูลค่าเวนคืนและกฎเกณฑ์เสร็จสิ้น!"
        }
      };

      for (const sec of sections) {
        const card = document.querySelector(`.analysis-card[data-section="${sec}"]`);
        if (!card.classList.contains('selected')) continue; // ข้ามตัวเลือกที่ไม่ถูกเลือก

        const stepDiv = document.getElementById(`loading-step-${sec}`);
        const indicator = stepDiv.querySelector('.step-icon-indicator');

        // เปลี่ยนหัวข้อเป็น Active
        stepDiv.classList.add('active-step');
        indicator.textContent = '⏳';
        loadingStatusText.textContent = messageMap[sec].loading;

        // เรียก API หลังบ้านสกัดข้อมูล
        const res = await fetch(`/api/projects/${currentProjectId}/analyze/${sec}`, {
          method: 'POST'
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
          indicator.textContent = '❌';
          throw new Error(data.message || `เกิดข้อผิดพลาดในการประมวลผลหัวข้อ ${sec}`);
        }

        // อัปเดตเมื่อวิเคราะห์หัวข้อนี้สำเร็จ
        stepDiv.classList.remove('active-step');
        stepDiv.classList.add('completed-step');
        indicator.textContent = '✅';
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
      analysisCards.forEach(card => {
        card.querySelector('.analysis-checkbox').disabled = false;
        card.style.cursor = 'pointer';
      });
      updateAnalyzeButtonState();
    }
  });

  // -------------------------------------------------------------
  // Screen 4: BSA Editor & Approval Logic
  // -------------------------------------------------------------
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.getAttribute('data-tab'));
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

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

        // 1. ตรวจสอบสถานะการเรนเดอร์แท็บ (ซ่อนแท็บที่ไม่มีข้อมูล)
        const sections = ['landingPage', 'quickQuote', 'productCalculation', 'saleProposal'];
        let firstVisibleTab = null;

        sections.forEach(sec => {
          const tabBtn = document.getElementById(`tab-btn-${sec}`);
          const panel = document.getElementById(`tab-${sec}`);
          
          if (reqs[sec]) {
            tabBtn.style.display = 'inline-block';
            if (!firstVisibleTab) firstVisibleTab = sec;
          } else {
            tabBtn.style.display = 'none';
            panel.classList.remove('active');
          }
        });

        // เปิดเฉพาะแท็บแรกที่มีข้อมูลจริง
        if (firstVisibleTab) {
          tabButtons.forEach(b => {
            b.classList.remove('active');
            if (b.getAttribute('data-tab') === `tab-${firstVisibleTab}`) {
              b.classList.add('active');
            }
          });
          tabPanels.forEach(p => {
            p.classList.remove('active');
            if (p.id === `tab-${firstVisibleTab}`) {
              p.classList.add('active');
            }
          });
        }

        // 2. ตั้งค่าแก้ไขข้อมูลและ Badges อ้างอิงตามสถานะอนุมัติ (Lock state)
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

        // กำหนดการอนุญาตพิมพ์แก้ไข (contenteditable)
        const canEdit = !isApproved;

        // 3. เรนเดอร์ข้อมูล Tab 1: Landing Page
        if (reqs.landingPage) {
          const lp = reqs.landingPage;
          const valProductName = document.getElementById('val-productName');
          const valTagline = document.getElementById('val-tagline');
          
          valProductName.textContent = lp.productName || '';
          valProductName.setAttribute('contenteditable', String(canEdit));
          
          valTagline.textContent = lp.tagline || '';
          valTagline.setAttribute('contenteditable', String(canEdit));

          const tbody = document.querySelector('#table-keyBenefits tbody');
          tbody.innerHTML = (lp.keyBenefits || []).map(b => `
            <tr>
              <td contenteditable="${canEdit}" style="font-weight: 500; border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${b.title || ''}</td>
              <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${b.description || ''}</td>
            </tr>
          `).join('');
        }

        // 4. เรนเดอร์ข้อมูล Tab 2: Quick Quote
        if (reqs.quickQuote && reqs.quickQuote.validationRules) {
          const rules = reqs.quickQuote.validationRules;
          const tbody = document.querySelector('#table-validationRules tbody');
          
          tbody.innerHTML = Object.keys(rules).map(k => {
            const r = rules[k];
            return `
              <tr>
                <td style="font-weight: bold; color: var(--color-primary-navy);">${k}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${r.min}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${r.max}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${r.dataType || ''}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${r.unit || ''}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${r.errorMessage || ''}</td>
              </tr>
            `;
          }).join('');
        }

        // 5. เรนเดอร์ข้อมูล Tab 3: Actuarial Calculation
        if (reqs.productCalculation) {
          const pc = reqs.productCalculation;
          const formulas = pc.formulas || {};
          
          ['basePremium', 'discount', 'totalPremium'].forEach(fKey => {
            const el = document.getElementById(`val-formula-${fKey}`);
            el.textContent = formulas[fKey] || '';
            el.setAttribute('contenteditable', String(canEdit));
          });

          // ตารางเกณฑ์ส่วนลด
          const tbodyDiscount = document.querySelector('#table-discountTiers tbody');
          tbodyDiscount.innerHTML = (pc.discountTiers || []).map(t => `
            <tr>
              <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${t.minSA}</td>
              <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${t.maxSA}</td>
              <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${t.rateDiscount}</td>
            </tr>
          `).join('');

          // ตารางเบี้ยประกันภัยรายปี
          const tbodyRates = document.querySelector('#table-premiumRateMatrix tbody');
          const matrix = pc.premiumRateMatrix || {};
          tbodyRates.innerHTML = Object.keys(matrix).map(age => {
            const m = matrix[age];
            return `
              <tr>
                <td style="font-weight: bold; color: var(--color-primary-navy);">${age}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${m.term_5}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${m.term_10}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${m.term_15}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${m.term_99}</td>
              </tr>
            `;
          }).join('');
        }

        // 6. เรนเดอร์ข้อมูล Tab 4: Sale Proposal & Compliance
        if (reqs.saleProposal) {
          const sp = reqs.saleProposal;
          const proj = sp.benefitProjectionRules || {};
          
          // ตารางมูลค่าเวนคืน
          const tbodyCV = document.querySelector('#table-cashValueRates tbody');
          tbodyCV.innerHTML = (proj.cashValueRates || []).map(v => {
            const rates = v.ratesByAge || {};
            return `
              <tr>
                <td style="font-weight: bold; color: var(--color-primary-navy);">${v.policyYear}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${rates.age_1}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${rates.age_30}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${rates.age_44}</td>
                <td contenteditable="${canEdit}" style="border: 1px dashed ${canEdit ? 'var(--color-secondary-indigo)' : 'var(--color-border-light)'};">${rates.age_60}</td>
              </tr>
            `;
          }).join('');

          // ภาษีและ disclaimer
          const taxLimit = document.getElementById('val-tax-limit');
          const taxDesc = document.getElementById('val-tax-desc');
          const compRef = document.getElementById('val-compliance-ref');
          const compText = document.getElementById('val-compliance-text');

          const tb = sp.taxBenefit || {};
          taxLimit.textContent = tb.maxDeductionLimit || '';
          taxLimit.setAttribute('contenteditable', String(canEdit));
          taxDesc.textContent = tb.ruleDescription || '';
          taxDesc.setAttribute('contenteditable', String(canEdit));

          const cd = sp.complianceDisclaimer || {};
          compRef.textContent = cd.sectionReference || '';
          compRef.setAttribute('contenteditable', String(canEdit));
          compText.textContent = cd.disclaimerText || '';
          compText.setAttribute('contenteditable', String(canEdit));
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

    // 1. Landing Page
    if (origReqs.landingPage) {
      const keyBenefits = [];
      document.querySelectorAll('#table-keyBenefits tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 2) {
          keyBenefits.push({
            title: tds[0].textContent.trim(),
            description: tds[1].textContent.trim()
          });
        }
      });
      reqs.landingPage = {
        productName: document.getElementById('val-productName').textContent.trim(),
        tagline: document.getElementById('val-tagline').textContent.trim(),
        keyBenefits
      };
    }

    // 2. Quick Quote
    if (origReqs.quickQuote) {
      const validationRules = {};
      document.querySelectorAll('#table-validationRules tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 6) {
          const varName = tds[0].textContent.trim();
          validationRules[varName] = {
            min: parseInt(tds[1].textContent.trim(), 10) || 0,
            max: parseInt(tds[2].textContent.trim(), 10) || 0,
            dataType: tds[3].textContent.trim(),
            unit: tds[4].textContent.trim(),
            errorMessage: tds[5].textContent.trim()
          };
        }
      });
      reqs.quickQuote = { validationRules };
    }

    // 3. Product Calculation
    if (origReqs.productCalculation) {
      const discountTiers = [];
      document.querySelectorAll('#table-discountTiers tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 3) {
          discountTiers.push({
            minSA: parseFloat(tds[0].textContent.trim()) || 0,
            maxSA: parseFloat(tds[1].textContent.trim()) || 0,
            rateDiscount: parseFloat(tds[2].textContent.trim()) || 0
          });
        }
      });

      const premiumRateMatrix = {};
      document.querySelectorAll('#table-premiumRateMatrix tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 5) {
          const age = tds[0].textContent.trim();
          premiumRateMatrix[age] = {
            term_5: parseFloat(tds[1].textContent.trim()) || 0,
            term_10: parseFloat(tds[2].textContent.trim()) || 0,
            term_15: parseFloat(tds[3].textContent.trim()) || 0,
            term_99: parseFloat(tds[4].textContent.trim()) || 0
          };
        }
      });

      reqs.productCalculation = {
        formulas: {
          basePremium: document.getElementById('val-formula-basePremium').textContent.trim(),
          discount: document.getElementById('val-formula-discount').textContent.trim(),
          totalPremium: document.getElementById('val-formula-totalPremium').textContent.trim()
        },
        discountTiers,
        premiumRateMatrix
      };
    }

    // 4. Sale Proposal
    if (origReqs.saleProposal) {
      const cashValueRates = [];
      document.querySelectorAll('#table-cashValueRates tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length >= 5) {
          cashValueRates.push({
            policyYear: parseInt(tds[0].textContent.trim(), 10) || 0,
            ratesByAge: {
              age_1: parseFloat(tds[1].textContent.trim()) || 0,
              age_30: parseFloat(tds[2].textContent.trim()) || 0,
              age_44: parseFloat(tds[3].textContent.trim()) || 0,
              age_60: parseFloat(tds[4].textContent.trim()) || 0
            }
          });
        }
      });

      reqs.saleProposal = {
        benefitProjectionRules: { cashValueRates },
        taxBenefit: {
          maxDeductionLimit: parseFloat(document.getElementById('val-tax-limit').textContent.trim()) || 0,
          ruleDescription: document.getElementById('val-tax-desc').textContent.trim()
        },
        complianceDisclaimer: {
          sectionReference: document.getElementById('val-compliance-ref').textContent.trim(),
          disclaimerText: document.getElementById('val-compliance-text').textContent.trim()
        }
      };
    }

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

        // 1. Landing Page
        if (reqs.landingPage) {
          md += `## 1. Marketing & Identity (ข้อมูลประชาสัมพันธ์และจุดเด่นหลัก)\n\n`;
          md += `* **ชื่อทางการค้า (Product Name):** ${reqs.landingPage.productName || '-'}\n`;
          md += `* **คำสโลแกน (Tagline):** ${reqs.landingPage.tagline || '-'}\n\n`;
          md += `### ผลประโยชน์และจุดขายสำคัญ (Key Benefits):\n\n`;
          (reqs.landingPage.keyBenefits || []).forEach(b => {
            md += `* **หัวข้อเด่น: "${b.title}"**\n  *รายละเอียด:* ${b.description}\n`;
          });
          md += `\n---\n\n`;
        }

        // 2. Quick Quote
        if (reqs.quickQuote && reqs.quickQuote.validationRules) {
          md += `## 2. Quick Quote Form Input Validation Rules (กฎการตรวจสอบข้อมูลรับเข้า)\n\n`;
          md += `| รหัสนำเข้า (Variable) | ต่ำสุด (Min) | สูงสุด (Max) | ประเภทข้อมูล (Data Type) | หน่วยวัด (Unit) | ข้อความแจ้งเตือนเมื่อหลุดเกณฑ์ (Error Message) |\n`;
          md += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;
          Object.keys(reqs.quickQuote.validationRules).forEach(k => {
            const r = reqs.quickQuote.validationRules[k];
            md += `| **${k}** | ${r.min} | ${r.max} | ${r.dataType} | ${r.unit} | ${r.errorMessage} |\n`;
          });
          md += `\n---\n\n`;
        }

        // 3. Calculation Formulas
        if (reqs.productCalculation) {
          const pc = reqs.productCalculation;
          const formulas = pc.formulas || {};
          md += `## 3. Product Calculation Engine & Math Formulas (กลไกคำนวณเบี้ยประกันภัย)\n\n`;
          md += `### สูตรความสัมพันธ์เชิงคณิตศาสตร์อ้างอิง:\n`;
          md += `* **เบี้ยประกันภัยฐาน (basePremium):** \`${formulas.basePremium || '-'}\`\n`;
          md += `* **ส่วนลดเบี้ยประกันภัยหลัก (discount):** \`${formulas.discount || '-'}\`\n`;
          md += `* **เบี้ยประกันภัยสุทธิต่อปี (totalPremium):** \`${formulas.totalPremium || '-'}\`\n\n`;

          md += `### ตารางอัตราส่วนลดทุนประกันหลัก (Discount Tiers):\n\n`;
          md += `| ทุนประกันประกันภัยขั้นต่ำ (Min SA) | ทุนประกันประกันภัยสูงสุด (Max SA) | ส่วนลดเบี้ยประกันภัยต่อทุน 1,000 บาท |\n`;
          md += `| :--- | :--- | :---: |\n`;
          (pc.discountTiers || []).forEach(t => {
            md += `| ${t.minSA.toLocaleString()} บาท | ${t.maxSA.toLocaleString()} บาท | ${t.rateDiscount} บาท |\n`;
          });
          md += `\n`;

          md += `### ตารางสัมประสิทธิ์อัตราเบี้ยประกันรายปีต่อทุน 1,000 บาท (Premium Rate Matrix - เพศชาย):\n\n`;
          md += `| กลุ่มอายุ (Age) | แผนชำระเบี้ย 5 ปี | แผนชำระเบี้ย 10 ปี | แผนชำระเบี้ย 15 ปี | แผนชำระเบี้ย 99 ปี |\n`;
          md += `| :--- | :---: | :---: | :---: | :---: |\n`;
          Object.keys(pc.premiumRateMatrix || {}).forEach(age => {
            const m = pc.premiumRateMatrix[age];
            md += `| **อายุ ${age} ปี** | ${m.term_5} บาท | ${m.term_10} บาท | ${m.term_15} บาท | ${m.term_99} บาท |\n`;
          });
          md += `\n---\n\n`;
        }

        // 4. Sale Proposal
        if (reqs.saleProposal) {
          const sp = reqs.saleProposal;
          const proj = sp.benefitProjectionRules || {};
          md += `## 4. Benefit Surrender Projection & Legal Disclaimers (มูลค่าเวนคืนและข้อกฎหมาย)\n\n`;
          
          md += `### ตารางอัตรามูลค่าเวนคืนกรมธรรม์ต่อทุน 1,000 บาท (แผนชำระเบี้ย 10 ปี):\n\n`;
          md += `| ถือครองกรมธรรม์ (Policy Year) | สิ้นปีที่อายุ 1 ปี | สิ้นปีที่อายุ 30 ปี | สิ้นปีที่อายุ 44 ปี | สิ้นปีที่อายุ 60 ปี |\n`;
          md += `| :---: | :---: | :---: | :---: | :---: |\n`;
          (proj.cashValueRates || []).forEach(v => {
            const r = v.ratesByAge || {};
            md += `| **ปีที่ ${v.policyYear}** | ${r.age_1} บาท | ${r.age_30} บาท | ${r.age_44} บาท | ${r.age_60} บาท |\n`;
          });
          md += `\n`;

          const tb = sp.taxBenefit || {};
          md += `### ข้อกำหนดสิทธิ์ประโยชน์ลดหย่อนภาษี (Tax Benefit Rules):\n`;
          md += `* **ขีดจำกัดสิทธิ์ลดหย่อนสูงสุด:** ${tb.maxDeductionLimit ? tb.maxDeductionLimit.toLocaleString() : '-'} บาท\n`;
          md += `* **สูตรตรรกะที่ใช้ประยุกต์:** \`${tb.ruleDescription || '-'}\`\n\n`;

          const cd = sp.complianceDisclaimer || {};
          md += `### คำแนะนำเตือนความสอดคล้อง (Compliance & Legal Disclaimers):\n`;
          md += `* **อ้างอิงพระราชบัญญัติและประมวลกฎหมาย:** *${cd.sectionReference || '-'}*\n`;
          md += `* **ข้อความคำเตือนคำแปลอย่างเป็นทางการ (ภาษาไทย):**\n  > ${cd.disclaimerText || '-'}\n`;
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
  if (currentProjectId) {
    // โหลดรายละเอียดโปรเจกต์เดิม เพื่อพิจารณาว่าควรไป Screen 2, 3 หรือ 4
    const checkStartupProject = async () => {
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
        // Fallback
        showScreen(2);
      }
    };
    checkStartupProject();
  } else {
    showScreen(1);
  }
});
