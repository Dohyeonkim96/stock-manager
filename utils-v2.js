function loadSidebar(activePage) {
    const sidebarNav = `
        <div class="sidebar-header">
            <h2>재고 관리 시스템</h2>
        </div>
        <nav class="sidebar-nav">
            <ul>
                <li class="${activePage === 'main.html' ? 'active' : ''}"><a href="main.html"><i class="fas fa-home"></i> 홈</a></li>
                <li class="${activePage === 'stockReceiving.html' ? 'active' : ''}"><a href="stockReceiving.html"><i class="fas fa-box-open"></i> 입고 관리</a></li>
                <li class="${activePage === 'shippingRequest.html' ? 'active' : ''}"><a href="shippingRequest.html"><i class="fas fa-truck-loading"></i> 출고 요청</a></li>
                <li class="${activePage === 'shippingConfirmation.html' ? 'active' : ''}"><a href="shippingConfirmation.html"><i class="fas fa-check-circle"></i> 출고 승인</a></li>
                <li class="${activePage === 'inventoryLookup.html' ? 'active' : ''}"><a href="inventoryLookup.html"><i class="fas fa-search"></i> 재고 조회</a></li>
                <li class="${activePage === 'poStatus.html' ? 'active' : ''}"><a href="poStatus.html"><i class="fas fa-file-invoice"></i> 발주 현황</a></li>
                <li class="${activePage === 'productionPlan.html' ? 'active' : ''}"><a href="productionPlan.html"><i class="fas fa-cogs"></i> 생산 계획</a></li>
                <li class="${activePage === 'deliveryHistory.html' ? 'active' : ''}"><a href="deliveryHistory.html"><i class="fas fa-history"></i> 납품 이력</a></li>
            </ul>
        </nav>
    `;
    const sidebarContainer = document.querySelector('.sidebar');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = sidebarNav;
    }
}
