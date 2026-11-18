/** Dedicated Survey A collector. Run setup() once before deploying as a web app. */
function setup(){
  var props=PropertiesService.getScriptProperties();
  if(props.getProperty('SURVEY_A_SHEET_ID'))throw new Error('Already configured; keep the existing sheet.');
  var ss=SpreadsheetApp.create('Music Healing Survey A — Responses');
  var sheet=ss.getSheets()[0];sheet.setName('Responses');
  sheet.appendRow(['id','received_at','submitted_at','language','schema','consent','age','gender','culture','status','listen_min','stress_frequency','stress_genre','purpose','genre_like','stress_week']);
  sheet.setFrozenRows(1);props.setProperty('SURVEY_A_SHEET_ID',ss.getId());
  console.log(ss.getUrl());
}
function doGet(){return json_({ok:true,service:'music-healing-survey-a/v1'});}
function doPost(e){
  var lock=LockService.getScriptLock();
  try{
    var raw=e&&e.parameter&&e.parameter.payload;if(!raw||raw.length>12000)throw new Error('Invalid payload');
    var data=JSON.parse(raw),a=data.answers||{};
    if(data.schema!=='music-healing-survey-a/v1'||data.consent!==true)throw new Error('Invalid consent or schema');
    if(!/^[0-9a-f-]{36}$/i.test(data.id||'')||!['vi','ko','en','zh'].includes(data.language)||!isFinite(Date.parse(data.submittedAt)))throw new Error('Invalid metadata');
    var enums={gender:['female','male','nonbinary','other','na'],culture:['vn','kr','mn','mm','np','other','na'],status:['student','work','both','other'],stress_frequency:['never','rarely','sometimes','often','always'],stress_genre:['pop','ballad','classical_piano','lofi_ambient','rock_metal','hiphop_rnb','traditional','other','none'],purpose:['destress','study_work','sleep','commute','entertain','other']};
    var required=['age','gender','culture','stress_frequency','stress_genre','stress_week'];
    required.forEach(function(k){if(a[k]===undefined||a[k]===null||a[k]==='')throw new Error('Missing '+k);});
    if(a.stress_genre!=='none'&&(a.genre_like===undefined||a.genre_like===null||a.genre_like===''))throw new Error('Missing genre_like');
    Object.keys(enums).forEach(function(k){if(a[k]!==undefined&&a[k]!==null&&a[k]!==''&&!enums[k].includes(a[k]))throw new Error('Invalid '+k);});
    var bounds={age:[18,120],listen_min:[0,1440],genre_like:[0,10],stress_week:[0,10]};
    Object.keys(bounds).forEach(function(k){var n=a[k];if(n!==undefined&&n!==null&&n!==''&&(!Number.isInteger(n)||n<bounds[k][0]||n>bounds[k][1]))throw new Error('Invalid '+k);});
    var sid=PropertiesService.getScriptProperties().getProperty('SURVEY_A_SHEET_ID');if(!sid)throw new Error('Collector is not configured');
    lock.waitLock(20000);var sheet=SpreadsheetApp.openById(sid).getSheetByName('Responses');
    if(sheet.getLastRow()>1&&sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(data.id).matchEntireCell(true).findNext())return json_({ok:true,id:data.id,duplicate:true});
    var keys=['age','gender','culture','status','listen_min','stress_frequency','stress_genre','purpose','genre_like','stress_week'];
    sheet.appendRow([data.id,new Date().toISOString(),data.submittedAt,data.language,data.schema,true].concat(keys.map(function(k){return a[k]===undefined||a[k]===null?'':a[k];})));
    return json_({ok:true,id:data.id});
  }catch(error){return json_({ok:false,error:String(error.message||error)});}finally{if(lock.hasLock())lock.releaseLock();}
}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
