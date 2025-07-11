// --- Helper: Netlify 서버 함수 호출 ---
async function fetchFromServer(endpoint, options = {}) {
    try {
        const response = await fetch(`/.netlify/functions/${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '서버 통신에 실패했습니다.');
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from /${endpoint}:`, error);
        alert(error.message);
        return null; // 실패 시 null 반환
    }
}

// --- '입고처리' 페이지 로직 (stockReceiving.html) ---
let lastFoundPoForReceiving = null;

async function handlePoSearchByProductCode() {
    const productCode = document.getElementById('product-code-search').value.trim();
    if (!productCode) return;

    // 서버에 품번을 보내고 입고 대기 중인 발주 정보를 요청
    const data = await fetchFromServer(`getPoForReceiving?productCode=${productCode}`);

    if (data && data.record) {
        lastFoundPoForReceiving = data.record;
        document.getElementById('product-name').value = lastFoundPoForReceiving.fields['품명'] || '';
        document.getElementById('po-date').value = lastFoundPoForReceiving.fields['발주일자'] || '';
    } else {
        alert('해당 품번으로 입고 대기 중인 발주 내역이 없습니다.');
        resetReceivingForm();
    }
}

async function handleReceivingSubmit(event) {
    event.preventDefault();
    const receivingQuantity = parseInt(document.getElementById('receiving-quantity').value, 10);

    if (!lastFoundPoForReceiving) {
        alert('먼저 품번을 조회해주세요.');
        return;
    }
    if (isNaN(receivingQuantity) || receivingQuantity <= 0) {
        alert('올바른 입고수량을 입력해주세요.');
        return;
    }

    const body = {
        poId: lastFoundPoForReceiving.id,
        productCode: lastFoundPoForReceiving.fields['품번'],
        quantity: receivingQuantity
    };

    const result = await fetchFromServer('saveReceivedStock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (result) {
        alert(result.message);
        resetReceivingForm();
        lastFoundPoForReceiving = null;
    }
}

function resetReceivingForm() {
    document.getElementById('receiving-form').reset();
}


// --- '출고확정' 페이지 로직 (shippingConfirmation.html) ---
let lastFoundShippingRequest = null;

async function handleShippingRequestSearch() {
    const requestNumber = document.getElementById('request-number').value.trim();
    if (!requestNumber) return;

    const data = await fetchFromServer(`getShipmentRequestDetails?requestNumber=${requestNumber}`);

    if (data && data.record) {
        lastFoundShippingRequest = data.record;
        document.getElementById('product-code-confirm').value = lastFoundShippingRequest.fields['품번'] || '';
        document.getElementById('product-name-confirm').value = lastFoundShippingRequest.fields['품명'] || '';
        document.getElementById('confirm-quantity').value = lastFoundShippingRequest.fields['요청수량'] || '';
    } else {
        alert('존재하지 않거나 이미 처리된 출하요청번호입니다.');
        resetConfirmationForm();
    }
}

async function handleConfirmationSubmit(event) {
    event.preventDefault();
    const confirmQuantity = parseInt(document.getElementById('confirm-quantity').value, 10);

    if (!lastFoundShippingRequest) {
        alert('먼저 출하요청번호를 조회해주세요.');
        return;
    }
    if (isNaN(confirmQuantity) || confirmQuantity <= 0) {
        alert('올바른 출고수량을 입력해주세요.');
        return;
    }

    const body = {
        requestId: lastFoundShippingRequest.id,
        productCode: lastFoundShippingRequest.fields['품번'],
        productName: lastFoundShippingRequest.fields['품명'],
        requestNumber: lastFoundShippingRequest.fields['출하요청번호'],
        quantity: confirmQuantity,
    };

    const result = await fetchFromServer('manageShipmentRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (result) {
        alert(result.message);
        resetConfirmationForm();
        lastFoundShippingRequest = null;
    }
}

function resetConfirmationForm() {
    document.getElementById('confirmation-form').reset();
}

// --- 페이지별 데이터 로딩 함수 ---

// 대시보드
async function initializeDashboard() {
    const data = await fetchFromServer('getOrderStatusDashboardData');
    if (!data) return;
    
    document.getElementById('po-pending-count').textContent = data.poPendingCount || 0;
    document.getElementById('shipping-pending-count').textContent = data.shippingPendingCount || 0;
    document.getElementById('low-stock-count').textContent = data.lowStockCount || 0;

    // 차트 로딩 로직은 여기에 추가...
}

// 발주현황
async function loadPoData() {
    const data = await fetchFromServer('getPoStatusDetails');
    const tableBody = document.getElementById('po-table-body');
    if (!data || !tableBody) return;
    
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

// 재고현황조회
async function loadInventoryData() {
    const data = await fetchFromServer('getInventoryDetails');
    const tableBody = document.getElementById('inventory-table-body');
    if (!data || !tableBody) return;

    let totalQuantity = 0;
    tableBody.innerHTML = data.records.map(record => {
        const currentStock = record.fields['현재고'] || 0;
        totalQuantity += currentStock;
        return `
            <tr>
                <td>${record.fields['품번'] || ''}</td>
                <td>${record.fields['품명'] || ''}</td>
                <td>${currentStock.toLocaleString()}</td>
                <td>${record.fields['단위'] || ''}</td>
                <td>${record.fields['최근 입고일'] || ''}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('total-quantity').textContent = `총 재고 수량: ${totalQuantity.toLocaleString()}`;
}


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
        case 'stockReceiving.html':
            document.getElementById('product-code-search')?.addEventListener('change', handlePoSearchByProductCode);
            document.getElementById('receiving-form')?.addEventListener('submit', handleReceivingSubmit);
            break;
        case 'inventoryLookup.html':
            loadInventoryData();
            break;
        case 'productionPlan.html':
            // 생산계획 관련 로드 함수 호출 (필요 시 구현)
            break;
        case 'shippingRequest.html':
             // 출고요청 관련 로드 함수 호출 (필요 시 구현)
            break;
        case 'shippingConfirmation.html':
            document.getElementById('request-number')?.addEventListener('change', handleShippingRequestSearch);
            document.getElementById('confirmation-form')?.addEventListener('submit', handleConfirmationSubmit);
            break;
        case 'deliveryHistory.html':
             // 납품이력 관련 로드 함수 호출 (필요 시 구현)
            break;
    }

    // 네비게이션 활성화
    const navLinks = document.querySelectorAll('.sidebar .menu a');
    const currentPath = (path === 'index.html' || path === '') ? 'main.html' : path;
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
});
