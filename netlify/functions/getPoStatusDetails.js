// /netlify/functions/getPoStatus.js

const Airtable = require('airtable');

// Netlify 환경변수에서 키와 베이스 ID를 가져옵니다.
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

exports.handler = async function (event, context) {
  try {
    const records = await base('발주내역').select().all(); // '발주내역' 테이블 조회
    
    // ... Airtable에서 가져온 데이터를 가공하여 PO 잔량을 계산하는 로직 ...
    // 이 부분은 기존 Apps Script 로직을 참고하여 재작성해야 합니다.
    const processedData = processRecords(records); // 예시 함수

    return {
      statusCode: 200,
      body: JSON.stringify(processedData),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '데이터 조회에 실패했습니다.' }),
    };
  }
};
