import Component from '../js/Component.js';

export default class TenantsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tenants: [],
            loading: true,
            error: null
        };
    }

    async postRender() {
        if (!this.state.loading) return;

        try {
            const response = await fetch('/api/tenants');
            if (!response.ok) throw new Error(this.t('error_fetch_tenants'));
            const data = await response.json();

            this.setState({
                tenants: data,
                loading: false
            });
        } catch (err) {
            this.setState({
                error: err.message,
                loading: false
            });
        }
    }

    render() {
        if (this.state.loading) {
            return `<div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading_tenants')}</h2>
                    </div>`;
        }

        if (this.state.error) {
            return `<div class="card"><h2 style="color: var(--error-color);">${this.t('error')}</h2><p>${this.state.error}</p></div>`;
        }

        const tableRows = this.state.tenants.map(t => `
            <tr>
                <td><strong>${t.first_name} ${t.last_name}</strong></td>
                <td>${t.email || '-'}</td>
                <td>${t.phone || '-'}</td>
                <td style="text-align: right;">
                    <a href="/tenants/${t.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                </td>
            </tr>
        `).join('');

        const emptyState = `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${this.t('no_tenants')}</p>
                <a href="/tenants/new" data-link class="btn btn-primary">${this.t('add_first_tenant')}</a>
            </div>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('tenants_title')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('manage_tenants_subtitle')}</p>
                    </div>
                    ${this.state.tenants.length > 0 ? `<a href="/tenants/new" data-link class="btn btn-primary">${this.t('add_tenant_btn')}</a>` : ''}
                </header>

                <div class="card" style="padding: 0; overflow: hidden;">
                    ${this.state.tenants.length === 0 ? emptyState : `
                        <table>
                            <thead>
                                <tr>
                                    <th>${this.t('name')}</th>
                                    <th>${this.t('email')}</th>
                                    <th>${this.t('phone')}</th>
                                    <th style="text-align: right;">${this.t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }
}
