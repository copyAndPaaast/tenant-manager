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
        window._exportYear = this.exportYearToCSV.bind(this);

        const buildingSelect = document.getElementById('dashBuildingSelect');
        if (buildingSelect) {
            buildingSelect.addEventListener('change', (e) => {
                this.setState({ selectedBuildingId: e.target.value });
            });
        }

        if (!this.state.loading) {
            this.renderChart();
            return;
        }

        try {
            const [bRes, fRes, tRes, expRes, rentRes, leaseRes, expHistRes] = await Promise.all([
                fetch('/api/buildings').then(r => r.json()),
                fetch('/api/flats').then(r => r.json()),
                fetch('/api/tenants').then(r => r.json()),
                fetch('/api/expenses').then(r => r.json()),
                fetch('/api/rent_history').then(r => r.json()),
                fetch('/api/leases').then(r => r.json()),
                fetch('/api/expense_history').then(r => r.json())
            ]);

            this.rawDB = { bRes, fRes, tRes, expRes, rentRes, leaseRes, expHistRes };

            const selectedBuildingId = bRes.length === 1 ? String(bRes[0].id) : 'all';

            // Add a tiny artificial delay for consistency
            setTimeout(() => {
                this.setState({
                    loading: false,
                    buildings: bRes || [],
                    selectedBuildingId
                });
            }, 300);
        } catch (err) {
            console.error(err);
        }
    }

    calculateYearlyData(expenses, rentHistory, leases, expenseHistory) {
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
                profit: 0,
                expenseItems: [],
                rentItems: []
            });
        }

        const tenantRent = {};
        rentHistory.forEach(r => {
            if (!tenantRent[r.tenant_id]) tenantRent[r.tenant_id] = [];
            tenantRent[r.tenant_id].push(r);
        });
        Object.values(tenantRent).forEach(arr => arr.sort((a, b) => new Date(a.date_from) - new Date(b.date_from)));

        // Pre-process leases to cap older missing move_out dates with the start of the next contract
        const tenantLeases = {};
        (leases || []).forEach(l => {
            if (!tenantLeases[l.tenant_id]) tenantLeases[l.tenant_id] = [];
            tenantLeases[l.tenant_id].push(l);
        });
        Object.values(tenantLeases).forEach(arr => {
            arr.sort((a, b) => new Date(a.move_in_date) - new Date(b.move_in_date));
            arr.forEach((lease, i) => {
                if (!lease.move_out_date) {
                    if (i === arr.length - 1) {
                        lease._effective_move_out = new Date(8640000000000000);
                    } else {
                        lease._effective_move_out = new Date(arr[i + 1].move_in_date);
                    }
                } else {
                    lease._effective_move_out = new Date(lease.move_out_date);
                }
            });
        });

        const expHistMap = {};
        (expenseHistory || []).forEach(eh => {
            if (!expHistMap[eh.expense_id]) expHistMap[eh.expense_id] = [];
            expHistMap[eh.expense_id].push(eh);
        });
        Object.values(expHistMap).forEach(arr => arr.sort((a, b) => new Date(a.date_from) - new Date(b.date_from)));

        // 2. Iterate month-by-month through each year to project full 12 months
        years.forEach((yearObj) => {
            const year = parseInt(yearObj.name);
            const limit = false; // Never limit, always project the full 12 months

            expenses.forEach(exp => {
                const res = this.calculateAnnualExpense(exp, year, expHistMap, limit);
                if (res.total > 0) {
                    yearObj.expenseItems.push({ 
                        date: exp.date, 
                        title: exp.title, 
                        total: res.total, 
                        billable: res.billable, 
                        unbillable: res.unbillable 
                    });
                }
                yearObj.billable += res.billable;
                yearObj.unbillable += res.unbillable;
                yearObj.totalExpenses += res.total;
            });

            const monthsInThisYear = 12; // Always project the entire year

            for (let m = 0; m < monthsInThisYear; m++) {
                const firstOfMonth = new Date(year, m, 1);

                // Process Rent for this Month
                const activeTenantsForMonth = new Set();
                leases.forEach(lease => {
                    const moveIn = new Date(lease.move_in_date);
                    const moveOut = lease._effective_move_out || new Date(8640000000000000);

                    const moveInMonth = new Date(moveIn.getFullYear(), moveIn.getMonth(), 1);
                    const moveOutMonth = new Date(moveOut.getFullYear(), moveOut.getMonth(), 1);

                    if (firstOfMonth >= moveInMonth && firstOfMonth <= moveOutMonth) {
                        activeTenantsForMonth.add(lease.tenant_id);
                    }
                });

                activeTenantsForMonth.forEach(tenantId => {
                    const history = tenantRent[tenantId] || [];
                    const activeRent = history.filter(r => new Date(r.date_from) <= firstOfMonth && (!r.date_to || new Date(r.date_to) >= firstOfMonth)).pop();

                    if (activeRent) {
                        const rentTotal = Number(activeRent.base_rent || 0) + Number(activeRent.heating || 0) + Number(activeRent.maintenance || 0);
                        if (rentTotal > 0) {
                            yearObj.rentItems.push({
                                month: m + 1,
                                tenant_id: tenantId,
                                amount: rentTotal,
                                base_rent: Number(activeRent.base_rent || 0),
                                heating: Number(activeRent.heating || 0),
                                maintenance: Number(activeRent.maintenance || 0)
                            });
                        }
                        yearObj.totalRent += rentTotal;
                    }
                });
            }
            yearObj.profit = yearObj.totalRent - yearObj.totalExpenses;
        });

        return years;
    }

    exportYearToCSV(yearName) {
        const yearObj = this.state.yearlyData.find(y => y.name === String(yearName));
        if (!yearObj) return;

        let csv = '\uFEFF'; // BOM for Excel formatting
        csv += `Report for Year: ${yearName}\n\n`;
        
        csv += `--- INCOMES (RENT) ---\n`;
        csv += `Month;Tenant ID;Base Rent;Heating;Maintenance;Total\n`;
        let sumRent = 0;
        yearObj.rentItems.forEach(r => {
            sumRent += r.amount;
            csv += `${r.month};${r.tenant_id};${r.base_rent.toFixed(2)};${r.heating.toFixed(2)};${r.maintenance.toFixed(2)};${r.amount.toFixed(2)}\n`;
        });
        csv += `;;;;TOTAL RENT IN ${yearName};${sumRent.toFixed(2)}\n\n\n`;

        csv += `--- EXPENSES ---\n`;
        csv += `Original Date;Title;Billable;Unbillable;Total Apportioned to ${yearName}\n`;
        let sumExp = 0;
        yearObj.expenseItems.forEach(e => {
            sumExp += e.total;
            csv += `${e.date};"${e.title.replace(/"/g, '""')}";${e.billable.toFixed(2)};${e.unbillable.toFixed(2)};${e.total.toFixed(2)}\n`;
        });
        csv += `;;;;TOTAL EXPENSES IN ${yearName};${sumExp.toFixed(2)}\n\n`;
        
        csv += `-------------------\n`;
        csv += `PROFIT FOR ${yearName};;;;${(sumRent - sumExp).toFixed(2)}\n`;

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `financial_report_${yearName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    renderChart() {
        const ctx = document.getElementById('analyticsChart');
        if (!ctx) return;

        if (this.chart) {
            this.chart.destroy();
        }

        let data = this.state.yearlyData || [];
        if (data.length === 0) return;
        
        // Sync chart visible years with the table's visible years
        data = [...data].reverse().slice(0, this.state.visibleYears).reverse();
        
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

        let currentYearlyData = [];
        if (this.rawDB) {
            const { bRes, fRes, tRes, expRes, rentRes, leaseRes, expHistRes } = this.rawDB;
            let filteredLeases = leaseRes.filter(l => !tRes.find(t => t.id === l.tenant_id && t.is_archived === 1));
            let filteredRent = rentRes.filter(r => !tRes.find(t => t.id === r.tenant_id && t.is_archived === 1));
            let filteredExp = expRes;

            if (this.state.selectedBuildingId && this.state.selectedBuildingId !== 'all') {
                const bIdStr = String(this.state.selectedBuildingId);
                const buildingFlats = fRes.filter(f => String(f.building_id) === bIdStr);
                const flatIds = new Set(buildingFlats.map(f => String(f.id)));
                
                filteredLeases = filteredLeases.filter(l => flatIds.has(String(l.flat_id)));
                const activeTenantIds = new Set(filteredLeases.map(l => String(l.tenant_id)));
                filteredRent = filteredRent.filter(r => activeTenantIds.has(String(r.tenant_id)));
                
                filteredExp = filteredExp.filter(e => {
                    const eBId = e.building_id ? String(e.building_id) : null;
                    const eFId = e.flat_id ? String(e.flat_id) : null;
                    
                    // Match direct building, or flat, or global (if no building/flat specified at all)
                    if (eBId === bIdStr) return true;
                    if (eFId && flatIds.has(eFId)) return true;
                    if (!eBId && !eFId) return true; // Include generic system-wide expenses
                    return false;
                });
            }
            
            currentYearlyData = this.calculateYearlyData(filteredExp, filteredRent, filteredLeases, expHistRes);
            this.state.yearlyData = currentYearlyData; 
        }

        return `
            <div>
                <header style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                    <div>
                        <h1 style="font-size: 2.25rem; font-weight: 700; letter-spacing: -1px; color: var(--text-primary); margin-bottom: 8px;">${this.t('welcome_back')}</h1>
                        <p style="color: var(--text-secondary); font-size: 1.1rem;">${this.t('dashboard_subtitle')}</p>
                    </div>
                    <div>
                        <select id="dashBuildingSelect" class="input-medium" style="min-width: 250px; font-weight: 600; padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--primary-color); background: rgba(99, 102, 241, 0.05); color: var(--primary-color);">
                            <option value="all" ${this.state.selectedBuildingId === 'all' ? 'selected' : ''}>🌍 Alle Gebäude (Gesamtübersicht)</option>
                            ${this.state.buildings.map(b => `<option value="${b.id}" ${String(this.state.selectedBuildingId) === String(b.id) ? 'selected' : ''}>🏢 ${b.address || 'Unbekannt'}</option>`).join('')}
                        </select>
                    </div>
                </header>

                <div class="card" style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-size: 1.25rem; font-weight: 600;">${this.t('financial_performance')}</h2>
                            <p style="color: var(--text-secondary);">${this.t('income_expenses_desc')}</p>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${this.t('overall_rent')} (${new Date().getFullYear()})</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${this.fCurrency(this.state.yearlyData.length ? this.state.yearlyData[this.state.yearlyData.length - 1].totalRent : 0)}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 600;">${this.t('total_net_profit')} (${new Date().getFullYear()})</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: #6366f1;">${this.fCurrency(this.state.yearlyData.length ? this.state.yearlyData[this.state.yearlyData.length - 1].profit : 0)}</div>
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
                                                <td style="padding: 12px 4px; text-align: right;">
                                                    <button onclick="window._exportYear('${year.name}')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">⏬ CSV Export</button>
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
