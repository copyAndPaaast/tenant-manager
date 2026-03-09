import Component from '../js/Component.js';

export default class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stats: {
                buildings: 0,
                flats: 0,
                tenants: 0
            },
            yearlyData: [],
            visibleYears: 4,
            buildings: [],
            loading: true
        };
    }

    async postRender() {
        window._dashLoadMore = () => this.setState({ visibleYears: this.state.visibleYears + 4 });
        if (!this.state.loading && this.chart) return;

        try {
            const [bRes, fRes, tRes, expRes, rentRes, leaseRes] = await Promise.all([
                fetch('/api/buildings').then(r => r.json()),
                fetch('/api/flats').then(r => r.json()),
                fetch('/api/tenants').then(r => r.json()),
                fetch('/api/expenses').then(r => r.json()),
                fetch('/api/rent_history').then(r => r.json()),
                fetch('/api/leases').then(r => r.json())
            ]);

            const yearlyData = this.calculateYearlyData(expRes, rentRes, leaseRes);

            // Add a tiny artificial delay for consistency
            setTimeout(() => {
                this.setState({
                    loading: false,
                    stats: {
                        buildings: bRes.length || 0,
                        flats: fRes.length || 0,
                        tenants: tRes.length || 0
                    },
                    buildings: bRes || [],
                    yearlyData
                });
                this.renderChart();
            }, 300);
        } catch (err) {
            console.error(err);
        }
    }

    calculateYearlyData(expenses, rentHistory, leases) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 1. Determine Start Year from Leases (Actual flow of money)
        let startYear = currentYear;
        if (leases && leases.length > 0) {
            const leaseYears = leases.map(l => new Date(l.move_in_date).getFullYear());
            startYear = Math.min(...leaseYears);
        }

        const years = [];
        for (let y = startYear; y <= currentYear; y++) {
            years.push({
                name: y.toString(),
                billable: 0,
                unbillable: 0,
                totalExpenses: 0,
                totalRent: 0,
                profit: 0
            });
        }

        const tenantRent = {};
        rentHistory.forEach(r => {
            if (!tenantRent[r.tenant_id]) tenantRent[r.tenant_id] = [];
            tenantRent[r.tenant_id].push(r);
        });
        Object.values(tenantRent).forEach(arr => arr.sort((a, b) => new Date(a.date_from) - new Date(b.date_from)));

        // 2. Iterate month-by-month through each year up to CURRENT DATE
        years.forEach((yearObj) => {
            const year = parseInt(yearObj.name);
            const monthsInThisYear = (year === currentYear) ? currentMonth + 1 : 12;

            for (let m = 0; m < monthsInThisYear; m++) {
                const firstOfMonth = new Date(year, m, 1);

                // Process Expenses for this Month
                expenses.forEach(exp => {
                    const amount = Number(exp.amount || 0);
                    const isBillable = exp.billable === 1 || exp.billable === true;

                    if (!exp.frequency || exp.frequency === 'One-time') {
                        const d = new Date(exp.date);
                        if (d.getFullYear() === year && d.getMonth() === m) {
                            if (isBillable) yearObj.billable += amount;
                            else yearObj.unbillable += amount;
                            yearObj.totalExpenses += amount;
                        }
                    } else {
                        // Recurring logic: only counted for passed/current months
                        const startDate = new Date(exp.date);
                        const firstOfStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

                        if (firstOfMonth >= firstOfStart) {
                            if (exp.frequency === 'Monthly') {
                                if (isBillable) yearObj.billable += amount;
                                else yearObj.unbillable += amount;
                                yearObj.totalExpenses += amount;
                            } else if (exp.frequency === 'Quarterly') {
                                let config = {};
                                try { config = JSON.parse(exp.recurring_config || '{}'); } catch (e) { }
                                const dates = config.dates || [];
                                if (dates.some(d => parseInt(d.month) - 1 === m)) {
                                    if (isBillable) yearObj.billable += amount;
                                    else yearObj.unbillable += amount;
                                    yearObj.totalExpenses += amount;
                                }
                            } else if (exp.frequency === 'Yearly') {
                                let config = {};
                                try { config = JSON.parse(exp.recurring_config || '{}'); } catch (e) { }
                                const yearlyMonth = parseInt(config.month || (new Date(exp.date)).getMonth() + 1) - 1;
                                if (m === yearlyMonth) {
                                    if (isBillable) yearObj.billable += amount;
                                    else yearObj.unbillable += amount;
                                    yearObj.totalExpenses += amount;
                                }
                            }
                        }
                    }
                });

                // Process Rent for this Month
                leases.forEach(lease => {
                    const moveIn = new Date(lease.move_in_date);
                    const moveOut = lease.move_out_date ? new Date(lease.move_out_date) : new Date(8640000000000000);

                    const moveInMonth = new Date(moveIn.getFullYear(), moveIn.getMonth(), 1);
                    const moveOutMonth = new Date(moveOut.getFullYear(), moveOut.getMonth(), 1);

                    if (firstOfMonth >= moveInMonth && firstOfMonth <= moveOutMonth) {
                        const history = tenantRent[lease.tenant_id] || [];
                        const activeRent = history.filter(r => new Date(r.date_from) <= firstOfMonth).pop();

                        if (activeRent) {
                            const rentTotal = Number(activeRent.base_rent || 0) + Number(activeRent.heating || 0) + Number(activeRent.maintenance || 0);
                            yearObj.totalRent += rentTotal;
                        }
                    }
                });
            }
            yearObj.profit = yearObj.totalRent - yearObj.totalExpenses;
        });

        return years;
    }

    renderChart() {
        const ctx = document.getElementById('analyticsChart');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        const data = this.state.yearlyData || [];
        if (data.length === 0) return;
        const labels = data.map(d => d.name);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: this.t('rent'),
                        data: data.map(d => d.totalRent),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 1
                    },
                    {
                        label: this.t('billable_expenses'),
                        data: data.map(d => d.billable),
                        backgroundColor: 'rgba(244, 63, 94, 0.8)',
                        borderColor: '#f43f5e',
                        borderWidth: 1
                    },
                    {
                        label: this.t('non_billable_expenses'),
                        data: data.map(d => d.unbillable),
                        backgroundColor: 'rgba(159, 18, 57, 0.8)',
                        borderColor: '#9f1239',
                        borderWidth: 1
                    },
                    {
                        label: this.t('expenses'),
                        data: data.map(d => d.totalExpenses),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 1
                    },
                    {
                        label: this.t('net_balance'),
                        data: data.map(d => d.profit),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: '#6366f1',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: (value) => '€' + value
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                family: "'Inter', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        padding: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#1e293b',
                        bodyColor: '#475569',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        boxPadding: 6,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += i18n.formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    render() {
        if (this.state.loading) {
            return `
                <div class="card" style="display: flex; align-items: center; justify-content: center; min-height: 400px;">
                    <div style="text-align: center;">
                        <svg width="40" height="40" viewBox="0 0 24 24" style="animation: spin 1s linear infinite; fill: var(--primary-color); margin-bottom: 16px;">
                            <path d="M12 2v4a6 6 0 0 1 6 6h4a10 10 0 0 0-10-10zm0 20v-4a6 6 0 0 1-6-6H2a10 10 0 0 0 10 10z"/>
                            <style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>
                        </svg>
                        <h2 style="color: var(--text-secondary); font-weight: 500;">${this.t('loading_metrics')}</h2>
                    </div>
                </div>
            `;
        }

        return `
            <div>
                <header style="margin-bottom: 32px;">
                    <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('welcome_back')}</h1>
                    <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('dashboard_subtitle')}</p>
                </header>

                <div class="card" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('financial_performance')}</h2>
                            <p style="color: var(--text-secondary);">${this.t('income_expenses_desc')}</p>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${this.t('overall_rent')}</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${this.fCurrency(this.state.yearlyData.reduce((acc, curr) => acc + curr.totalRent, 0))}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${this.t('total_net_profit')}</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #6366f1;">${this.fCurrency(this.state.yearlyData.reduce((acc, curr) => acc + curr.profit, 0))}</div>
                            </div>
                        </div>
                    </div>
                    <div style="height: 400px; position: relative; margin-bottom: 32px;">
                        <canvas id="analyticsChart"></canvas>
                    </div>

                    <div style="margin-top: 32px; border-top: 1px solid var(--border-color); padding-top: 24px;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px;">${this.t('yearly_breakdown')}</h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                                <thead>
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <th style="padding: 12px 16px; color: var(--text-secondary); font-weight: 600;">${this.t('year')}</th>
                                        <th style="padding: 12px 16px; color: var(--text-secondary); font-weight: 600; text-align: right;">${this.t('rent')}</th>
                                        <th style="padding: 12px 16px; color: var(--text-secondary); font-weight: 600; text-align: right;">${this.t('expenses')}</th>
                                        <th style="padding: 12px 16px; color: var(--text-secondary); font-weight: 600; text-align: right;">${this.t('profit')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(() => {
                                        const reversed = [...this.state.yearlyData].reverse();
                                        return reversed.slice(0, this.state.visibleYears).map(year => `
                                            <tr style="border-bottom: 1px solid rgba(0,0,0,0.03);">
                                                <td style="padding: 12px 16px; font-weight: 600;">${year.name}</td>
                                                <td style="padding: 12px 16px; text-align: right; color: #10b981;">${this.fCurrency(year.totalRent)}</td>
                                                <td style="padding: 12px 16px; text-align: right; color: #ef4444;">${this.fCurrency(year.totalExpenses)}</td>
                                                <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: ${year.profit >= 0 ? '#6366f1' : '#f43f5e'};">
                                                    ${this.fCurrency(year.profit)}
                                                </td>
                                            </tr>
                                        `).join('');
                                    })()}
                                </tbody>
                            </table>
                        </div>
                        ${(() => {
                            const total = this.state.yearlyData.length;
                            const visible = this.state.visibleYears;
                            if (total <= visible) return '';
                            return `<div style="margin-top: 12px; text-align: center;">
                                <button onclick="window._dashLoadMore()" style="padding: 8px 20px; background: none; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); cursor: pointer; font-size: 0.875rem; color: var(--text-secondary);">
                                    ${Math.min(visible + 4, total) - visible} weitere Jahre laden
                                </button>
                            </div>`;
                        })()}
                    </div>
                </div>

                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h2 style="font-size: 1.25rem; font-weight: 600;">Gebäude</h2>
                        <button class="btn btn-primary" onclick="window.location.href='/buildings/new';" style="cursor: pointer;">+ Gebäude</button>
                    </div>
                    ${this.state.buildings.length === 0 ? `
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Noch keine Gebäude angelegt.</p>
                    ` : `
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: var(--text-secondary);">Adresse</th>
                                    <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: var(--text-secondary);"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.state.buildings.map(b => `
                                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.03);">
                                        <td style="padding: 12px 12px; font-weight: 500;">${b.address || '—'}</td>
                                        <td style="padding: 12px 12px; text-align: right; white-space: nowrap;">
                                            <a href="/buildings/${b.id}/edit" data-link style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); color: var(--text-secondary); text-decoration: none; margin-right: 6px;">Gebäude</a>
                                            <a href="/buildings/${b.id}/settlements/new" data-link style="font-size: 0.8rem; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); color: var(--text-secondary); text-decoration: none;">Nebenkostenabrechnung</a>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }
}
