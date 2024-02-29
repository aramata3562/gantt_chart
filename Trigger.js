/**
 * 指定日時トリガーをセットします。
 * ※すでにセットされている場合は上書きします。
 * 
 * @param {string} トリガー時に実行する関数名
 * @param {dayjs} 実行する日時（分単位）
 */
function setTimeBasedTrigger(handlerFuncName, date) {
  Logger.log("call Trigger.setTimeBasedTrigger: " + handlerFuncName);
  deleteTrigger(ScriptApp.TriggerSource.CLOCK, handlerFuncName);
  ScriptApp.newTrigger(handlerFuncName).timeBased().at(date.toDate()).create();
}


/**
 * 毎日指定時刻トリガーをセットします。
 * ※すでにセットされている場合は上書きします。
 * 
 * @param {string} トリガー時に実行する関数名
 * @param {number} 毎日実行する時間（24時間指定）
 */
function setEveryDayTrigger(handlerFuncName, atHour) {
  Logger.log("call Trigger.setEveryDayTrigger: " + handlerFuncName);
  deleteTrigger(ScriptApp.TriggerSource.CLOCK, handlerFuncName);
  ScriptApp.newTrigger(handlerFuncName).timeBased().atHour(atHour).everyDays(1).create();
}


/**
 * スプレッドシートからの編集時トリガーをセットします。
 * ※すでにセットされている場合は上書きします。
 * 
 * @param {object} 対象のスプレッドシートオブジェクト
 * @param {string} トリガー時に実行する関数名
 */
function setForSpreadsheetOnEditTrigger(gss, handlerFuncName) {
  Logger.log("call Trigger.setForSpreadsheetOnEditTrigger: " + handlerFuncName);
  deleteTrigger(ScriptApp.TriggerSource.SPREADSHEETS, handlerFuncName);
  ScriptApp.newTrigger(handlerFuncName).forSpreadsheet(gss).onEdit().create();
}


/**
 * トリガーを削除します。
 * ソースと関数名が一致するトリガーのみ削除します。
 * 
 * @param {string} トリガーのイベントソース名
 * @param {string} トリガー時に実行する関数名
 */
function deleteTrigger(triggerSource, handlerFuncName) {
  Logger.log("call Trigger.deleteTrigger: " + handlerFuncName);
  let triggers = ScriptApp.getProjectTriggers();
  for(const trigger of triggers){
    if(trigger.getHandlerFunction() == handlerFuncName && trigger.getTriggerSource() == triggerSource){
      ScriptApp.deleteTrigger(trigger);
    }
  }
}
