function onEdit(e) {
  // シート名を定義
  var sheetName1 = "Schedule";
  var sheetName2 = "test";

  // 編集されたシートの情報を取得
  var editedSheet = e.source.getActiveSheet();
  var editedSheetName = editedSheet.getName();

  // 編集されたシートに応じて同期処理を実行
  if (editedSheetName == sheetName1) {
    syncSheet(sheetName1, sheetName2);
  } else if (editedSheetName == sheetName2) {
    syncSheet(sheetName2, sheetName1);
  }
}

function syncSheet(sourceSheetName, targetSheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName(sourceSheetName);
  var targetSheet = ss.getSheetByName(targetSheetName);

  // データを取得してコピー
  var data = sourceSheet.getDataRange().getValues();
  targetSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}
