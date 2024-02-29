/**
 * 起点日（直前の月曜）を取得する
 * 
 * @param {dayjs} 任意の日付
 * @return {dayjs} 起点日
 */
function getWeekDate(date) {
  // 曜日値を取得（日曜は7とする）
  let weekNum = date.day();
  weekNum = (weekNum == 0) ? 7 : weekNum;
  // 直前の月曜日を算出する
  let weekDate = date.add(1 - weekNum, "day");
  return weekDate;
}
