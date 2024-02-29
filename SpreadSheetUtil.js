/**
 * 列番号からA1形式の列名取得
 */
function getColA1Notion(colmun) {
  let range = SHEET_SCHEDULE.getRange(1, colmun);
  return range.getA1Notation().replace(/\d/,'');
}

/**
 * A1形式のセルをカンマ区切り文字で取得する
 */
function getColA1JoinString(colA1, rows) {
  let tempArray = [];
  for (let row of rows) {
    tempArray.push(colA1+row);
  }
  return tempArray.join(", ");
}