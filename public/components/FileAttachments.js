export default class FileAttachments {
    constructor(entityType, entityId) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.container = null;
        this.files = [];
        this.uploading = false;
    }

    mount(container) {
        this.container = container;
        this.fetchAndRender();
    }

    async fetchAndRender() {
        try {
            const res = await fetch(`/api/files?entity_type=${this.entityType}&entity_id=${this.entityId}`);
            if (res.ok) this.files = await res.json();
        } catch (e) {
            this.files = [];
        }
        this.render();
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = this.buildHtml();
        this.attachListeners();
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    buildHtml() {
        const fileRows = this.files.map(f => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.04);">
                <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                    <span style="font-size: 1.1rem;">${this.fileIcon(f.mimetype)}</span>
                    <div style="min-width: 0;">
                        <div style="font-size: 0.875rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.original_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${this.formatSize(f.size)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 12px;">
                    <a href="/api/files/${f.id}/download" target="_blank" style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); color: var(--text-secondary); text-decoration: none; background: var(--surface-color);">Download</a>
                    <button data-delete-id="${f.id}" style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); color: #ef4444; background: none; cursor: pointer;">Löschen</button>
                </div>
            </div>
        `).join('');

        return `
            <div style="margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 24px;">
                <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Anhänge</h3>

                ${this.files.length > 0 ? `
                    <div style="margin-bottom: 16px;">${fileRows}</div>
                ` : `
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 16px;">Noch keine Anhänge.</p>
                `}

                <label style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px dashed var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; color: var(--text-secondary); transition: border-color 0.2s;">
                    ${this.uploading
                        ? `<span>Wird hochgeladen…</span>`
                        : `<span style="font-size: 1rem;">📎</span> Datei anhängen`
                    }
                    <input type="file" id="file-upload-input" style="display: none;" ${this.uploading ? 'disabled' : ''}>
                </label>
            </div>
        `;
    }

    fileIcon(mimetype) {
        if (!mimetype) return '📄';
        if (mimetype.startsWith('image/')) return '🖼️';
        if (mimetype === 'application/pdf') return '📕';
        if (mimetype.includes('word')) return '📝';
        if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
        return '📄';
    }

    attachListeners() {
        const input = this.container.querySelector('#file-upload-input');
        if (input) {
            input.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                await this.upload(file);
            });
        }

        this.container.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.deleteId;
                if (!confirm('Anhang löschen?')) return;
                await this.deleteFile(id);
            });
        });
    }

    async upload(file) {
        this.uploading = true;
        this.render();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity_type', this.entityType);
        formData.append('entity_id', this.entityId);

        try {
            const res = await fetch('/api/files', { method: 'POST', body: formData });
            if (res.ok) {
                const newFile = await res.json();
                this.files.unshift(newFile);
            }
        } catch (e) {
            console.error('Upload failed', e);
        }

        this.uploading = false;
        this.render();
    }

    async deleteFile(id) {
        try {
            const res = await fetch(`/api/files/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.files = this.files.filter(f => f.id != id);
                this.render();
            }
        } catch (e) {
            console.error('Delete failed', e);
        }
    }
}
