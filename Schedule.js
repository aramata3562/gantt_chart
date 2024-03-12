// PJT開始日終了日位置
const POS_PJT_PERIOD = "M1:N1";

// 列番号 ここをきちんと整理をする。
const COL_ROW_NO = 1;
const COL_ID = 2;
const COL_ID_1 = 3;
const COL_ID_2 = 4;
const COL_ID_3 = 5;
const COL_ID_4 = 6;
const COL_TASK_MILESTONE = 7;
const COL_TASK_PARENT = 8;
const COL_TASK_CHILD = 9;
const COL_TASK_CHILD_SUB = 10;
// const COL_ASSIGN = 11;  これは使わない
// const COL_STATUS = 11;      
const COL_PROGRESS = 11;    // パーセントで管理をする
const COL_BOOL_PROGRESS = 12;  // true falseで行う
const COL_SDATE = 13;       //ここは変更なし
const COL_DEPEND_TASK = 14;     // 依存タスク
const COL_DATE_DIF = 15;        // 日付差分
const COL_EDATE = 16;
const COL_MEMO = 17;
const COL_CHART = 18;

// 列名（アルファベット１文字）
const COL_A1_PROGRESS = "K"; 
const COL_A1_SDATE = "M";   
const COL_A1_EDATE = "P";

// 行番号
const ROW_TASK_DATA = 4;

// 祝日の表示文字
const HOLIDAY_SYMBOL = "休";

// 月数と曜日の配列
const ARRAY_MONTH = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const ARRAY_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * スケジュールクラス
 */
class Schedule {

  constructor() {
    // PJT開始、終了日のセル値
    let pjtDates = SHEET_SCHEDULE.getRange(POS_PJT_PERIOD).getValues()[0];

    // 本日
    this.today = dayjs().startOf("day");
    // PJT開始日
    this.pjtSDate = dayjs(pjtDates[0]).startOf("day");
    this.pjtSWeekDate = getWeekDate(this.pjtSDate);
    // PJT終了日
    this.pjtEDate = dayjs(pjtDates[1]).startOf("day");
    this.pjtEWeekDate = getWeekDate(this.pjtEDate);
    // PJTの間隔
    this.dayDuration = this.pjtEDate.diff(this.pjtSDate, "day") + 1;
    this.weekDuration = (this.pjtEWeekDate.diff(this.pjtSWeekDate, "day") / 7) + 1;

    // イナズマ用のポジション
    this.todayPos = this.today.diff(this.pjtSDate, "day");
    this.todayWeekPos = getWeekDate(this.today).diff(this.pjtSWeekDate, "day") / 7;

    // 本日は開始日前の場合は、初日とする
    this.todayPos = this.todayPos < 0 ? 0 : this.todayPos;
    this.todayWeekPos = this.todayWeekPos < 0 ? 0 : this.todayWeekPos;
  }


  /**
   * PJT期間が正しく入力されているか
   */
  isValidPeriod() {
    Logger.log("call Schedule.isValidPeriod");
    if (dayjs.isDayjs(this.pjtSDate) && dayjs.isDayjs(this.pjtEDate)) {
      if (this.pjtSDate <= this.pjtEDate) {
        return true;
      }
    }
    return false;
  }


  /**
   * 初期処理
   * 
   * 各タスクの開始日と終了日に、入力規則と入力形式を設定する
   */
  setDataValidation() {
    Logger.log("call Schedule.setDataValidation");

    // 開始日と終了日に、PJT期間内の日付の入力規則を設定する
    let rule = SpreadsheetApp.newDataValidation().requireDateBetween(this.pjtSDate.toDate(), this.pjtEDate.toDate()).build();
    SHEET_SCHEDULE.getRange(4, COL_SDATE, SHEET_SCHEDULE.getLastRow(), 2).setDataValidation(rule);
  }


  /**
   * Day chart を作成する
   */
  makeDayChart(holidayArray) {
    Logger.log("call Schedule.makeDayChart");

    // Arrayformulaを削除
    SHEET_DAY_CHART.getRange("A1").clearContent();
    // ガントチャート初期化
    if (SHEET_SCHEDULE.getMaxColumns() > COL_CHART) {
      SHEET_SCHEDULE.deleteColumns(COL_CHART + 1, SHEET_SCHEDULE.getMaxColumns() - COL_CHART);
    }
    if (SHEET_DAY_CHART.getMaxColumns() > COL_CHART) {
      SHEET_DAY_CHART.deleteColumns(COL_CHART + 1, SHEET_DAY_CHART.getMaxColumns() - COL_CHART);
    }
    SHEET_SCHEDULE.insertColumnsAfter(COL_CHART, this.dayDuration - 1);
    SHEET_DAY_CHART.insertColumnsAfter(COL_CHART, this.dayDuration - 1);

    // 月、日、曜日を配列にセット
    let months = [];
    let days = [];
    let weeks = [];
    for (let i = 0; i < this.dayDuration; i++) {
      let day = this.pjtSDate.add(i, "day");
      months.push(ARRAY_MONTH[day.month()]);
      days.push(day.format("DD"));
      weeks.push(ARRAY_WEEK[day.day()]);
    }

    // 日配列に祝日をセット
    for (let holiday of holidayArray) {
      let day = dayjs(holiday).startOf("day");
      let headDiff = day.diff(this.pjtSDate, "day");
      let tailDiff = this.pjtEDate.diff(day, "day");
      if (headDiff >= 0 && tailDiff >= 0) {
        days[headDiff] = HOLIDAY_SYMBOL;
      }
    }

    // シートに反映
    SHEET_SCHEDULE.getRange(1, COL_CHART, 3, this.dayDuration).setValues([months, weeks, days]);

    // 同月のセルを結合
    months.push("end");
    let mergeStartColumn = COL_CHART;
    let mergeColNum = 1;
    for (let i = 0; i < months.length - 1; i++) {
      let month = months[i];
      let nextMonth = months[i + 1];
      if (month == nextMonth) {
        mergeColNum++;
      } else {
        SHEET_SCHEDULE.getRange(1, mergeStartColumn, 1, mergeColNum).merge();
        SHEET_DAY_CHART.getRange(1, mergeStartColumn, 1, mergeColNum).merge();
        mergeStartColumn = mergeStartColumn + mergeColNum;
        mergeColNum = 1;
      }
    }

    // Day chart から scheduleを参照
    let lastColumnA1Noption = getColA1Notion(SHEET_SCHEDULE.getMaxColumns());
    SHEET_DAY_CHART.getRange("A1").setFormula(`=ARRAYFORMULA(schedule!A1:${lastColumnA1Noption})`);
  }


  /**
   * Week chart を作成する
   */
  makeWeekChart() {
    Logger.log("call Schedule.makeWeekChart");

    // Arrayformulaを削除
    SHEET_WEEK_CHART.getRange("A1").clearContent();
    // ガントチャート初期化
    if (SHEET_WEEK_CHART.getMaxColumns() > COL_CHART) {
      SHEET_WEEK_CHART.deleteColumns(COL_CHART + 1, SHEET_WEEK_CHART.getMaxColumns() - COL_CHART);
    }
    SHEET_WEEK_CHART.insertColumnsAfter(COL_CHART, this.weekDuration - 1);

    // 月、日、週番号を配列にセット
    let months = [];
    let days = [];
    let weekNums = [];
    for (let i = 0; i < this.weekDuration; i++) {
      let day = this.pjtSWeekDate.add(i * 7, "day");
      months.push(ARRAY_MONTH[day.month()]);
      days.push(day.format("DD"));
      let weekNumOfMonth = Math.ceil(day.date() / 7);
      weekNums.push(weekNumOfMonth + "w");
    }

    // シートに反映
    SHEET_WEEK_CHART.getRange(1, COL_CHART, 3, this.weekDuration).setValues([months, days, weekNums]);

    // 同月のセルを結合
    months.push("end");
    let mergeStartColumn = COL_CHART;
    let mergeColNum = 1;
    for (let i = 0; i < months.length - 1; i++) {
      let month = months[i];
      let nextMonth = months[i + 1];
      if (month == nextMonth) {
        mergeColNum++;
      } else {
        SHEET_WEEK_CHART.getRange(1, mergeStartColumn, 1, mergeColNum).merge();
        mergeStartColumn = mergeStartColumn + mergeColNum;
        mergeColNum = 1;
      }
    }

    // Week chart から scheduleを参照
    let refsA1Noption = getColA1Notion(COL_CHART - 1);
    SHEET_WEEK_CHART.getRange("A1").setFormula(`=ARRAYFORMULA(schedule!A1:${refsA1Noption})`);
  }


  /**
   * タスク情報を一括で矢羽に反映する
   */
  applyTaskBulk() {
    let scheduleValues = SHEET_SCHEDULE.getRange(ROW_TASK_DATA, 1, SHEET_SCHEDULE.getLastRow() - (ROW_TASK_DATA - 1), COL_EDATE).getValues();
    for (let taskValues of scheduleValues) {
      this.applyTask(taskValues);
    }
  }

  /**
   * タスク情報を矢羽に反映する
   */
  applyTask(taskValues) {
    let task = new Task(this, taskValues);
    task.calculate();
    // 矢羽描画
    SHEET_SCHEDULE.getRange(task.rowNo, COL_CHART, 1, this.dayDuration).setValues([task.dayChart]);
    SHEET_WEEK_CHART.getRange(task.rowNo, COL_CHART, 1, this.weekDuration).setValues([task.weekChart]);
    // ステータスと進捗率
    SHEET_SCHEDULE.getRange(task.rowNo, COL_STATUS, 1, 1).setValues([[task.status]]);
  }


  /**
   * 親タスクに計算式をセットする
   * 
   * - 子タスクの最小日付を開始日、最大日付を終了日にする
   * - 進捗は、子タスクの進捗を按分して算出する
   */
  setFormulaToParentTask() {
    // タスク階層構造の生成
    let scheduleValues = SHEET_SCHEDULE.getRange(ROW_TASK_DATA, 1, SHEET_SCHEDULE.getLastRow() - (ROW_TASK_DATA - 1), COL_EDATE).getValues();
    let rootTask = new Task(this, []);
    let previousTask = rootTask;
    for (let taskValues of scheduleValues) {
      let task = new Task(this, taskValues);
      if (task.isValid()) {
        if (previousTask.level < task.level) {
          // 下位レベルタスク、子タスクとしてセットする
          previousTask.addChildTask(task);
        } else if (previousTask.level == task.level) {
          // 同レベルタスク、親タスクを取得し、子タスクとしてセットする
          previousTask.parent.addChildTask(task);
        } else {
          // 上位レベルタスク
          if ((previousTask.level - 1) == task.level) {
            // ２つ上の親タスクを取得し、子タスクとしてセットする
            previousTask.parent.parent.addChildTask(task);
          } else if ((previousTask.level - 2) == task.level) {
            // ３つ上の親タスクを取得し、子タスクとしてセットする
            previousTask.parent.parent.parent.addChildTask(task);
          } else if ((previousTask.level - 3) == task.level) {
            // ４つ上の親タスクを取得し、子タスクとしてセットする
            previousTask.parent.parent.parent.parent.addChildTask(task);
          }
        }
        previousTask = task;
      }
    }

    //　タスク構造を利用して、算出式をセットする
    this.setFormulaToTask(rootTask);
  }


  /**
   * 親タスクは、子タスクの進捗率と開始日、終了日からの算出式をセットする
   */
  setFormulaToTask(task) {
    if (task.COL_BOOL_PROGRESS == true){
      task.progress = 1
    }
    if (task.hasChildTask()) {
      let rows = [];
      for (let childTask of task.childs) {
        rows.push(childTask.rowNo);
        // 再帰的に子タスクを処理する
        this.setFormulaToTask(childTask);
      }
      // rootTaskは除外
      if (task.parent != null) {
        let formulaAverage = `average(${getColA1JoinString(COL_A1_PROGRESS, rows)})`;
        SHEET_SCHEDULE.getRange(task.rowNo, COL_PROGRESS).setFormula(`=iferror(${formulaAverage},"")`);
        let formulaMin = `min(${getColA1JoinString(COL_A1_SDATE, rows)})`;
        SHEET_SCHEDULE.getRange(task.rowNo, COL_SDATE).setFormula(`=if(${formulaMin}>0,${formulaMin},"")`);
        let formulaMax = `max(${getColA1JoinString(COL_A1_EDATE, rows)})`;
        SHEET_SCHEDULE.getRange(task.rowNo, COL_EDATE).setFormula(`=if(${formulaMax}>0,${formulaMax},"")`);
      }
    }
  }


  /**
   * ガントチャートの日付のうち、本日の日付の背景色を黄色にする
   */
  markTodayOnChart() {
    Logger.log("call Schedule.markTodayOnChart");
    // 背景色リセット
    SHEET_SCHEDULE.getRange(2, COL_CHART, 2, this.dayDuration).setBackground(null);
    SHEET_DAY_CHART.getRange(2, COL_CHART, 2, this.dayDuration).setBackground(null);
    SHEET_WEEK_CHART.getRange(2, COL_CHART, 2, this.weekDuration).setBackground(null);
    if (this.dayDuration > this.todayPos) {
      // 本日の位置の背景色を黄色にする
      SHEET_SCHEDULE.getRange(2, COL_CHART + this.todayPos, 2, 1).setBackground("yellow");
      SHEET_DAY_CHART.getRange(2, COL_CHART + this.todayPos, 2, 1).setBackground("yellow");
      SHEET_WEEK_CHART.getRange(2, COL_CHART + this.todayWeekPos, 2, 1).setBackground("yellow");
    }
  }
}