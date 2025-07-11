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


// --- 재고 현황 조회 (inventoryLookup.html) ---
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

        row.innerHTML = `
            <td>${item['품번'] || ''}</td>
            <td>${item['품명'] || ''}</td>
            <td>${currentStock.toLocaleString()}</td>
            <td>${item['단위'] || ''}</td>
            <td>${item['최근 입고일'] || ''}</td>
        `;
        row.addEventListener('click', () => showItemDetails(item));
        tableBody.appendChild(row);
    });

    const totalQuantityDiv = document.getElementById('total-quantity');
    if(totalQuantityDiv) {
        totalQuantityDiv.textContent = `총 재고 수량: ${totalQuantity.toLocaleString()}`;
    }
}

function showItemDetails(item) {
    const modal = document.getElementById('item-details-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTotal = document.getElementById('modal-total-quantity');

    if (!modal || !modalBody || !modalTotal) return;
    
    const currentStock = item['현재고'] || 0;

    modalBody.innerHTML = `
        <p><strong>품번:</strong> ${item['품번'] || ''}</p>
        <p><strong>품명:</strong> ${item['품명'] || ''}</p>
        <p><strong>규격:</strong> ${item['규격'] || ''}</p>
        <p><strong>단위:</strong> ${item['단위'] || ''}</p>
        <p><strong>최근 입고일:</strong> ${item['최근 입고일'] || ''}</p>
    `;

    modalTotal.innerHTML = `<p><strong>현재고:</strong> ${currentStock.toLocaleString()}</p>`;

    modal.style.display = 'block';

    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}


// --- 생산 계획 관리 (productionPlan.html) ---
async function loadProductionPlans() {
    const tableBody = document.getElementById('plan-table-body');
    if (!tableBody) return;

    const plans = await getAirtableRecords('생산계획', { sort: [{ field: '계획일자', direction: 'desc' }] });
    const products = await getAirtableRecords('기본정보');
    const productMap = new Map(products.map(p => [p['품번'], p['품명']]));

    tableBody.innerHTML = '';
    plans.forEach(plan => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${plan['계획일자'] || ''}</td>
            <td>${plan['품번'] || ''}</td>
            <td>${productMap.get(plan['품번']) || '알 수 없음'}</td>
            <td>${(plan['계획수량'] || 0).toLocaleString()}</td>
            <td>${plan['생산여부'] ? '✔️' : '❌'}</td>
        `;
        row.addEventListener('click', () => showPlanDetails(plan.id));
        tableBody.appendChild(row);
    });
}

async function showPlanDetails(recordId) {
    const modal = document.getElementById('plan-details-modal');
    const modalBody = document.getElementById('modal-body-plan');
    if (!modal || !modalBody) return;

    const plan = (await getAirtableRecords('생산계획', { filterByFormula: `RECORD_ID() = '${recordId}'` }))[0];
    if (!plan) {
        alert('계획 정보를 찾을 수 없습니다.');
        return;
    }
    
    const products = await getAirtableRecords('기본정보');
    const product = products.find(p => p['품번'] === plan['품번']);

    // Display mode
    const displayContent = () => {
        modalBody.innerHTML = `
            <p><strong>계획일자:</strong> ${plan['계획일자'] || ''}</p>
            <p><strong>품번:</strong> ${plan['품번'] || ''}</p>
            <p><strong>품명:</strong> ${product ? product['품명'] : '알 수 없음'}</p>
            <p><strong>계획수량:</strong> ${(plan['계획수량'] || 0).toLocaleString()}</p>
            <p><strong>생산여부:</strong> ${plan['생산여부'] ? '완료' : '미완료'}</p>
        `;
        document.getElementById('edit-plan-btn').style.display = 'inline-block';
        document.getElementById('delete-plan-btn').style.display = 'inline-block';
        document.getElementById('save-plan-btn').style.display = 'none';
        document.getElementById('cancel-edit-btn').style.display = 'none';
    };

    // Edit mode
    const editContent = () => {
        modalBody.innerHTML = `
            <div class="form-group">
                <label for="edit-plan-date">계획일자</label>
                <input type="date" id="edit-plan-date" value="${plan['계획일자'] || ''}">
            </div>
            <div class="form-group">
                <label for="edit-plan-quantity">계획수량</label>
                <input type="number" id="edit-plan-quantity" value="${plan['계획수량'] || 0}">
            </div>
             <div class="form-group">
                <label for="edit-production-status">생산여부</label>
                <select id="edit-production-status">
                    <option value="true" ${plan['생산여부'] ? 'selected' : ''}>완료</option>
                    <option value="false" ${!plan['생산여부'] ? 'selected' : ''}>미완료</option>
                </select>
            </div>
        `;
        document.getElementById('edit-plan-btn').style.display = 'none';
        document.getElementById('delete-plan-btn').style.display = 'none';
        document.getElementById('save-plan-btn').style.display = 'inline-block';
        document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    };

    displayContent();
    modal.style.display = 'block';

    // --- Event Listeners for buttons ---
    const editBtn = document.getElementById('edit-plan-btn');
    const deleteBtn = document.getElementById('delete-plan-btn');
    const saveBtn = document.getElementById('save-plan-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    editBtn.onclick = editContent;
    cancelBtn.onclick = displayContent;
    
    deleteBtn.onclick = async () => {
        if (confirm('정말로 이 계획을 삭제하시겠습니까?')) {
            await deleteAirtableRecord('생산계획', recordId);
            alert('계획이 삭제되었습니다.');
            modal.style.display = 'none';
            loadProductionPlans();
        }
    };
    
    saveBtn.onclick = async () => {
        const updatedFields = {
            '계획일자': document.getElementById('edit-plan-date').value,
            '계획수량': parseInt(document.getElementById('edit-plan-quantity').value, 10),
            '생산여부': document.getElementById('edit-production-status').value === 'true'
        };

        await updateAirtableRecord('생산계획', recordId, updatedFields);
        alert('계획이 성공적으로 수정되었습니다.');
        modal.style.display = 'none';
        loadProductionPlans();
    };

    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target == modal) { modal.style.display = 'none'; } };
}

async function populateProductOptions() {
    const select = document.getElementById('product-code');
    if (!select) return;

    const products = await getAirtableRecords('기본정보');
    select.innerHTML = '<option value="">품목을 선택하세요</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p['품번'];
        option.textContent = `${p['품명']} (${p['품번']})`;
        select.appendChild(option);
    });
}

async function handlePlanSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const newPlan = {
        '품번': form['product-code'].value,
        '계획일자': form['plan-date'].value,
        '계획수량': parseInt(form['plan-quantity'].value, 10),
        '생산여부': false
    };

    if (!newPlan['품번'] || !newPlan['계획일자'] || isNaN(newPlan['계획수량'])) {
        alert('모든 필드를 올바르게 입력해주세요.');
        return;
    }
    
    await createAirtableRecord('생산계획', newPlan);
    alert('새로운 생산 계획이 추가되었습니다.');
    form.reset();
    loadProductionPlans();
}

// --- 기타 페이지 로드 함수 ---
async function loadPoData() {
    const tableBody = document.getElementById('po-table-body');
    if (!tableBody) return;
    const data = await getAirtableRecords('발주현황');
    tableBody.innerHTML = data.map(record => `
        <tr>
            <td>${record['발주번호'] || ''}</td>
            <td>${record['발주일자'] || ''}</td>
            <td>${record['품번'] || ''}</td>
            <td>${record['품명'] || ''}</td>
            <td>${(record['발주수량'] || 0).toLocaleString()}</td>
            <td>${record['입고여부'] ? '✔️' : '❌'}</td>
        </tr>
    `).join('');
}

async function loadShippingRequestData() {
    const tableBody = document.getElementById('shipping-request-table-body');
    if (!tableBody) return;
    const data = await getAirtableRecords('출고요청');
    tableBody.innerHTML = data.map(record => `
        <tr>
            <td>${record['출하요청번호'] || ''}</td>
            <td>${record['요청일자'] || ''}</td>
            <td>${record['품번'] || ''}</td>
            <td>${record['품명'] || ''}</td>
            <td>${(record['요청수량'] || 0).toLocaleString()}</td>
            <td>${record['출고여부'] ? '✔️' : '❌'}</td>
        </tr>
    `).join('');
}

async function loadDeliveryHistoryData() {
    const tableBody = document.getElementById('delivery-history-table-body');
    if (!tableBody) return;
    const data = await getAirtableRecords('납품이력');
    tableBody.innerHTML = data.map(record => `
        <tr>
            <td>${record['납품일자'] || ''}</td>
            <td>${record['출하요청번호'] || ''}</td>
            <td>${record['품번'] || ''}</td>
            <td>${record['품명'] || ''}</td>
            <td>${(record['납품수량'] || 0).toLocaleString()}</td>
        </tr>
    `).join('');
}

// 초기화 로직
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.split("/").pop();

    switch (path) {
        case 'poStatus.html':
            loadPoData();
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
        case 'deliveryHistory.html':
            loadDeliveryHistoryData();
            break;
    }
    
    // 네비게이션 활성화 상태 업데이트
    const navLinks = document.querySelectorAll('.sidebar .menu a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
