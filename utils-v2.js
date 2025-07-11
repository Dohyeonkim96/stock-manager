// Airtable 설정
const AIRTABLE_API_KEY = 'patE1jSQ92OShRZ6y.610d9d1d8653f6e3671710eba078e7c1063d2e2ddd4f2cbd18a9311c2a49aa4f';
const AIRTABLE_BASE_ID = 'appq4lQ9vpBiBdn93';

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// --- Helper Functions ---
const getAirtableRecords = async (tableName, options = {}) => {
    try {
        const records = await base(tableName).select(options).all();
        return records.map(record => ({ id: record.id, ...record.fields }));
    } catch (err) {
        console.error(`Error fetching data from ${tableName}:`, err);
        alert(`${tableName} 데이터를 불러오는 중 오류가 발생했습니다.`);
        return [];
    }
};

const updateAirtableRecord = async (tableName, id, fields) => {
    try {
        const updatedRecord = await base(tableName).update(id, fields);
        return { id: updatedRecord.id, ...updatedRecord.fields };
    } catch (err) {
        console.error(`Error updating record in ${tableName}:`, err);
        alert('데이터 업데이트 중 오류가 발생했습니다.');
        throw err;
    }
};

const createAirtableRecord = async (tableName, fields) => {
    try {
        const createdRecord = await base(tableName).create([{ fields }]);
        return { id: createdRecord[0].id, ...createdRecord[0].fields };
    } catch (err) {
        console.error(`Error creating record in ${tableName}:`, err);
        alert('데이터 생성 중 오류가 발생했습니다.');
        throw err;
    }
};

const deleteAirtableRecord = async (tableName, id) => {
    try {
        await base(tableName).destroy(id);
    } catch (err) {
        console.error(`Error deleting record in ${tableName}:`, err);
        alert('데이터 삭제 중 오류가 발생했습니다.');
        throw err;
    }
};

// --- '입고처리' 페이지 로직 (stockReceiving.html) ---
let lastFoundPo = null; // 입고 처리할 발주 정보를 저장할 변수

async function handlePoSearchByProductCode() {
    const productCode = document.getElementById('product-code-search').value;
    if (!productCode) return;

    // 품번으로 아직 입고되지 않은 가장 최근 발주 건 조회
    const filterByFormula = `AND({품번} = '${productCode}', NOT({입고여부}))`;
    const records = await getAirtableRecords('발주현황', {
        filterByFormula: filterByFormula,
        sort: [{ field: '발주일자', direction: 'desc' }],
        maxRecords: 1
    });

    if (records.length === 0) {
        alert('해당 품번으로 입고 대기 중인 발주 내역이 없습니다.');
        resetReceivingForm();
        return;
    }

    lastFoundPo = records[0]; // 찾은 발주 정보 저장
    document.getElementById('product-name').value = lastFoundPo['품명'] || '';
    document.getElementById('po-date').value = lastFoundPo['발주일자'] || '';
}

async function handleReceivingSubmit(event) {
    event.preventDefault();
    if (!lastFoundPo) {
        alert('먼저 품번을 조회해주세요.');
        return;
    }

    const receivingQuantity = parseInt(document.getElementById('receiving-quantity').value, 10);
    if (isNaN(receivingQuantity) || receivingQuantity <= 0) {
        alert('올바른 입고수량을 입력해주세요.');
        return;
    }

    try {
        // 1. 발주현황 테이블 업데이트 (입고여부 체크)
        await updateAirtableRecord('발주현황', lastFoundPo.id, { '입고여부': true });

        // 2. 재고조회 테이블 업데이트
        const inventoryRecords = await getAirtableRecords('재고조회', {
            filterByFormula: `{품번} = '${lastFoundPo['품번']}'`
        });

        if (inventoryRecords.length > 0) {
            const inventory = inventoryRecords[0];
            const newStock = (inventory['현재고'] || 0) + receivingQuantity;
            await updateAirtableRecord('재고조회', inventory.id, {
                '현재고': newStock,
                '최근 입고일': new Date().toISOString().slice(0, 10)
            });
        } else {
             // 재고조회 테이블에 품목이 없을 경우, 새로 생성 (기본정보 기반)
            const productInfo = await getAirtableRecords('기본정보', {filterByFormula: `{품번} = '${lastFoundPo['품번']}'`});
            if(productInfo.length > 0){
                 await createAirtableRecord('재고조회', {
                    '품번': lastFoundPo['품번'],
                    '품명': lastFoundPo['품명'],
                    '현재고': receivingQuantity,
                    '최근 입고일': new Date().toISOString().slice(0, 10),
                    '규격': productInfo[0]['규격'],
                    '단위': productInfo[0]['단위'],
                    '안전재고': productInfo[0]['안전재고'],
                });
            }
        }

        alert('입고 처리가 완료되었습니다.');
        resetReceivingForm();
        lastFoundPo = null;

    } catch (error) {
        alert('입고 처리 중 오류가 발생했습니다.');
        console.error(error);
    }
}

function resetReceivingForm() {
    document.getElementById('receiving-form').reset();
}


// --- '출고확정' 페이지 로직 (shippingConfirmation.html) ---
let lastFoundShippingRequest = null;

async function handleShippingRequestSearch() {
    const requestNumber = document.getElementById('request-number').value;
    if (!requestNumber) return;

    const records = await getAirtableRecords('출고요청', {
        filterByFormula: `AND({출하요청번호} = '${requestNumber}', NOT({출고여부}))`
    });

    if (records.length === 0) {
        alert('존재하지 않거나 이미 처리된 출하요청번호입니다.');
        resetConfirmationForm();
        return;
    }

    lastFoundShippingRequest = records[0];
    document.getElementById('product-code-confirm').value = lastFoundShippingRequest['품번'] || '';
    document.getElementById('product-name-confirm').value = lastFoundShippingRequest['품명'] || '';
    document.getElementById('confirm-quantity').value = lastFoundShippingRequest['요청수량'] || '';
}

async function handleConfirmationSubmit(event) {
    event.preventDefault();
    if (!lastFoundShippingRequest) {
        alert('먼저 출하요청번호를 조회해주세요.');
        return;
    }

    const confirmQuantity = parseInt(document.getElementById('confirm-quantity').value, 10);
    if (isNaN(confirmQuantity) || confirmQuantity <= 0) {
        alert('올바른 출고수량을 입력해주세요.');
        return;
    }

    try {
        // 재고 확인
        const inventoryRecords = await getAirtableRecords('재고조회', {
            filterByFormula: `{품번} = '${lastFoundShippingRequest['품번']}'`
        });

        if (inventoryRecords.length === 0 || (inventoryRecords[0]['현재고'] || 0) < confirmQuantity) {
            alert('재고가 부족하여 출고할 수 없습니다.');
            return;
        }
        const inventory = inventoryRecords[0];

        // 1. 출고요청 테이블 업데이트
        await updateAirtableRecord('출고요청', lastFoundShippingRequest.id, { '출고여부': true });

        // 2. 재고조회 테이블 업데이트
        const newStock = inventory['현재고'] - confirmQuantity;
        await updateAirtableRecord('재고조회', inventory.id, { '현재고': newStock });

        // 3. 납품이력 테이블에 기록 생성
        await createAirtableRecord('납품이력', {
            '납품일자': new Date().toISOString().slice(0, 10),
            '출하요청번호': lastFoundShippingRequest['출하요청번호'],
            '품번': lastFoundShippingRequest['품번'],
            '품명': lastFoundShippingRequest['품명'],
            '납품수량': confirmQuantity
        });

        alert('출고 확정이 완료되었습니다.');
        resetConfirmationForm();
        lastFoundShippingRequest = null;

    } catch (error) {
        alert('출고 확정 중 오류가 발생했습니다.');
        console.error(error);
    }
}

function resetConfirmationForm() {
    document.getElementById('confirmation-form').reset();
}


// --- 기존 기능 (UI 변경에 따른 ID 수정 및 로직 확인) ---

// 대시보드 (main.html)
async function initializeDashboard() {
    // 이 함수는 이전과 동일하게 작동합니다.
    const products = await getAirtableRecords('기본정보');
    populateFilters(products);
    
    document.getElementById('business-unit-filter')?.addEventListener('change', () => loadDashboardData(products));
    document.getElementById('category-filter')?.addEventListener('change', () => loadDashboardData(products));

    loadDashboardData(products);
    loadProductionChart();
}
// 이하 대시보드 관련 함수들은 생략 (이전과 동일)
async function loadDashboardData(allProducts) {
    const selectedBusinessUnit = document.getElementById('business-unit-filter').value;
    const selectedCategory = document.getElementById('category-filter').value;

    let filteredProducts = allProducts;
    if (selectedBusinessUnit !== 'all') {
        filteredProducts = filteredProducts.filter(p => p['사업부'] === selectedBusinessUnit);
    }
    if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p['카테고리'] === selectedCategory);
    }
    const filteredProductCodes = filteredProducts.map(p => p['품번']);

    const poStatus = await getAirtableRecords('발주현황', { filterByFormula: "NOT({입고여부})" });
    const pendingPo = poStatus.filter(p => filteredProductCodes.includes(p['품번']));
    document.getElementById('po-pending-count').textContent = pendingPo.length;
    
    const shippingRequests = await getAirtableRecords('출고요청', { filterByFormula: "NOT({출고여부})" });
    const pendingShipping = shippingRequests.filter(s => filteredProductCodes.includes(s['품번']));
    document.getElementById('shipping-pending-count').textContent = pendingShipping.length;

    const inventory = await getAirtableRecords('재고조회');
    const lowStockItems = inventory.filter(item => 
        filteredProductCodes.includes(item['품번']) && 
        (item['현재고'] < item['안전재고'])
    );
    document.getElementById('low-stock-count').textContent = lowStockItems.length;
}
async function populateFilters(products) {
    const businessUnitFilter = document.getElementById('business-unit-filter');
    const categoryFilter = document.getElementById('category-filter');

    if(!businessUnitFilter || !categoryFilter) return;

    const businessUnits = ['생활유통', 'OTC'];
    businessUnits.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        businessUnitFilter.appendChild(option);
    });

    const categories = [...new Set(products.map(p => p['카테고리']).filter(Boolean))].sort();
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}
async function loadProductionChart() {
    const plans = await getAirtableRecords('생산계획');
    const monthlyData = {};
    if(!plans) return;

    plans.forEach(plan => {
        const month = new Date(plan['계획일자']).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { planned: 0, actual: 0 };
        }
        monthlyData[month].planned += plan['계획수량'] || 0;
        if (plan['생산여부']) {
            monthlyData[month].actual += plan['계획수량'] || 0;
        }
    });

    const labels = Object.keys(monthlyData).sort();
    const plannedData = labels.map(m => monthlyData[m].planned);
    const actualData = labels.map(m => monthlyData[m].actual);

    const ctx = document.getElementById('production-chart')?.getContext('2d');
    if(ctx) {
        new Chart(ctx, { /* ... 차트 설정 ... */ });
    }
}

// 재고 현황 조회 (inventoryLookup.html)
async function loadInventoryData() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    const inventory = await getAirtableRecords('재고조회');
    tableBody.innerHTML = '';
    let totalQuantity = 0;
    inventory.forEach(item => {
        const row = document.createElement('tr');
        const currentStock = item['현재고'] || 0;
        totalQuantity += currentStock;
        row.innerHTML = `<td>...</td>`; // 이전과 동일
        row.addEventListener('click', () => showItemDetails(item));
        tableBody.appendChild(row);
    });
    document.getElementById('total-quantity').textContent = `총 재고 수량: ${totalQuantity.toLocaleString()}`;
}
function showItemDetails(item) { /* 이전과 동일 */ }

// 생산 계획 관리 (productionPlan.html)
async function loadProductionPlans() { /* 이전과 동일 */ }
async function showPlanDetails(recordId) { /* 이전과 동일 */ }
async function populateProductOptions() { /* 이전과 동일 */ }
async function handlePlanSubmit(event) { /* 이전과 동일 */ }

// 기타 페이지 로드
async function loadPoData() { /* 이전과 동일 */ }
async function loadShippingRequestData() { /* 이전과 동일 */ }
async function loadDeliveryHistoryData() { /* 이전과 동일 */ }


// --- 페이지 로드 시 실행될 메인 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();

    // 1. 현재 페이지에 따라 필요한 데이터 로드
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
            loadProductionPlans();
            populateProductOptions();
            document.getElementById('plan-form')?.addEventListener('submit', handlePlanSubmit);
            break;
        case 'shippingRequest.html':
            loadShippingRequestData();
            break;
        case 'shippingConfirmation.html':
            document.getElementById('request-number')?.addEventListener('change', handleShippingRequestSearch);
            document.getElementById('confirmation-form')?.addEventListener('submit', handleConfirmationSubmit);
            break;
        case 'deliveryHistory.html':
            loadDeliveryHistoryData();
            break;
    }

    // 2. 네비게이션 활성화 상태 업데이트
    const navLinks = document.querySelectorAll('.sidebar .menu a');
    let hasActive = false;
    const currentPath = (path === 'index.html' || path === '') ? 'main.html' : path;
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
            hasActive = true;
        }
    });
});
