const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    // [수정] 오직 '재고조회' 테이블만 사용하도록 변경합니다.
    const stockRecords = await base('재고조회').select().all();

    const inventory = {};
    stockRecords.forEach(record => {
      const itemCode = record.fields['품목코드'];
      if (!itemCode) return;

      // 품목별로 데이터를 집계하기 위한 기본 틀을 만듭니다.
      if (!inventory[itemCode]) {
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: record.fields['제품명'] || '품명 정보 없음',
          classification: '미분류', // [수정] 분류는 일단 '미분류'로 고정합니다.
          remarks: record.fields['비고'] || '',
          totalQuantity: 0,
          lots: []
        };
      }

      // 쉼표가 포함된 문자열을 숫자로 변환합니다.
      const quantityString = String(record.fields['수량'] || '0').replace(/,/g, '');
      const quantity = Number(quantityString);

      // 총 수량을 더합니다.
      inventory[itemCode].totalQuantity += quantity;

      // LOT별 상세 정보를 추가합니다.
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
