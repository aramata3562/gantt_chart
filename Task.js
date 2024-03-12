// タスクのステータス
/** 
const StausType = {
  None: "",
  New: "未着手",
  New_Delay: "未着手(遅延)",
  WIP: "実施中",
  WIP_Delay: "実施中(遅延)",
  Done: "完了",
};
*/

// 遅延判定日数（下記日数を超えた場合に遅延となる）
const DELAY_DAYS = 3;

/**
 * タスク
 */
class Task {

  constructor(schedule, taskValues) {

    this.schedule = schedule;

    // タスク
    this.rowNo = taskValues[COL_ROW_NO - 1];
    this.id = taskValues[COL_ID - 1];
    this.idArray = [];
    this.idArray.push(taskValues[COL_ID_1 - 1]);
    this.idArray.push(taskValues[COL_ID_2 - 1]);
    this.idArray.push(taskValues[COL_ID_3 - 1]);
    this.idArray.push(taskValues[COL_ID_4 - 1]);
    this.level = this.getLevel();
    // this.assignee = taskValues[COL_ASSIGN - 1];
    // this.status = taskValues[COL_STATUS - 1];
    this.progress = taskValues[COL_PROGRESS - 1]; // %のところ
    this.boolProgress = taskValues[COL_BOOL_PROGRESS - 1];  // true false
    this.sDate = dayjs(taskValues[COL_SDATE - 1]).startOf("day");
    this.eDate = dayjs(taskValues[COL_EDATE - 1]).startOf("day");

    // チャート
    this.dayChart = Array(this.schedule.dayDuration);
    this.dayChart.fill("");
    this.weekChart = Array(this.schedule.weekDuration);
    this.weekChart.fill("");

    // 関連タスク
    this.parent = null;
    this.childs = [];

  }


  /**
   * 有効な進捗の値を取得する
   * 
   * (0 <= progress <= 1 以外は 0 を返す)
   * 
   * @return {number} 無効な値の場合は、0 を返す
   */
  getProgressValidValue() {
    let value = Number(this.progress);
    if (isNoValue(value) || value < 0 || 1 < value) {
      return 0;
    } else {
      return value;
    }
  }


  /**
   * 有効なタスクか
   * ※IDが付与されてるか
   * 
   * @return {boolean} true: 有効、false: 無効
   */
  isValid() {
    if (isNoValue(this.id)) {
      return false;
    } else {
      return true;
    }
  }


  /**
   * 有効な期間のタスクか
   * ※開始日と終了日がPJT範囲内か
   * 
   * @return {boolean} true: 有効、false: 無効
   */
  isValidPeriod() {
    if (
      (this.isValid())
      && (this.sDate.isValid() && this.eDate.isValid())
      && (this.sDate <= this.eDate)
      && (this.schedule.pjtSDate <= this.sDate && this.eDate <= this.schedule.pjtEDate)
    ) {
      return true;
    } else {
      return false;
    }
  }


  /**
   * タスクの階層レベルを取得する
   * 
   * @return {number} 階層レベル（1-4）
   */
  getLevel() {
    if (this.idArray[3] > 0) {
      return 4;
    } else if (this.idArray[2] > 0) {
      return 3;
    } else if (this.idArray[1] > 0) {
      return 2;
    } else if (this.idArray[0] > 0) {
      return 1;
    } else {
      return 0;
    }
  }


  /**
   * 子タスクを保持しているか
   * 
   * @return {boolean} true: 子タスクあり、false: 子タスクなし
   */
  hasChildTask() {
    return (this.childs.length > 0);
  }


  /**
   * 親タスクをセットする
   * 
   * @param {object} 親タスク
   */
  setParent(task) {
    this.parent = task;
  }


  /**
   * 子タスクをセットする
   * ※複数追加可能
   * 
   * @param {object} 子タスク
   */
  addChildTask(task) {
    this.childs.push(task);
    task.setParent(this);
  }


  /**
   * タスクの状態を計算する
   */
  calculate() {
    Logger.log("call Task.calculate");

    // 無効タスクの場合
    if (!this.isValidPeriod()) {
      // ステータスクリア
      //this.status = StausType.None;
      // 本日にイナズママーク
      this.dayChart.fill(">", this.schedule.todayPos, this.schedule.todayPos + 1);
      this.weekChart.fill(">", this.schedule.todayWeekPos, this.schedule.todayWeekPos + 1);
      return;
    }

    // 進捗率
    this.progress = this.getProgressValidValue();

    // 日ベースの矢羽
    let sDayPos = this.sDate.diff(this.schedule.pjtSDate, "day");
    let dayOffset = this.eDate.diff(this.sDate, "day");
    let eDayPos = sDayPos + 1 + dayOffset;
    this.dayChart.fill("-", sDayPos, eDayPos);

    // 日ベースの進捗
    let progressDayPos = sDayPos + Math.floor((1 + dayOffset) * this.progress);
    this.dayChart.fill("'=", sDayPos, progressDayPos);

    // 週ベースの日付
    let sWeekDate = getWeekDate(this.sDate);
    let eWeekDate = getWeekDate(this.eDate);

    // 週ベースの矢羽
    let sWeekPos = sWeekDate.diff(this.schedule.pjtSWeekDate, "day") / 7;
    let weekOffset = eWeekDate.diff(sWeekDate, "day") / 7;
    let eWeekPos = sWeekPos + 1 + weekOffset
    this.weekChart.fill("-", sWeekPos, eWeekPos);

    // 週ベースの進捗
    let progressWeekPos = sWeekPos + Math.floor((1 + weekOffset) * this.progress);
    this.weekChart.fill("'=", sWeekPos, progressWeekPos);

    // イナズマ線
    progressDayPos = sDayPos + Math.ceil((1 + dayOffset) * this.progress);
    progressWeekPos = sWeekPos + Math.ceil((1 + weekOffset) * this.progress);

    if (this.progress == 0) {
      if (this.schedule.today < this.sDate) {
        // 未来の未着手タスク、本日にイナズママーク
        // this.status = StausType.New;
        this.dayChart.fill(">", this.schedule.todayPos, this.schedule.todayPos + 1);
        this.weekChart.fill(">", this.schedule.todayWeekPos, this.schedule.todayWeekPos + 1);
      } else {
        // 遅延の未着手タスク、タスク開始日にイナズママーク
        // this.status = StausType.New_Delay;
        this.dayChart.fill(">", sDayPos, sDayPos + 1);
        this.weekChart.fill(">", sWeekPos, sWeekPos + 1);
      }
    } else if (this.progress == 1) {
      if (this.eDate <= this.schedule.today) {
        // 過去の完了タスク、本日にイナズママーク
        // this.status = StausType.Done;
        this.dayChart.fill(">", this.schedule.todayPos, this.schedule.todayPos + 1);
        this.weekChart.fill(">", this.schedule.todayWeekPos, this.schedule.todayWeekPos + 1);
      } else {
        // 未来の完了タスク、タスク終了日にイナズママーク
        // this.status = StausType.Done;
        this.dayChart.fill(">", progressDayPos - 1, progressDayPos);
        this.weekChart.fill(">", progressWeekPos - 1, progressWeekPos);
      }
    } else {
      if ((this.schedule.todayPos - progressDayPos) > DELAY_DAYS) {
        // 遅延の実施中タスク
        // this.status = StausType.WIP_Delay;
      } else {
        // 実施中タスク
        // this.status = StausType.WIP;
      }
      this.dayChart.fill(">", progressDayPos - 1, progressDayPos);
      this.weekChart.fill(">", progressWeekPos - 1, progressWeekPos);
    }
  }
}