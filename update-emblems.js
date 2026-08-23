/**
 * 지역 상징기 이미지 통합 관리 스크립트
 *
 * 동작 순서 (지역마다):
 *   1. assets/emblems 폴더에 이미 파일이 있으면 -> 그걸로 연결
 *   2. 없으면 -> 나무위키 링크를 자동 다운로드 시도
 *   3. 그것도 실패하면 -> 목록으로 알려줌 (직접 받아서 넣으시면 됨)
 *
 * 사용법: node update-emblems.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE = path.join(__dirname, 'data', 'localgov.js');
const OUT_DIR = path.join(__dirname, 'assets', 'emblems');

// 한글 지역명 -> 영어 파일명(슬러그) 매핑 (유일한 매핑표, 이 파일 하나만 관리하면 돼요)
const SLUG_MAP = {
  // ---- 일본 47 ----
  "홋카이도":"hokkaido", "아오모리현":"aomori", "이와테현":"iwate", "미야기현":"miyagi",
  "아키타현":"akita", "야마가타현":"yamagata", "후쿠시마현":"fukushima", "이바라키현":"ibaraki",
  "도치기현":"tochigi", "군마현":"gunma", "사이타마현":"saitama", "치바현":"chiba",
  "지바현":"chiba", "도쿄도":"tokyo", "가나가와현":"kanagawa", "니가타현":"niigata",
  "도야마현":"toyama", "이시카와현":"ishikawa", "후쿠이현":"fukui", "야마나시현":"yamanashi",
  "나가노현":"nagano", "기후현":"gifu", "시즈오카현":"shizuoka", "아이치현":"aichi",
  "미에현":"mie", "시가현":"shiga", "교토부":"kyoto", "오사카부":"osaka",
  "효고현":"hyogo", "나라현":"nara", "와카야마현":"wakayama", "돗토리현":"tottori",
  "시마네현":"shimane", "오카야마현":"okayama", "히로시마현":"hiroshima", "야마구치현":"yamaguchi",
  "도쿠시마현":"tokushima", "가가와현":"kagawa", "에히메현":"ehime", "고치현":"kochi",
  "후쿠오카현":"fukuoka", "사가현":"saga", "나가사키현":"nagasaki", "구마모토현":"kumamoto",
  "오이타현":"oita", "미야자키현":"miyazaki", "가고시마현":"kagoshima", "오키나와현":"okinawa",

  // ---- 프랑스 25 ----
  "일드프랑스":"ile-de-france", "오베르뉴론알프":"auvergne-rhone-alpes",
  "부르고뉴프랑슈콩테":"bourgogne-franche-comte", "브르타뉴":"bretagne",
  "상트르발드루아르":"centre-val-de-loire", "코르시카":"corse", "그랑테스트":"grand-est",
  "오드프랑스":"hauts-de-france", "노르망디":"normandie", "누벨아키텐":"nouvelle-aquitaine",
  "옥시타니":"occitanie", "페이드라루아르":"pays-de-la-loire",
  "프로방스알프코트다쥐르":"provence-alpes-cote-dazur", "과들루프":"guadeloupe",
  "마르티니크":"martinique", "프랑스령 기아나":"guyane", "레위니옹":"reunion",
  "마요트":"mayotte", "누벨칼레도니":"nouvelle-caledonie",
  "프랑스령 폴리네시아":"polynesie-francaise", "왈리스 푸투나":"wallis-et-futuna",
  "생피에르미클롱":"saint-pierre-et-miquelon", "생바르텔레미":"saint-barthelemy",
  "생마르탱":"saint-martin", "프랑스령 남방 및 남극지역":"tfaf",

  // ---- 캐나다 13 ----
  "온타리오주":"ontario", "퀘벡주":"quebec", "노바스코샤주":"nova-scotia",
  "뉴브런즈윅주":"new-brunswick", "매니토바주":"manitoba", "브리티시컬럼비아주":"british-columbia",
  "프린스에드워드아일랜드주":"prince-edward-island", "서스캐처원주":"saskatchewan",
  "앨버타주":"alberta", "뉴펀들랜드래브라도주":"newfoundland-and-labrador",
  "노스웨스트준주":"northwest-territories", "유콘준주":"yukon", "누나부트준주":"nunavut",

  // ---- 영국 24 ----
  "잉글랜드":"england", "스코틀랜드":"scotland", "웨일스":"wales", "북아일랜드":"northern-ireland",
  "맨섬":"isle-of-man", "저지":"jersey", "건지":"guernsey", "올더니":"alderney", "사크":"sark",
  "앵귈라":"anguilla", "버뮤다":"bermuda", "영국령 남극":"bat", "영국령 남극지역":"bat",
  "영국령 인도양 지역":"biot", "영국령 인도양지역":"biot",
  "영국령 버진아일랜드":"bvi", "케이맨 제도":"cayman-islands",
  "포클랜드 제도":"falkland-islands", "지브롤터":"gibraltar", "몬트세랫":"montserrat",
  "핏케언 제도":"pitcairn", "세인트헬레나":"saint-helena", "어센션섬":"ascension",
  "트리스탄다쿠냐":"tristan-da-cunha", "세인트헬레나·어센션·트리스탄다쿠냐":"saint-helena",
  "사우스조지아 사우스샌드위치 제도":"south-georgia", "터크스 케이커스 제도":"turks-and-caicos",
  "아크로티리 데켈리아":"akrotiri-and-dhekelia"

  // 앞으로 새 나라/지역 추가하시면 여기에 "이름":"슬러그" 형태로 이어서 추가하시면 돼요
};

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

function download(url, dest){
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Referer': 'https://namu.wiki/'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200){
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function main(){
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const filesInFolder = fs.readdirSync(OUT_DIR);
  let src = fs.readFileSync(DATA_FILE, 'utf8');

  const lineRegex = /name:"([^"]+)"[^\n]*?image:"(https:\/\/i\.namu\.wiki\/[^"]+)"/g;
  let match;
  const jobs = [];
  while ((match = lineRegex.exec(src)) !== null){
    jobs.push({ name: match[1], url: match[2] });
  }

  console.log(`나무위키 링크로 남아있는 항목: ${jobs.length}개\n`);

  let linkedLocal = 0, downloaded = 0, failed = 0, noSlug = 0;
  const failedList = [];

  for (const job of jobs){
    const slug = SLUG_MAP[job.name];
    if (!slug){
      console.log(`⚠️  매핑 없음: ${job.name} (SLUG_MAP에 추가해주세요)`);
      noSlug++;
      continue;
    }

    const found = filesInFolder.find(f => f.slice(0, f.lastIndexOf('.')) === slug);
    if (found){
      src = src.split(job.url).join(`assets/emblems/${found}`);
      console.log(`📁 폴더에서 연결됨: ${job.name} -> ${found}`);
      linkedLocal++;
      continue;
    }

    const extMatch = job.url.match(/\.(svg|png|jpe?g|gif)(?:\?|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    const filename = `${slug}.${ext}`;
    const dest = path.join(OUT_DIR, filename);

    try {
      await download(job.url, dest);
      src = src.split(job.url).join(`assets/emblems/${filename}`);
      console.log(`✅ 다운로드 성공: ${job.name} -> ${filename}`);
      downloaded++;
    } catch (e){
      await sleep(1000);
      try {
        await download(job.url, dest);
        src = src.split(job.url).join(`assets/emblems/${filename}`);
        console.log(`✅ (재시도 성공) ${job.name} -> ${filename}`);
        downloaded++;
      } catch (e2){
        console.log(`❌ 실패: ${job.name} (${e2.message}) — assets/emblems/${slug}.확장자 로 직접 저장해주세요`);
        failed++;
        failedList.push(job.name);
      }
    }
    await sleep(300);
  }

  fs.writeFileSync(DATA_FILE, src, 'utf8');

  console.log(`\n완료!`);
  console.log(`📁 폴더에서 바로 연결: ${linkedLocal}`);
  console.log(`✅ 자동 다운로드 성공: ${downloaded}`);
  console.log(`❌ 실패(직접 저장 필요): ${failed}`);
  console.log(`⚠️  매핑 없음: ${noSlug}`);
  if (failedList.length){
    console.log(`\n직접 저장이 필요한 지역: ${failedList.join(', ')}`);
  }
}

main();