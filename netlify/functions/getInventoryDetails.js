const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    // 1. 각 테이블에서 모든 데이터를 가져옵니다.
    const itemRecords = await base('기본정보').select().all();
    const stockRecords = await base('재고조회').select().all();

    // 2. '기본정보'를 품목코드를 기준으로 정리해서 찾기 쉽게 만듭니다.
    const itemsByCode = {};
    itemRecords.forEach(record => {
      const itemCode = record.fields['품목코드'];
      if (itemCode) {
        itemsByCode[itemCode] = {
          itemName: record.fields['제품명'],
          classification: record.fields['분류'] || '미분류',
          remarks: record.fields['비고']
        };
      }
    });

    // 3. '재고조회' 데이터를 바탕으로 품목별 재고를 합산합니다.
    const inventory = {};
    stockRecords.forEach(record => {
      const itemCode = record.fields['품목코드'];
      if (!itemCode) return; // 품목코드가 없는 데이터는 건너뜁니다.

      // inventory 객체에 해당 품목이 아직 없으면, 기본 정보를 세팅합니다.
      if (!inventory[itemCode]) {
        const itemInfo = itemsByCode[itemCode] || {}; // '기본정보'에서 해당 품목 정보를 찾습니다.
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: itemInfo.itemName || record.fields['제품명'] || '품명 정보 없음',
          classification: itemInfo.classification, // '기본정보'에서 찾은 분류를 사용합니다.
          remarks: itemInfo.remarks || record.fields['비고'] || '',
          totalQuantity: 0,
          lots: []
        };
      }
      
      // 수량을 숫자로 변환하여 합산합니다.
      const quantity = Number(record.fields['수량']) || 0;
      inventory[itemCode].totalQuantity += quantity;
      
      // LOT별 상세 정보도 추가합니다. (이후 상세 보기 기능에 사용)
      inventory[itemCode].lots.push({
        airtableRecordId: record.id,
        lot: record.fields['LOT'],
        quantity: quantity,
        mfgDate: record.fields['제조일자'],
        expDate: record.fields['유통기한'],
        palletQty: record.fields['파렛트수량'],
        remarks: record.fields['비고']
      });
    });
    
    // 4. 최종적으로 가공된 데이터를 반환합니다.
    return {
      statusCode: 200,
      body: JSON.stringify(Object.values(inventory)),
    };

  } catch (error) {
    console.error("Function failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  }
};
