// --- Helper: Netlify 서버 함수 호출 ---
async function fetchFromServer(endpoint, options = {}) {
    try {
        const response = await fetch(`/.netlify/functions/${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '서버 통신에 실패했습니다.');
        }
        // 내용이 없는 성공 응답(204 No Content)을 처리
        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from /${endpoint}:`, error);
        alert(error.message);
        return null; // 실패 시 null 반환
    }
}


// --- 대시보드 (main.html) ---
async function initializeDashboard() {
    await populateFilters(); // 필터 목록 채우기
    await loadDashboardData(); // 초기 대시보드 데이터 로드

    // 필터 변경 시 대시보드 데이터 다시 로드
    document.getElementById('business-unit-filter')?.addEventListener('change', loadDashboardData);
    document.getElementById('category-filter')?.addEventListener('change', loadDashboardData);
}

async function populateFilters() {
    const data = await fetchFromServer('getProductInfo');
    const businessUnitFilter = document.getElementById('business-unit-filter');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!data || !businessUnitFilter || !categoryFilter) return;

    // 사업부 필터 채우기 (생활유통, OTC 순서)
    const businessUnits = ['생활유통', 'OTC'];
    businessUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        businessUnitFilter.appendChild(option);
    });

    // 카테고리 필터 채우기
    if (data.categories) {
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categoryFilter.appendChild(option);
        });
    }
}

async function loadDashboardData() {
    const businessUnit = document.getElementById('business-unit-filter').value;
    const category = document.getElementById('category-filter').value;

    // 서버에 필터 정보를 쿼리 파라미터로 전달
    const queryString = `?businessUnit=${encodeURIComponent(businessUnit)}&category=${encodeURIComponent(category)}`;
    const data = await fetchFromServer(`getOrderStatusDashboardData${queryString}`);

    if (data) {
        document.getElementById('po-pending-count').textContent = data.poPendingCount || 0;
        document.getElementById('shipping-pending-count').textContent = data.shippingPendingCount || 0;
        document.getElementById('low-stock-count').textContent = data.lowStockCount || 0;
    }
}


// --- 발주현황 (poStatus.html) ---
async function loadPoData() {
    const data = await fetchFromServer('getPoStatusDetails');
    const tableBody = document.getElementById('po-table-body');
    if (!tableBody) return;

    // 데이터가 없거나 records 배열이 없는 경우, 빈 상태로 유지
    if (!data || !data.records || data.records.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">표시할 데이터가 없습니다.</td></tr>';
        return;
    }
    
    tableBody.innerHTML = data.records.map(record => `
        <tr>
            <td>${record.fields['발주번호'] || ''}</td>
            <td>${record.fields['발주일자'] || ''}</td>
            <td>${record.fields['품번'] || ''}</td>
            <td>${record.fields['품명'] || ''}</td>
            <td>${(record.fields['발주수량'] || 0).toLocaleString()}</td>
            <td>${record.fields['입고여부'] ? '✔️' : '❌'}</td>
        </tr>
    `).join('');
}


// --- '입고처리' 페이지 로직 (stockReceiving.html) ---
let lastFoundPoForReceiving = null;
async function handlePoSearchByProductCode() { /* 이전과 동일 */ }
async function handleReceivingSubmit(event) { /* 이전과 동일 */ }
function resetReceivingForm() { /* 이전과 동일 */ }

// --- '출고확정' 페이지 로직 (shippingConfirmation.html) ---
let lastFoundShippingRequest = null;
async function handleShippingRequestSearch() { /* 이전과 동일 */ }
async function handleConfirmationSubmit(event) { /* 이전과 동일 */ }
function resetConfirmationForm() { /* 이전과 동일 */ }

// --- 나머지 페이지 로딩 함수 ---
async function loadInventoryData() { /* 이전과 동일 */ }
async function loadProductionPlans() { /* 이전과 동일 */ }
async function loadShippingRequestData() { /* 이전과 동일 */ }
async function loadDeliveryHistoryData() { /* 이전과 동일 */ }


// --- 페이지 로드 시 실행될 메인 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();

    switch (path) {
        case 'main.html':
        case 'index.html':
        case '':
            initializeDashboard();
            break;
        case 'poStatus.html':
            loadPoData();
            break;
        // ... 이하 다른 페이지들 로직은 이전과 동일
        case 'stockReceiving.html':
            document.getElementById('product-code-search')?.addEventListener('change', handlePoSearchByProductCode);
            document.getElementById('receiving-form')?.addEventListener('submit', handleReceivingSubmit);
            break;
        case 'inventoryLookup.html':
            loadInventoryData();
            break;
        case 'productionPlan.html':
            // 생산계획 관련 로드 함수 호출
            break;
        case 'shippingRequest.html':
             // 출고요청 관련 로드 함수 호출
            break;
        case 'shippingConfirmation.html':
            document.getElementById('request-number')?.addEventListener('change', handleShippingRequestSearch);
            document.getElementById('confirmation-form')?.addEventListener('submit', handleConfirmationSubmit);
            break;
        case 'deliveryHistory.html':
             // 납품이력 관련 로드 함수 호출
            break;
    }

    // 네비게이션 활성화 (이전과 동일)
    const navLinks = document.querySelectorAll('.sidebar .menu a');
    const currentPath = (path === 'index.html' || path === '') ? 'main.html' : path;
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
