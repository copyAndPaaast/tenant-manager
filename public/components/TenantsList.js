import Component from '../js/Component.js';

export default class TenantsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tenants: [],
            buildings: [],
            leases: [],
            flatsMap: {},
            currentFlatByTenant: {},
            selectedBuildingId: 'all',
            loading: true,
            error: null,
            activeTab: 'active'
        };
    }

    async postRender() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setState({ activeTab: e.target.dataset.tab });
            });
        });

        const buildingSelect = document.getElementById('tenantsBuildingSelect');
        if (buildingSelect) {
            buildingSelect.addEventListener('change', (e) => {
                this.setState({ selectedBuildingId: e.target.value });
            });
        }

        if (!this.state.loading) return;

        try {
            const [tenantsRes, leasesRes, flatsRes, buildingsRes] = await Promise.all([
                fetch('/api/tenants'),
                fetch('/api/leases'),
                fetch('/api/flats'),
                fetch('/api/buildings')
            ]);

            if (!tenantsRes.ok) throw new Error(this.t('error_fetch_tenants'));
            const data = await tenantsRes.json();
            const leases = leasesRes.ok ? await leasesRes.json() : [];
            const flats = flatsRes.ok ? await flatsRes.json() : [];
            const buildings = buildingsRes.ok ? await buildingsRes.json() : [];

            const flatsMap = {};
            flats.forEach(f => flatsMap[f.id] = f);

            const currentFlatByTenant = {};
            leases.forEach(l => {
                if (!l.move_out_date && l.flat_id && l.tenant_id) {
                    currentFlatByTenant[l.tenant_id] = flatsMap[l.flat_id];
                }
            });

            const selectedBuildingId = buildings.length === 1 ? String(buildings[0].id) : 'all';

            this.setState({
                tenants: data,
                buildings,
                leases,
                flatsMap,
                currentFlatByTenant,
                selectedBuildingId,
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

        // Build set of tenant IDs that have any lease in the selected building
        let tenantIdsInBuilding = null;
        if (this.state.selectedBuildingId !== 'all') {
            const bIdStr = this.state.selectedBuildingId;
            const flatIdsInBuilding = new Set(
                Object.values(this.state.flatsMap)
                    .filter(f => String(f.building_id) === bIdStr)
                    .map(f => String(f.id))
            );
            tenantIdsInBuilding = new Set(
                this.state.leases
                    .filter(l => l.flat_id && flatIdsInBuilding.has(String(l.flat_id)))
                    .map(l => String(l.tenant_id))
            );
        }

        const filterByBuilding = (list) => tenantIdsInBuilding
            ? list.filter(t => tenantIdsInBuilding.has(String(t.id)))
            : list;

        const activeTenants = filterByBuilding(this.state.tenants.filter(t => !t.is_archived));
        const archivedTenants = filterByBuilding(this.state.tenants.filter(t => t.is_archived));
        const displayTenants = this.state.activeTab === 'archived' ? archivedTenants : activeTenants;

        const tableRows = displayTenants.map(t => {
            const flat = this.state.currentFlatByTenant[t.id];
            return `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.03);">
                <td style="padding: 12px; font-weight: 500;">
                    <strong>${t.first_name} ${t.last_name}</strong>
                </td>
                <td style="padding: 12px; color: var(--text-secondary);">${t.email || '-'}</td>
                <td style="padding: 12px; color: var(--text-secondary);">${t.phone || '-'}</td>
                <td style="padding: 12px;">${flat ? `<a href="/flats/${flat.id}/edit" data-link style="color: var(--primary-color); text-decoration: none; font-weight: 500;">${flat.name_number}</a>` : '<span style="color: var(--text-secondary);">-</span>'}</td>
                <td style="padding: 12px; text-align: right; white-space: nowrap;">
                    <a href="/tenants/${t.id}/edit" data-link class="btn btn-action" style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); color: var(--text-secondary); text-decoration: none;">Öffnen</a>
                </td>
            </tr>
        `;
        }).join('');

        const emptyState = `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${this.state.activeTab === 'archived' ? 'Keine archivierten Mieter vorhanden.' : this.t('no_tenants')}</p>
                ${this.state.activeTab !== 'archived' ? `<a href="/tenants/new" data-link class="btn btn-primary">${this.t('add_first_tenant')}</a>` : ''}
            </div>
        `;

        const tabs = `
            <div style="display: flex; gap: 24px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 0px;">
                <button class="tab-btn" data-tab="active" style="background: none; border: none; border-bottom: 2px solid ${this.state.activeTab !== 'archived' ? 'var(--primary-color)' : 'transparent'}; padding-bottom: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; color: ${this.state.activeTab !== 'archived' ? 'var(--primary-color)' : 'var(--text-secondary)'};">Aktive Mieter</button>
                <button class="tab-btn" data-tab="archived" style="background: none; border: none; border-bottom: 2px solid ${this.state.activeTab === 'archived' ? 'var(--primary-color)' : 'transparent'}; padding-bottom: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; color: ${this.state.activeTab === 'archived' ? 'var(--primary-color)' : 'var(--text-secondary)'};">Archiv</button>
            </div>
        `;

        const buildingSelect = `
            <select id="tenantsBuildingSelect" class="input-medium" style="min-width: 220px; font-weight: 600; padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--primary-color); background: rgba(99, 102, 241, 0.05); color: var(--primary-color);">
                <option value="all" ${this.state.selectedBuildingId === 'all' ? 'selected' : ''}>🌍 Alle Gebäude</option>
                ${this.state.buildings.map(b => `<option value="${b.id}" ${String(this.state.selectedBuildingId) === String(b.id) ? 'selected' : ''}>🏢 ${b.address || 'Unbekannt'}</option>`).join('')}
            </select>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('tenants_title')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('manage_tenants_subtitle')}</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${this.state.buildings.length > 1 ? buildingSelect : ''}
                        ${this.state.tenants.length > 0 ? `<a href="/tenants/new" data-link class="btn btn-primary">${this.t('add_tenant_btn')}</a>` : ''}
                    </div>
                </header>

                <div class="card" style="padding: 24px;">
                    ${tabs}
                    ${displayTenants.length === 0 ? emptyState : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; text-align: left;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 12px; color: var(--text-secondary); font-weight: 600;">${this.t('name')}</th>
                                    <th style="padding: 12px; color: var(--text-secondary); font-weight: 600;">${this.t('email')}</th>
                                    <th style="padding: 12px; color: var(--text-secondary); font-weight: 600;">${this.t('phone')}</th>
                                    <th style="padding: 12px; color: var(--text-secondary); font-weight: 600;">Wohnung</th>
                                    <th style="padding: 12px; color: var(--text-secondary); font-weight: 600; text-align: right;">${this.t('actions')}</th>
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
