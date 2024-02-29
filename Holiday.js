// (MITライセンス) by matsuoshi, monaural.net 
const API_URL = "https://holidays-jp.github.io/api/v1/date.json";

// 列番号
const COL_HOLIDAY_API = 1;
const COL_HOLIDAY_ADDITIONAL = 3;
// 行番号
const ROW_HOLIDAY_DATA = 3;

/**
 * 祝日クラス
 */
class Holiday {

  constructor() {
    // nothing
  }


  /**
   * 祝日の日付データをAPIで取得
   * APIデータを全削除後、取得した祝日をシートに反映する
   */
  getHolidayData() {
    Logger.log("call Holiday.init");

    let json = UrlFetchApp.fetch(API_URL).getContentText();
    let holidayData = JSON.parse(json);
    let holidayKeys = Object.keys(holidayData);
    let holidayValues = Object.values(holidayData);
    let holidayArray = [];
    for (let i = 0; i < holidayKeys.length; i++) {
      holidayArray.push([holidayKeys[i], holidayValues[i]]);
    }

    // 全削除
    SHEET_HOLIDAY.getRange(ROW_HOLIDAY_DATA, COL_HOLIDAY_API, SHEET_HOLIDAY.getLastRow(), 2).clearContent();
    // 取得した祝日をシートに反映
    SHEET_HOLIDAY.getRange(ROW_HOLIDAY_DATA, COL_HOLIDAY_API, holidayArray.length, 2).setValues(holidayArray);
  }


  /**
   * holidayシートから祝日を配列として取得する
   * 
   * @return {array} 祝日の配列
   */
  getArrray() {
    let apiRange = SHEET_HOLIDAY.getRange(ROW_HOLIDAY_DATA, COL_HOLIDAY_API, SHEET_HOLIDAY.getLastRow(), 1);
    let additionalRange = SHEET_HOLIDAY.getRange(ROW_HOLIDAY_DATA, COL_HOLIDAY_ADDITIONAL, SHEET_HOLIDAY.getLastRow(), 1);

    let apiHoliday = apiRange.getValues().filter(String).flat();
    let additionalHoliday = additionalRange.getValues().filter(String).flat();

    return apiHoliday.concat(additionalHoliday);
  }
}