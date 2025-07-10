const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    // 실제 Airtable 테이블 이름('기본정보', '재고조회')으로 최종 수정
    const itemRecords = await base('기본정보').select().all();
    const stockRecords = await base('재고조회').select().all();

    // --- 이하 데이터 가공 로직 ---
    const itemsById = {};
    itemRecords.forEach(record => {
      // '기본정보' 테이블의 '품목코드' 필드를 사용합니다.
      const itemCode = record.fields['품목코드'];
      if (itemCode) {
        itemsById[itemCode] = {
          itemName: record.fields['제품명'],
          classification: record.fields['분류'], // '분류' 필드가 '기본정보' 테이블에 있어야 합니다.
          remarks: record.fields['비고']
        };
      }
    });

    const inventory = {};
    stockRecords.forEach(record => {
      // '재고조회' 테이블의 '품목코드' 필드를 사용합니다.
      const itemCode = record.fields['품목코드'];
      if (!itemCode) return;

      if (!inventory[itemCode]) {
        const itemInfo = itemsById[itemCode] || {};
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: itemInfo.itemName || record.fields['제품명'] || '품명 정보 없음',
          classification: itemInfo.classification || '미분류',
          remarks: itemInfo.remarks || record.fields['비고'] || '',
          totalQuantity: 0,
          lots: []
        };
      }

      const quantity = record.fields['수량'] || 0;
      inventory[itemCode].totalQuantity += quantity;
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
