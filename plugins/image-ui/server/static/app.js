document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabSingle = document.getElementById('tab-single');
  const tabBatch = document.getElementById('tab-batch');
  const viewSingle = document.getElementById('view-single');
  const viewBatch = document.getElementById('view-batch');
  const batchCountBadge = document.getElementById('batch-count-badge');

  tabSingle.addEventListener('click', () => switchTab('single'));
  tabBatch.addEventListener('click', () => switchTab('batch'));

  function switchTab(mode) {
    if (mode === 'single') {
      tabSingle.className = 'px-5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20';
      tabBatch.className = 'px-5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800';
      viewSingle.classList.remove('hidden');
      viewBatch.classList.add('hidden');
    } else {
      tabBatch.className = 'px-5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 bg-indigo-600 text-white shadow-lg shadow-indigo-500/20';
      tabSingle.className = 'px-5 py-2.5 text-xs font-medium rounded-xl transition-all duration-200 bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800';
      viewBatch.classList.remove('hidden');
      viewBatch.classList.add('flex');
      viewSingle.classList.add('hidden');
    }
  }

  // --- SETTINGS CONFIGURATION ---
  const btnConfig = document.getElementById('btn-config');
  const modalConfig = document.getElementById('modal-config');
  const btnCloseConfig = document.getElementById('btn-close-config');
  const btnCancelConfig = document.getElementById('btn-cancel-config');
  const btnSaveConfig = document.getElementById('btn-save-config');

  const cfgSaveLocation = document.getElementById('cfg-save-location');
  const cfgDefaultFormat = document.getElementById('cfg-default-format');
  const cfgDefaultQuality = document.getElementById('cfg-default-quality');
  const cfgPort = document.getElementById('cfg-port');
  const cfgAutoOpen = document.getElementById('cfg-auto-open');

  let appConfig = {
    port: 4500,
    autoOpen: true,
    defaultQuality: 80,
    defaultFormat: 'webp',
    saveLocation: '.kds/output',
  };

  async function fetchServerConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        appConfig = await res.json();
        applyConfigToUI(appConfig);
      }
    } catch (err) {
      console.error('Failed to load server config:', err);
    }
  }

  function applyConfigToUI(cfg) {
    if (cfg.saveLocation) {
      cfgSaveLocation.value = cfg.saveLocation;
    }
    if (cfg.defaultFormat) {
      cfgDefaultFormat.value = cfg.defaultFormat;
      setFormatButton(cfg.defaultFormat);
      if (batchGlobalFormat) batchGlobalFormat.value = cfg.defaultFormat;
    }
    if (cfg.defaultQuality) {
      cfgDefaultQuality.value = cfg.defaultQuality;
      qualityRange.value = cfg.defaultQuality;
      qualityVal.textContent = `${cfg.defaultQuality}%`;
      if (batchGlobalQuality) {
        batchGlobalQuality.value = cfg.defaultQuality;
        batchGlobalQualityVal.textContent = `${cfg.defaultQuality}%`;
      }
    }
    if (cfg.port) cfgPort.value = cfg.port;
    if (cfg.autoOpen !== undefined) cfgAutoOpen.checked = !!cfg.autoOpen;
  }

  btnConfig.addEventListener('click', () => {
    applyConfigToUI(appConfig);
    modalConfig.classList.remove('hidden');
  });

  btnCloseConfig.addEventListener('click', () => modalConfig.classList.add('hidden'));
  btnCancelConfig.addEventListener('click', () => modalConfig.classList.add('hidden'));

  btnSaveConfig.addEventListener('click', async () => {
    const updated = {
      saveLocation: cfgSaveLocation.value.trim() || '.kds/output',
      defaultFormat: cfgDefaultFormat.value,
      defaultQuality: parseInt(cfgDefaultQuality.value, 10) || 80,
      port: parseInt(cfgPort.value, 10) || 4500,
      autoOpen: cfgAutoOpen.checked,
    };

    btnSaveConfig.disabled = true;
    btnSaveConfig.textContent = '💾 Saving...';

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error('Failed to update config');
      const data = await res.json();
      appConfig = data.config;
      applyConfigToUI(appConfig);
      modalConfig.classList.add('hidden');
      alert(`✓ Settings saved to .kds/image-ui.config.json!\nSave location: ${appConfig.saveLocation}`);
    } catch (err) {
      alert(`Error saving config: ${err.message}`);
    } finally {
      btnSaveConfig.disabled = false;
      btnSaveConfig.textContent = '💾 Save Settings';
    }
  });


  // --- SINGLE STUDIO CONTROLS ---
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfoBox = document.getElementById('file-info-box');
  const infoName = document.getElementById('info-name');
  const infoDetails = document.getElementById('info-details');

  const qualityRange = document.getElementById('quality-range');
  const qualityVal = document.getElementById('quality-val');
  const widthInput = document.getElementById('width-input');
  const heightInput = document.getElementById('height-input');
  const losslessCheck = document.getElementById('lossless-check');

  const btnProcess = document.getElementById('btn-process');
  const btnDownload = document.getElementById('btn-download');
  const btnSave = document.getElementById('btn-save');
  const btnScan = document.getElementById('btn-scan');

  const imgOriginal = document.getElementById('img-original');
  const phOriginal = document.getElementById('ph-original');
  const footerOriginal = document.getElementById('footer-original');

  const imgOptimized = document.getElementById('img-optimized');
  const phOptimized = document.getElementById('ph-optimized');
  const footerOptimized = document.getElementById('footer-optimized');
  const savingsBadge = document.getElementById('savings-badge');

  const modalScanner = document.getElementById('modal-scanner');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const scannerList = document.getElementById('scanner-list');

  let activeFile = null;
  let activeFormat = 'webp';
  let processedResult = null;

  // Single format selection
  const formatButtons = document.querySelectorAll('#format-picker .btn-format');
  formatButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setFormatButton(btn.dataset.format);
    });
  });

  function setFormatButton(fmt) {
    activeFormat = fmt;
    formatButtons.forEach(b => {
      if (b.dataset.format === fmt) {
        b.className = 'btn-format active py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white border border-indigo-500 transition-all text-center';
      } else {
        b.className = 'btn-format py-2 text-xs font-medium rounded-lg bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:border-zinc-500 transition-all text-center';
      }
    });
  }

  qualityRange.addEventListener('input', () => {
    qualityVal.textContent = `${qualityRange.value}%`;
  });

  // Drag & drop single
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-indigo-500', 'bg-indigo-950/20');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-indigo-500', 'bg-indigo-950/20');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        // Multi files dropped -> switch to batch mode
        addFilesToBatch(Array.from(e.dataTransfer.files));
        switchTab('batch');
      } else {
        handleSingleFileSelected(e.dataTransfer.files[0]);
      }
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      if (fileInput.files.length > 1) {
        addFilesToBatch(Array.from(fileInput.files));
        switchTab('batch');
      } else {
        handleSingleFileSelected(fileInput.files[0]);
      }
    }
  });

  function handleSingleFileSelected(file) {
    activeFile = file;
    infoName.textContent = file.name;
    infoDetails.textContent = formatBytes(file.size);
    fileInfoBox.classList.remove('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
      imgOriginal.src = e.target.result;
      imgOriginal.classList.remove('hidden');
      phOriginal.classList.add('hidden');
      footerOriginal.textContent = formatBytes(file.size);
    };
    reader.readAsDataURL(file);
  }

  // Single Process
  btnProcess.addEventListener('click', async () => {
    if (!activeFile) {
      alert('Please select or upload an image first.');
      return;
    }

    btnProcess.disabled = true;
    btnProcess.textContent = '⏳ Processing...';

    try {
      const formData = new FormData();
      formData.append('image', activeFile);
      formData.append('format', activeFormat);
      formData.append('quality', qualityRange.value);
      if (widthInput.value) formData.append('width', widthInput.value);
      if (heightInput.value) formData.append('height', heightInput.value);
      if (losslessCheck.checked) formData.append('lossless', 'true');

      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Processing failed');
      }

      const blob = await res.blob();
      const processedUrl = URL.createObjectURL(blob);

      imgOptimized.src = processedUrl;
      imgOptimized.classList.remove('hidden');
      phOptimized.classList.add('hidden');
      footerOptimized.textContent = formatBytes(blob.size);

      processedResult = { blob, fileName: getOutputFilename(activeFile.name, activeFormat) };

      const origSize = activeFile.size;
      const optSize = blob.size;
      const savedPercent = Math.round(((origSize - optSize) / origSize) * 100);

      savingsBadge.textContent = `${savedPercent >= 0 ? '-' : '+'}${Math.abs(savedPercent)}%`;
      savingsBadge.classList.remove('hidden');

      btnDownload.disabled = false;
      btnSave.disabled = false;
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      btnProcess.disabled = false;
      btnProcess.textContent = '⚡ Process & Preview';
    }
  });

  // Single Download & Save
  btnDownload.addEventListener('click', () => {
    if (!processedResult) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(processedResult.blob);
    a.download = processedResult.fileName;
    a.click();
  });

  btnSave.addEventListener('click', async () => {
    if (!processedResult) return;
    btnSave.disabled = true;
    btnSave.textContent = '💾 Saving...';

    try {
      const formData = new FormData();
      formData.append('image', processedResult.blob, processedResult.fileName);
      formData.append('saveLocation', appConfig.saveLocation || '.kds/output');

      const res = await fetch('/api/save', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to save file to workspace');
      const data = await res.json();
      alert(`✓ Saved file to workspace at:\n${data.path}`);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = '💾 Save File';
    }
  });


  // --- BATCH HANDLING CONTROLS ---
  let batchQueue = [];

  const batchFileInput = document.getElementById('batch-file-input');
  const btnClearBatch = document.getElementById('btn-clear-batch');
  const batchGlobalFormat = document.getElementById('batch-global-format');
  const batchGlobalQuality = document.getElementById('batch-global-quality');
  const batchGlobalQualityVal = document.getElementById('batch-global-quality-val');
  const btnApplyGlobal = document.getElementById('btn-apply-global');
  const btnProcessBatch = document.getElementById('btn-process-batch');
  const batchTableBody = document.getElementById('batch-table-body');

  const batchTotalFiles = document.getElementById('batch-total-files');
  const batchTotalOrig = document.getElementById('batch-total-orig');
  const batchTotalOpt = document.getElementById('batch-total-opt');
  const batchTotalSaved = document.getElementById('batch-total-saved');
  const btnBatchSaveWorkspace = document.getElementById('btn-batch-save-workspace');

  batchGlobalQuality.addEventListener('input', () => {
    batchGlobalQualityVal.textContent = `${batchGlobalQuality.value}%`;
  });

  batchFileInput.addEventListener('change', () => {
    if (batchFileInput.files.length > 0) {
      addFilesToBatch(Array.from(batchFileInput.files));
      batchFileInput.value = '';
    }
  });

  btnApplyGlobal.addEventListener('click', () => {
    const fmt = batchGlobalFormat.value;
    const q = parseInt(batchGlobalQuality.value, 10);
    batchQueue.forEach(item => {
      item.format = fmt;
      item.quality = q;
    });
    renderBatchTable();
  });

  btnClearBatch.addEventListener('click', () => {
    batchQueue = [];
    renderBatchTable();
  });

  function addFilesToBatch(files) {
    files.forEach(file => {
      batchQueue.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        format: batchGlobalFormat.value || appConfig.defaultFormat || 'webp',
        quality: parseInt(batchGlobalQuality.value, 10) || appConfig.defaultQuality || 80,
        status: 'pending',
        processedBlob: null,
        processedSize: 0,
        error: null,
      });
    });
    renderBatchTable();
  }

  function renderBatchTable() {
    batchCountBadge.textContent = batchQueue.length;
    batchTotalFiles.textContent = `${batchQueue.length} files`;

    if (batchQueue.length === 0) {
      batchTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-zinc-500">
            No images in batch queue. Drag & drop files or click "Add Files" above.
          </td>
        </tr>`;
      btnProcessBatch.disabled = true;
      btnBatchSaveWorkspace.disabled = true;
      updateBatchSummary();
      return;
    }

    btnProcessBatch.disabled = false;
    batchTableBody.innerHTML = '';

    batchQueue.forEach((item) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors';

      let statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">Pending</span>`;
      if (item.status === 'processing') {
        statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Processing...</span>`;
      } else if (item.status === 'done') {
        statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completed</span>`;
      } else if (item.status === 'error') {
        statusBadge = `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>`;
      }

      tr.innerHTML = `
        <td class="py-3 px-4 font-medium text-zinc-200 max-w-[200px] truncate">${item.file.name}</td>
        <td class="py-3 px-4 text-zinc-400">${formatBytes(item.file.size)}</td>
        <td class="py-3 px-4">
          <select data-id="${item.id}" class="item-format px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
            <option value="webp" ${item.format === 'webp' ? 'selected' : ''}>WebP</option>
            <option value="avif" ${item.format === 'avif' ? 'selected' : ''}>AVIF</option>
            <option value="ico" ${item.format === 'ico' ? 'selected' : ''}>ICO</option>
            <option value="png" ${item.format === 'png' ? 'selected' : ''}>PNG</option>
            <option value="jpeg" ${item.format === 'jpeg' ? 'selected' : ''}>JPEG</option>
          </select>
        </td>
        <td class="py-3 px-4">
          <input type="number" data-id="${item.id}" min="1" max="100" value="${item.quality}" class="item-quality w-14 px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-700 text-zinc-200 text-center">
        </td>
        <td class="py-3 px-4">${statusBadge}</td>
        <td class="py-3 px-4 font-medium text-emerald-400">${item.processedSize ? formatBytes(item.processedSize) : '-'}</td>
        <td class="py-3 px-4 text-right">
          <button data-id="${item.id}" class="btn-remove-item text-zinc-500 hover:text-red-400 px-2 py-1 text-xs">🗑️</button>
        </td>
      `;

      batchTableBody.appendChild(tr);
    });

    document.querySelectorAll('.item-format').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const item = batchQueue.find(i => i.id === e.target.dataset.id);
        if (item) item.format = e.target.value;
      });
    });

    document.querySelectorAll('.item-quality').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const item = batchQueue.find(i => i.id === e.target.dataset.id);
        if (item) item.quality = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 80));
      });
    });

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        batchQueue = batchQueue.filter(i => i.id !== id);
        renderBatchTable();
      });
    });

    updateBatchSummary();
  }

  function updateBatchSummary() {
    const totalOrig = batchQueue.reduce((acc, item) => acc + item.file.size, 0);
    const totalOpt = batchQueue.reduce((acc, item) => acc + (item.processedSize || 0), 0);

    batchTotalOrig.textContent = formatBytes(totalOrig);
    batchTotalOpt.textContent = formatBytes(totalOpt);

    if (totalOrig > 0 && totalOpt > 0) {
      const saved = Math.round(((totalOrig - totalOpt) / totalOrig) * 100);
      batchTotalSaved.textContent = `${saved >= 0 ? '-' : '+'}${Math.abs(saved)}%`;
      btnBatchSaveWorkspace.disabled = false;
    } else {
      batchTotalSaved.textContent = '0%';
      btnBatchSaveWorkspace.disabled = true;
    }
  }

  btnProcessBatch.addEventListener('click', async () => {
    if (batchQueue.length === 0) return;

    btnProcessBatch.disabled = true;
    btnProcessBatch.textContent = '⏳ Processing Batch...';

    for (let item of batchQueue) {
      item.status = 'processing';
      renderBatchTable();

      try {
        const formData = new FormData();
        formData.append('image', item.file);
        formData.append('format', item.format);
        formData.append('quality', item.quality);

        const res = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Processing failed');

        const blob = await res.blob();
        item.processedBlob = blob;
        item.processedSize = blob.size;
        item.status = 'done';
      } catch (err) {
        item.status = 'error';
        item.error = err.message;
      }

      renderBatchTable();
    }

    btnProcessBatch.disabled = false;
    btnProcessBatch.textContent = '⚡ Process Entire Batch';
  });

  btnBatchSaveWorkspace.addEventListener('click', async () => {
    const completedItems = batchQueue.filter(i => i.status === 'done' && i.processedBlob);
    if (completedItems.length === 0) {
      alert('No processed files ready to save.');
      return;
    }

    btnBatchSaveWorkspace.disabled = true;
    btnBatchSaveWorkspace.textContent = '💾 Saving Batch...';

    let savedCount = 0;
    for (let item of completedItems) {
      try {
        const formData = new FormData();
        const outName = getOutputFilename(item.file.name, item.format);
        formData.append('image', item.processedBlob, outName);
        formData.append('saveLocation', appConfig.saveLocation || '.kds/output');

        const res = await fetch('/api/save', { method: 'POST', body: formData });
        if (res.ok) savedCount++;
      } catch {
        // continue
      }
    }

    alert(`✓ Saved ${savedCount} batch images into: ${appConfig.saveLocation || '.kds/output'}`);
    btnBatchSaveWorkspace.disabled = false;
    btnBatchSaveWorkspace.textContent = '💾 Save All Batch Files';
  });


  // --- WORKSPACE SCANNER MODAL ---
  btnScan.addEventListener('click', async () => {
    modalScanner.classList.remove('hidden');
    scannerList.innerHTML = '<p class="text-xs text-zinc-500">Scanning project files...</p>';

    try {
      const res = await fetch('/api/scan');
      const data = await res.json();

      if (data.files.length === 0) {
        scannerList.innerHTML = '<p class="text-xs text-zinc-500">No images found in workspace.</p>';
        return;
      }

      scannerList.innerHTML = '';
      data.files.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-indigo-500/60 cursor-pointer flex justify-between items-center text-xs transition-colors';
        div.innerHTML = `<span class="font-medium text-zinc-200 truncate mr-2">📄 ${item.relPath}</span><span class="text-zinc-500 shrink-0">${formatBytes(item.size)}</span>`;
        
        div.addEventListener('click', async () => {
          modalScanner.classList.add('hidden');
          const fileRes = await fetch(`/api/file?path=${encodeURIComponent(item.relPath)}`);
          const blob = await fileRes.blob();
          const file = new File([blob], item.name, { type: blob.type });

          if (viewBatch.classList.contains('flex')) {
            addFilesToBatch([file]);
          } else {
            handleSingleFileSelected(file);
          }
        });

        scannerList.appendChild(div);
      });
    } catch {
      scannerList.innerHTML = '<p class="text-xs text-red-400">Failed to scan workspace files.</p>';
    }
  });

  btnCloseModal.addEventListener('click', () => modalScanner.classList.add('hidden'));

  // Initial config load
  fetchServerConfig();

  // Utility functions
  function getOutputFilename(originalName, format) {
    const parts = originalName.split('.');
    if (parts.length > 1) parts.pop();
    return `${parts.join('.')}.${format}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
});
