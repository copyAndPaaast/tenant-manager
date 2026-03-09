import Component from '../js/Component.js';

export default class Admin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            categories: [],
            logoUrl: null,
            loading: true,
            saving: false,
            newCategoryName: ''
        };
    }

    async postRender() {
        if (this.state.loading) {
            try {
                const [catRes, logoRes] = await Promise.all([
                    fetch('/api/expense_categories'),
                    fetch('/api/settings/logo')
                ]);
                const categories = await catRes.json();
                const logoData = logoRes.ok ? await logoRes.json() : { value: null };
                this.setState({ categories, logoUrl: logoData.value, loading: false });
            } catch (err) {
                console.error(err);
                this.setState({ loading: false });
            }
            return;
        }

        const form = document.getElementById('categoryForm');
        if (form) form.addEventListener('submit', this.handleAddCategory.bind(this));

        document.querySelectorAll('.delete-category-btn').forEach(btn => {
            btn.addEventListener('click', this.handleDeleteCategory.bind(this));
        });

        const logoInput = document.getElementById('logoInput');
        if (logoInput) logoInput.addEventListener('change', this.handleLogoUpload.bind(this));

        const deleteLogoBtn = document.getElementById('deleteLogoBtn');
        if (deleteLogoBtn) deleteLogoBtn.addEventListener('click', this.handleDeleteLogo.bind(this));
    }

    async handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('logo', file);
        try {
            const res = await fetch('/api/settings/logo', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                // Add cache-buster so the browser reloads the image
                const logoUrl = data.value + '?t=' + Date.now();
                this.setState({ logoUrl });
                if (window._applyLogo) window._applyLogo(logoUrl);
            }
        } catch (err) {
            alert('Upload fehlgeschlagen.');
        }
    }

    async handleDeleteLogo() {
        if (!confirm('Logo entfernen?')) return;
        try {
            const res = await fetch('/api/settings/logo', { method: 'DELETE' });
            if (res.ok) {
                this.setState({ logoUrl: null });
                if (window._applyLogo) window._applyLogo(null);
            }
        } catch (err) {
            alert('Fehler beim Löschen.');
        }
    }

    async handleAddCategory(e) {
        e.preventDefault();
        const name = document.getElementById('newCategoryName').value;
        this.setState({ saving: true });

        try {
            const res = await fetch('/api/expense_categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                const newCat = await res.json();
                this.setState({
                    categories: [...this.state.categories, newCat],
                    saving: false,
                    newCategoryName: ''
                });
            }
        } catch (err) {
            alert(err.message);
            this.setState({ saving: false });
        }
    }

    async handleDeleteCategory(e) {
        if (!confirm(this.t('are_you_sure'))) return;
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`/api/expense_categories/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this.setState({ categories: this.state.categories.filter(c => c.id != id) });
            }
        } catch (err) {
            alert(err.message);
        }
    }

    render() {
        if (this.state.loading) return `<div>${this.t('loading')}</div>`;

        return `
            <div>
                <header style="margin-bottom: 32px;">
                    <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 4px;">${this.t('admin_panel')}</h1>
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('admin_subtitle')}</p>
                </header>

                <div class="card" style="max-width: 600px; margin-bottom: 24px;">
                    <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px;">App-Logo</h2>
                    <div style="display: flex; align-items: center; gap: 24px;">
                        <div style="width: 96px; height: 64px; border: 1px dashed var(--border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #1e293b; flex-shrink: 0; overflow: hidden;">
                            ${this.state.logoUrl
                                ? `<img src="${this.state.logoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`
                                : `<span style="font-size: 1.5rem;">🏠</span>`
                            }
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; color: var(--text-secondary);">
                                📎 Bild hochladen
                                <input type="file" id="logoInput" accept="image/*" style="display: none;">
                            </label>
                            ${this.state.logoUrl ? `
                                <button id="deleteLogoBtn" style="padding: 8px 16px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); background: none; cursor: pointer; font-size: 0.875rem; color: #ef4444; text-align: left;">Logo entfernen</button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="card" style="max-width: 600px;">
                    <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 24px;">${this.t('expense_categories_title')}</h2>
                    
                    <form id="categoryForm" style="display: flex; gap: 12px; margin-bottom: 24px;">
                        <input type="text" id="newCategoryName" placeholder="${this.t('new_category_placeholder')}" required style="flex: 1; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm);">
                        <button type="submit" class="btn btn-primary" ${this.state.saving ? 'disabled' : ''}>
                            ${this.state.saving ? this.t('adding') : this.t('add')}
                        </button>
                    </form>

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${this.state.categories.map(c => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--background-color); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                                <span style="font-weight: 500;">${c.name}</span>
                                <button class="delete-category-btn btn btn-danger" data-id="${c.id}" style="padding: 4px 8px; font-size: 0.75rem;">${this.t('delete')}</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}
