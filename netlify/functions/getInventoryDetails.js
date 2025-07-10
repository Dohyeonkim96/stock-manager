const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function(event, context) {
  try {
    const itemRecords = await base('기본정보').select().all();
    const stockRecords = await base('재고조회').select().all();

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

    const inventory = {};
    stockRecords.forEach(record => {
      const itemCode = record.fields['품목코드'];
      if (!itemCode) return;

      if (!inventory[itemCode]) {
        const itemInfo = itemsByCode[itemCode] || {};
        inventory[itemCode] = {
          itemCode: itemCode,
          itemName: itemInfo.itemName || record.fields['제품명'] || '품명 정보 없음',
          classification: itemInfo.classification,
          remarks: itemInfo.remarks || record.fields['비고'] || '',
          totalQuantity: 0,
          lots: []
        };
      }

      // [수정된 부분] 쉼표(,)를 제거하고 숫자로 변환합니다.
      const quantityString = String(record.fields['수량'] || '0');
      const quantity = Number(quantityString.replace(/,/g, ''));

      inventory[itemCode].totalQuantity += quantity;

      inventory[itemCode].lots.push({
        airtableRecordId: record.id,
        lot: record.fields['LOT'],
        quantity: quantity, // 쉼표가 제거된 숫자를 사용합니다.
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
