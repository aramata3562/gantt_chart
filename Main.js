// Dayjs
const dayjs = Dayjs.dayjs;
// dayjsのフォーマット形式
const FORMAT = "YYYY/MM/DD";

// GSS
const GSS = SpreadsheetApp.getActiveSpreadsheet();

// シート
const SHEET_SCHEDULE = GSS.getSheetByName("Schedule");
const SHEET_DAY_CHART = GSS.getSheetByName("Day chart");
const SHEET_WEEK_CHART = GSS.getSheetByName("Week chart");
const SHEET_HOLIDAY = GSS.getSheetByName("Holiday");


/**
 * メニューに「ガントチャート」を表示する
 * ※シートを開いたときに実行
 */
function onOpen() {
  Logger.log("call Main.onOpen");

  // Uiクラスからメニューを作成する
  let ui = SpreadsheetApp.getUi();
  let menu = ui.createMenu('ガントチャート');

  // メニューにアイテムを追加する
  menu.addItem('PJT期間作成', 'onClickPJTPeriod');
  menu.addItem('祝日アップデート', 'onClickHoliday');

  // メニューをUiクラスに追加する
  menu.addToUi();

  // 本日にマークをつける
  let schedule = new Schedule();
  schedule.markTodayOnChart();
}


/**
 * 祝日の日付をAPIから取得する
 * ※メニュー > ガントチャート > 祝日アップデート
 */
function onClickHoliday() {
  Logger.log("call Main.onClickHoliday");
  let holiday = new Holiday();
  holiday.getHolidayData();
}


/**
 * PJT期間のガントチャート生成
 * ※メニュー > ガントチャート > PJT期間作成
 */
function onClickPJTPeriod() {
  Logger.log("call Main.onClickPJTPeriod");

  let schedule = new Schedule();

  // PJT期間入力チェック
  if (!schedule.isValidPeriod()) {
    Browser.msgBox("Projectの開始日と終了日が正しく入力されていません。");
    return;
  }

  // 初期処理
  schedule.setDataValidation();
  // ガントチャートを作成する
  let holidayArray = new Holiday().getArrray();
  schedule.makeDayChart(holidayArray);
  schedule.makeWeekChart();

  // 矢羽を描画する
  schedule.setFormulaToParentTask();
  schedule.applyTaskBulk();

  // 本日にマークをつける
  schedule.markTodayOnChart();

  // 日付更新時の処理を毎日実行するトリガーをセットする
  setEveryDayTrigger("dateUpdatingByTrigger", 0,);
  // 編集時トリガーをセットする（シンプルトリガーは権限が低いため、明示的にトリガーをセットする）
  setForSpreadsheetOnEditTrigger(GSS, "onEditCell");

}


/**
 * 日付更新時の処理
 * - 本日にマークをつける
 * - タスク情報を一括で適用する
 */
function dateUpdatingByTrigger() {
  Logger.log("call Main.dateUpdatingByTrigger");

  // 矢羽を描画する
  let schedule = new Schedule();
  schedule.setFormulaToParentTask();
  schedule.applyTaskBulk();

  // 本日にマークをつける
  schedule.markTodayOnChart();
}


/**
 * 開始予定日、終了予定を矢羽に反映させる
 * ※セル編集後に実行
 */
function onEditCell(e) {
  Logger.log("call Main.onEdit");

  // 編集対象のシートチェック
  if (e.source.getSheetName() != SHEET_SCHEDULE.getSheetName()) {
    return;
  }

  // 編集対象のセルチェック
  let cell = e.range;
  let condition = [COL_PROGRESS, COL_SDATE, COL_EDATE];
  if (condition.includes(cell.getColumn()) && cell.getRow() >= ROW_TASK_DATA) {
    let schedule = new Schedule();
    let taskValues = SHEET_SCHEDULE.getRange(cell.getRow(), 1, 1, COL_EDATE).getValues()[0];
    schedule.applyTask(taskValues);
    // 編集１分後にトリガーでタスク状況を反映する（親タスク更新のため）
    let dateTime = dayjs();
    dateTime = dateTime.minute(dateTime.minute() + 1);
    setTimeBasedTrigger("applyTaskBulkByTrigger", dateTime);
  }
}


/**
 * 各タスク情報を一括で適用する
 */
function applyTaskBulkByTrigger() {
  Logger.log("call Main.applyTaskBulkByTrigger");

  // 矢羽を描画する
  let schedule = new Schedule();
  schedule.setFormulaToParentTask();
  schedule.applyTaskBulk();
}