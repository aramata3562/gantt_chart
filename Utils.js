/**
 * 値が無いか？
 * undefined, null, NaN, 0, 空白 かどうかを判定する
 * 
 * @param {value}
 * @return {boolean} true: 値無し, false: 値あり
 */
function isNoValue(value) {
  return (value == "" || value == 0 || value == null || Number.isNaN(value) || value === undefined);
}