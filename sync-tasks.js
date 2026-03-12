/**
 * sync-tasks.js
 * Google SheetsからタスクCSVを取得してtasks.jsonを更新する
 * 実行: node sync-tasks.js
 * ※ Chromeのセッションが必要（openclaw browser profileでログイン中であること）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1U36buRkc2gyv0-QVTCGwcUILQt5Du9fKeBApggFB6Eo';
const GID = '0';
const OUTPUT = path.join(__dirname, 'tasks.json');

// Google ChromeのCookieファイルからセッションを取得してfetch
// (ブラウザ経由で実行する場合はこのスクリプトをブラウザ内で実行)
// 直接実行する場合はCookieが必要

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(current); current = '';
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && text[i+1] === '\n') i++;
      row.push(current); current = '';
      lines.push(row); row = [];
    } else {
      current += ch;
    }
  }
  if (current || row.length) { row.push(current); lines.push(row); }
  return lines;
}

function processRows(rows) {
  if (rows.length < 2) return [];
  const header = rows[0];
  return rows.slice(1).filter(r => r[0] && r[0].trim()).map(r => ({
    no: r[0]?.trim() || '',
    category: r[1]?.trim() || '',
    task: r[2]?.trim() || '',
    target: r[3]?.trim() || '',
    detail: r[4]?.trim() || '',
    priority: r[5]?.trim() || '',
    tool: r[6]?.trim() || '',
    owner: r[7]?.trim() || '',
    status: r[8]?.trim() || '未着手',
    startTime: r[9]?.trim() || '',
    endTime: r[10]?.trim() || '',
    elapsed: r[11]?.trim() || '',
    deliveryUrl: r[12]?.trim() || '',
  }));
}

// CSV文字列を直接処理する関数（外部から呼び出し用）
function saveFromCSV(csvText) {
  const rows = parseCSV(csvText);
  const tasks = processRows(rows);
  const output = {
    syncedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    sheetId: SHEET_ID,
    tasks
  };
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf8');
  console.log(`✅ tasks.json saved: ${tasks.length} tasks`);
  return tasks.length;
}

module.exports = { parseCSV, processRows, saveFromCSV };

// 直接実行時のエントリポイント（認証済みCookieが必要）
if (require.main === module) {
  console.log('ℹ️  このスクリプトはOpenClawブラウザセッション経由で実行してください');
  console.log('   または sync-tasks.cmd を使用してください');
}
