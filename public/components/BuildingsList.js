import Component from '../js/Component.js';

export default class BuildingsList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            buildings: [],
            loading: true,
            error: null
        };
    }

    async postRender() {
        if (!this.state.loading) return;

        try {
            const response = await fetch('/api/buildings');
            if (!response.ok) throw new Error(this.t('error_fetch_buildings'));
            const data = await response.json();

            this.setState({
                buildings: data,
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
            return `
                <div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                    <div style="text-align: center;">
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading_buildings')}</h2>
                    </div>
                </div>
            `;
        }

        if (this.state.error) {
            return `<div class="card"><h2 style="color: var(--error-color);">${this.t('error')}</h2><p>${this.state.error}</p></div>`;
        }

        const tableRows = this.state.buildings.map(b => `
            <tr>
                <td><strong>${b.address}</strong></td>
                <td>${b.flats_sqm_sum ? Number(b.flats_sqm_sum).toFixed(2) + ' ' + this.t('sqm') : '0.00 ' + this.t('sqm')}</td>
                <td>${b.total_square_meters ? Number(b.total_square_meters).toFixed(2) + ' ' + this.t('sqm') : '-'}</td>
                <td>${b.description || '-'}</td>
                <td style="text-align: right;">
                    <a href="/buildings/${b.id}/edit" data-link class="btn btn-action">${this.t('edit')}</a>
                </td>
            </tr>
        `).join('');

        const emptyState = `
            <div style="text-align: center; padding: 40px 0;">
                <p style="color: var(--text-secondary); margin-bottom: 20px;">${this.t('no_buildings')}</p>
                <a href="/buildings/new" data-link class="btn btn-primary">${this.t('add_first_building')}</a>
            </div>
        `;

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('buildings_title')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('manage_properties')}</p>
                    </div>
                    ${this.state.buildings.length > 0 ? `<a href="/buildings/new" data-link class="btn btn-primary">${this.t('add_building_btn')}</a>` : ''}
                </header>

                <div class="card" style="padding: 0; overflow: hidden;">
                    ${this.state.buildings.length === 0 ? emptyState : `
                        <table>
                            <thead>
                                <tr>
                                    <th>${this.t('address')}</th>
                                    <th>${this.t('sum_flats')}</th>
                                    <th>${this.t('total_size')}</th>
                                    <th>${this.t('description')}</th>
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
