function loadNavigation(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const menuItems = [
        { id: 'poStatus', href: 'poStatus.html', icon: 'fa-file-invoice', text: '발주 현황' },
        { id: 'productionPlan', href: 'productionPlan.html', icon: 'fa-industry', text: '생산 계획' },
        { id: 'stockReceiving', href: 'stockReceiving.html', icon: 'fa-dolly', text: '입고 처리' },
        { id: 'inventoryLookup', href: 'inventoryLookup.html', icon: 'fa-search', text: '재고 조회' },
        { id: 'shippingRequest', href: 'shippingRequest.html', icon: 'fa-truck-loading', text: '출고 요청' },
        { id: 'deliveryHistory', href: 'deliveryHistory.html', icon: 'fa-history', text: '납품이력' }
    ];

    const menuHTML = menuItems.map(item => `
        <li>
            <a href="/${item.href}" class="${item.id === activePage ? 'active' : ''}">
                <i class="fa-solid ${item.icon}"></i>
                ${item.text}
            </a>
        </li>
    `).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h1><a href="/main.html">통합재고관리</a></h1>
        </div>
        <ul class="sidebar-menu">
            ${menuHTML}
        </ul>
    `;
}

function showLoading(tableId) {
    const table = document.getElementById(tableId);
    if (table) {
        const tbody = table.querySelector('tbody');
        if(tbody) {
            tbody.innerHTML = `<tr><td colspan="${table.querySelector('thead tr').children.length}" id="loading">로딩 중...</td></tr>`;
        }
    }
}

function showMessage(tableId, message) {
    const table = document.getElementById(tableId);
    if (table) {
        const tbody = table.querySelector('tbody');
        if(tbody) {
            tbody.innerHTML = `<tr><td colspan="${table.querySelector('thead tr').children.length}" id="message">${message}</td></tr>`;
        }
    }
}
