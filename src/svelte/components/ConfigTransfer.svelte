<script>
  import { _ } from 'svelte-i18n';
  import { encodeConfig, decodeConfig, pickActiveConfig } from '../configTransfer.js';

  let { configManager, darkTheme = true } = $props();

  let showExport = $state(false);
  let showImport = $state(false);

  let exportText = $state('');
  let exporting = $state(false);
  let exportFailed = $state(false);
  let copied = $state(false);
  let copyFailed = $state(false);
  let exportEl = $state();
  let copyTimer;

  let importText = $state('');
  let importErrorCode = $state('');

  /**
   * channelsConfigList holds the saved state, pending edits live in
   * selectedConfig: merge both so the export matches what the user sees.
   */
  function buildExportPayload() {
    const saved = configManager.channelsConfigList;
    if (!saved || !Array.isArray(saved.configsList)) return null;

    // The JSON round-trip unwraps the Svelte proxy, and cleanRecursively mutates
    // its argument so it needs a copy. Same as ConfigManager.saveConfig.
    const snapshot = JSON.parse(JSON.stringify(saved));
    if (!configManager.selectedConfig) return snapshot;

    const live = configManager.cleanRecursively(
      'rootList',
      JSON.parse(JSON.stringify(configManager.selectedConfig))
    );
    const index = snapshot.configsList.findIndex(conf => conf.rootList.name === live.rootList.name);
    if (index >= 0) snapshot.configsList[index] = live;
    else snapshot.configsList.push(live);

    return snapshot;
  }

  async function openExport() {
    showExport = true;
    exporting = true;
    exportFailed = false;
    copied = false;
    copyFailed = false;
    try {
      const payload = buildExportPayload();
      if (!payload) throw new Error('No configuration loaded');
      exportText = await encodeConfig(payload);
    } catch (err) {
      console.error('configTransfer:export', err);
      exportText = '';
      exportFailed = true;
    } finally {
      exporting = false;
    }
  }

  function closeExport() {
    showExport = false;
    clearTimeout(copyTimer);
    copied = false;
  }


  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the fallback below */
    }
    try {
      exportEl?.focus();
      exportEl?.select();
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }

  async function copyExport() {
    const ok = await writeClipboard(exportText);
    copied = ok;
    copyFailed = !ok;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copied = false; copyFailed = false; }, 2000);
  }

  function openImport() {
    showImport = true;
    importText = '';
    importErrorCode = '';
  }

  function closeImport() {
    showImport = false;
    importErrorCode = '';
  }

  async function confirmImport() {
    importErrorCode = '';
    try {
      const imported = await decodeConfig(importText);
      const conf = pickActiveConfig(imported);

      // The worker's saveConfig() matches by rootList.name and never updates
      // currentConfig: keeping the local name avoids pushing a duplicate.
      const localName = configManager.selectedConfig?.rootList?.name;
      if (localName) conf.rootList.name = localName;

      configManager.selectedConfig = conf;
      showImport = false;
      importText = '';
    } catch (err) {
      importErrorCode = err?.code ?? 'CONFIG';
    }
  }
</script>

<div class="transfer-actions">
  <button
    class="bottom-btn transfer-btn btn-tip"
    class:dark={darkTheme}
    data-tooltip={$_('configPopup.importTooltip')}
    onclick={openImport}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    {$_('configPopup.import')}
  </button>

  <button
    class="bottom-btn transfer-btn btn-tip"
    class:dark={darkTheme}
    data-tooltip={$_('configPopup.exportTooltip')}
    onclick={openExport}
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    {$_('configPopup.export')}
  </button>
</div>

{#if showExport}
  <div
    class="transfer-overlay"
    role="presentation"
    onclick={closeExport}
    onkeydown={(e) => e.key === 'Escape' && closeExport()}
  >
    <div
      class="confirm-modal transfer-modal"
      class:dark={darkTheme}
      id="export-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="confirm-modal-header">
        <button
          class="close-btn cross"
          aria-label={$_('configPopup.close')}
          onclick={closeExport}
        >X</button>
      </div>

      <div class="modal-icon" class:dark={darkTheme} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <p id="export-modal-title" class="confirm-text">{$_('configPopup.exportPrompt')}</p>

      {#if exportFailed}
        <div class="transfer-error" class:dark={darkTheme}>{$_('configPopup.exportError')}</div>
      {:else}
        <div class="code-wrap">
          <textarea
            bind:this={exportEl}
            class:dark={darkTheme}
            readonly
            value={exporting ? '…' : exportText}
            onfocus={(e) => e.currentTarget.select()}
          ></textarea>
          <button
            class="copy-btn btn-tip"
            class:done={copied}
            class:failed={copyFailed}
            disabled={exporting}
            onclick={copyExport}
            data-tooltip={copied
              ? $_('configPopup.copied')
              : copyFailed ? $_('configPopup.copyFailed') : $_('configPopup.copy')}
            aria-label={$_('configPopup.copy')}
          >
            {#if copied}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            {/if}
          </button>
        </div>
      {/if}

      <div class="confirm-actions">
        <button class="save-btn bottom-btn" onclick={closeExport}>{$_('configPopup.close')}</button>
      </div>
    </div>
  </div>
{/if}

{#if showImport}
  <div
    class="transfer-overlay"
    role="presentation"
    onclick={closeImport}
    onkeydown={(e) => e.key === 'Escape' && closeImport()}
  >
    <div
      class="confirm-modal transfer-modal"
      class:dark={darkTheme}
      id="import-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="confirm-modal-header">
        <button
          class="close-btn cross"
          aria-label={$_('configPopup.cancel')}
          onclick={closeImport}
        >X</button>
      </div>

      <div class="modal-icon" class:dark={darkTheme} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </div>

      <p id="import-modal-title" class="confirm-text">{$_('configPopup.importPrompt')}</p>
      <p class="confirm-sub" class:dark={darkTheme}>{$_('configPopup.importWarning')}</p>

      <div class="code-wrap">
        <!-- svelte-ignore a11y_autofocus -->
        <textarea
          class:dark={darkTheme}
          autofocus
          bind:value={importText}
          placeholder={$_('configPopup.importPlaceholder')}
        ></textarea>
      </div>

      {#if importErrorCode}
        <div class="transfer-error" class:dark={darkTheme}>
          {importErrorCode === 'EMPTY' ? $_('configPopup.importErrorEmpty') : $_('configPopup.importError')}
        </div>
      {/if}

      <div class="confirm-actions">
        <button class="reset-btn bottom-btn" onclick={confirmImport}>{$_('configPopup.import')}</button>
        <button class="save-btn bottom-btn" onclick={closeImport}>{$_('configPopup.cancel')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .transfer-actions {
    display: flex;
    gap: 0.75em;
  }

  .close-btn,
  .bottom-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    width: auto;
    padding: 0.6em 1.5em;
    font-weight: 600;
    font-size: 0.95em;
    font-family: inherit;
    color: #fff;
    border: none;
    border-radius: 0.625em;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
  }
  .close-btn,
  .save-btn {
    background: linear-gradient(135deg, #a970ff, #7a3dff);
  }
  .close-btn {
    padding: 0.4em 0.8em;
    margin: 0.5em .4em .5em 0;
  }
  .reset-btn {
    background: linear-gradient(135deg, #75282d, #ee4242);
  }
  .bottom-btn:hover {
    transform: translateY(-1px);
  }
  .bottom-btn:active {
    transform: translateY(1px);
  }
  .bottom-btn svg {
    width: 1.05em;
    height: 1.05em;
  }
  .transfer-btn {
    background: transparent;
    border: 1.5px solid #7a3dff;
    color: #5c16c5;
  }
  .transfer-btn.dark {
    border-color: #a970ff;
    color: #bf94ff;
  }
  .transfer-btn:hover {
    background: rgba(145, 71, 255, 0.14);
  }
  .btn-tip {
    position: relative;
  }
  .btn-tip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(4px);
    width: max-content;
    max-width: 220px;
    padding: 0.4em 0.6em;
    border-radius: 0.4em;
    background: #1f1f23;
    color: #efeff1;
    font-size: 0.85em;
    font-weight: 400;
    line-height: 1.3;
    text-align: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 10;
  }
  .btn-tip:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .transfer-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
  }
  .confirm-modal {
    min-width: 300px;
    max-width: 90%;
    padding: 0.5em 1.5em 1.4em;
    border-radius: 0.75em;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    font-family: sans-serif;
  }
  .transfer-modal {
    width: 34em;
    max-width: 92%;
  }
  .confirm-modal-header {
    display: flex;
    justify-content: flex-end;
  }
  .confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75em;
  }

  .modal-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.5em;
    height: 4.5em;
    margin: 0.1em auto 0.9em;
    border-radius: 50%;
    background: rgba(145, 71, 255, 0.14);
    color: rgb(92, 22, 197);
  }
  .modal-icon.dark {
    background: rgba(145, 71, 255, 0.22);
    color: rgb(191, 148, 255);
  }
  .modal-icon svg {
    width: 2.3em;
    height: 2.3em;
  }

  .confirm-text {
    margin: 0.25em 0 0.35em;
    text-align: center;
    line-height: 1.45;
    font-size: 1.02em;
  }
  .confirm-sub {
    margin: 0 0 1.2em;
    text-align: center;
    line-height: 1.4;
    font-size: 0.88em;
    color: rgb(83, 83, 95);
  }
  .confirm-sub.dark {
    color: rgb(173, 173, 184);
  }
  .confirm-text + .code-wrap {
    margin-top: 1.1em;
  }

  .code-wrap {
    position: relative;
    margin-bottom: 1.2em;
  }
  .code-wrap textarea {
    width: 100%;
    height: 8.5em;
    resize: vertical;
    /* right gutter for the overlaid copy button */
    padding: 0.7em 3.2em 0.7em 0.8em;
    border-radius: 0.5em;
    font-family: Consolas, "SF Mono", Menlo, monospace;
    font-size: 0.78em;
    line-height: 1.45;
    word-break: break-all;
    background: #f7f7f8;
    color: rgb(14, 14, 16);
    border: 1px solid #c8c8d0;
  }
  .code-wrap textarea.dark {
    background: #18181b;
    color: #dedee3;
    border: 1px solid #55555f;
  }
  .code-wrap textarea:focus {
    outline: 2px solid #a970ff;
    outline-offset: 1px;
  }

  .copy-btn {
    position: absolute;
    top: 0.45em;
    right: 0.5em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45em;
    border: none;
    border-radius: 0.45em;
    cursor: pointer;
    background: linear-gradient(135deg, #a970ff, #7a3dff);
    color: #fff;
    font-family: inherit;
    transition: transform 0.1s ease;
  }
  .copy-btn:active {
    transform: translateY(1px);
  }
  .copy-btn:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .copy-btn svg {
    width: 1.1em;
    height: 1.1em;
    display: block;
  }
  .copy-btn.done {
    background: linear-gradient(135deg, #1f9d55, #26a65b);
  }
  .copy-btn.failed {
    background: linear-gradient(135deg, #75282d, #ee4242);
  }

  .transfer-error {
    margin: -0.6em 0 1em;
    padding: 0.55em 0.8em;
    border-radius: 0.45em;
    background: rgba(238, 66, 66, 0.14);
    border-left: 3px solid #ee4242;
    color: #b02525;
    font-size: 0.85em;
    line-height: 1.35;
  }
  .transfer-error.dark {
    color: #ff8b8b;
  }
</style>
