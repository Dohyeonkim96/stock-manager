const Airtable = require('airtable');
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

const parseNumber = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/,/g, ''));
};

exports.handler = async function(event, context) {
  const { yuhanPartNo, category, businessUnit } = event.queryStringParameters;

  try {
    // 필요한 모든 테이블에서 데이터를 가져옵니다.
    const poRecords = await base('발주현황').select().all();
    const deliveryRecords = await base('납품이력(25년)').select().all();
    const itemRecords = await base('기본정보').select().all();

    // 1. 품목 기본정보를 정리합니다.
    const itemsByCode = {};
    itemRecords.forEach(r => {
      const code = r.fields['유한품번'];
      if(code) {
        itemsByCode[code] = {
          gskemPN: r.fields['지에스켐 품번'],
          itemName: r.fields['품명'],
          category: r.fields['카테고리'],
          businessUnit: r.fields['사업부']
        };
      }
    });

    // 2. 품목별 총 발주량(totalOrdered)과 발주 내역(transactions)을 계산합니다.
    const poStatus = {};
    poRecords.forEach(r => {
      const code = r.fields['유한품번'];
      if (!code) return;
      if (!poStatus[code]) {
        poStatus[code] = { totalOrdered: 0, transactions: [] };
      }
      const qty = parseNumber(r.fields['수량']);
      poStatus[code].totalOrdered += qty;
      poStatus[code].transactions.push({ date: r.fields['발주일'], qty: qty });
    });

    // 3. 품목별 누적 납품량(cumulativeDelivered)을 계산합니다.
    const deliveryStatus = {};
    deliveryRecords.forEach(r => {
      const code = r.fields['품목코드']; // '납품이력' 테이블의 품목코드 필드 이름
      if (!code) return;
      if (!deliveryStatus[code]) {
        deliveryStatus[code] = { cumulativeDelivered: 0 };
      }
      deliveryStatus[code].cumulativeDelivered += parseNumber(r.fields['수량']);
    });

    // 4. 위 데이터들을 합쳐서 최종 결과(results)를 만듭니다.
    let results = Object.keys(itemsByCode).map(code => {
      const totalOrdered = poStatus[code]?.totalOrdered || 0;
      const cumulativeDelivered = deliveryStatus[code]?.cumulativeDelivered || 0;
      
      return {
        itemCode: code,
        gskemPN: itemsByCode[code].gskemPN,
        itemName: itemsByCode[code].itemName,
        totalOrdered: totalOrdered,
        cumulativeDelivered: cumulativeDelivered,
        balance: totalOrdered - cumulativeDelivered, // 잔량 계산
        transactions: poStatus[code]?.transactions || []
      }
    }).filter(item => item.totalOrdered > 0 || item.cumulativeDelivered > 0); // 발주 또는 납품 이력이 있는 품목만 표시

    // 필터링 로직
    if (yuhanPartNo) {
        results = results.filter(item => item.itemCode.includes(yuhanPartNo));
    }
     if (businessUnit) {
        results = results.filter(item => itemsByCode[item.itemCode]?.businessUnit === businessUnit);
    }
    if (category) {
        results = results.filter(item => itemsByCode[item.itemCode]?.category === category);
    }
    
    // 전체 카테고리/사업부 목록 추출 (필터용)
    const allCategories = [...new Set(Object.values(itemsByCode).map(i => i.category).filter(Boolean))];
    const allBusinessUnits = [...new Set(Object.values(itemsByCode).map(i => i.businessUnit).filter(Boolean))];

    return {
      statusCode: 200,
      body: JSON.stringify({
        results,
        categories: allCategories,
        businessUnits: allBusinessUnits,
      }),
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
