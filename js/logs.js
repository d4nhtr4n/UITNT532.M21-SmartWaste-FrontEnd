//console.log("Logs!");
var btn_next = document.getElementById("btn_next");
var btn_prev = document.getElementById("btn_prev");
var page_current = document.getElementById("current-page");
var btn_refresh = document.getElementById("btn_refresh");
var btn_export = document.getElementById("btn_export");
var btn_search = document.getElementById("btn_search");
 // api url 
 const getLogsCount = "http://localhost:3000/data/getLogsCount";
 const getLogs = "http://localhost:3000/data/getLogs/";
 const getAllLogs = "http://localhost:3000/data/getAllLogs";

const table = document.getElementById('logsTable');
var logsCount = 0;
var current_page = 1;
var obj_per_page = 15; //console.log(table);

function totNumPages() {
  return Math.ceil(logsCount / obj_per_page);
}

function prevPage() {
  if (current_page > 1) {
    current_page--;
    const tableBody = table.tBodies;
    if (tableBody[0]) tableBody[0].remove();
    table.appendChild(document.createElement('tbody'));
    change(current_page);
  }
}

function nextPage() {
  if (current_page < totNumPages()) {
    current_page++;
    const tableBody = table.tBodies;
    if (tableBody[0]) tableBody[0].remove();
    table.appendChild(document.createElement('tbody'));
    change(current_page);
  }
}

btn_next.onclick = function () {
  ////console.log('next');
  nextPage();
};

btn_prev.onclick = function () {
  ////console.log('prev');
  prevPage();
};

function change(page) {
  if (page < 1) page = 1;
  if (page > totNumPages()) page = totNumPages();

  getDeviceData(page);

  page_current.innerText = page;

  if (page == 1) {
    btn_prev.style.visibility = "hidden";
  } else {
    btn_prev.style.visibility = "visible";
  }

  if (page == totNumPages()) {
    btn_next.style.visibility = "hidden";
  } else {
    btn_next.style.visibility = "visible";
  }
}

fetch(getLogsCount, {mode: 'cors'})
.then(function (response) {
  return response.json();
})
.then(function (data) {
  logsCount = data[0].total;
  change(1);
}).catch(function (error) {
});

btn_refresh.onclick = function () {
  const tableBody = table.tBodies;
  if (tableBody[0]) tableBody[0].remove();
  table.appendChild(document.createElement('tbody'));
  change(current_page);
};

btn_export.onclick = function () {
  exportData();
};

async function getDeviceData(page) {
  const getLogsResult = await fetch(getLogs + page, {mode: 'cors'})
  .then(function (response) {
    return response.json();
  })
  .catch(function (error) {
    
  });
  getLogsResult.reverse();
  getLogsResult.forEach(function (log) {
    var record = [];
    record.push(log.device[0]._id);
    record.push(log.device[0].name);
    record.push(log.device[0].address.latitude+":"+log.device[0].address.longitude);
    record.push(log.message);
    record.push(log.timestamp);
    insertRow(record);
  })
}

function insertRow(data, index) {
  const tableBody = table.tBodies;
  var row = tableBody[0].insertRow(0);
  var cell0 = row.insertCell(0);
  var cell1 = row.insertCell(1);
  var cell2 = row.insertCell(2);
  var cell3 = row.insertCell(3);
  var cell4 = row.insertCell(4);
  cell0.innerHTML = data[0].toString();
  cell1.innerHTML = data[1].toString();
  cell2.innerHTML = data[2].toString();
  cell3.innerHTML = data[3].toString();
  var logDate = new Date(data[4]);
  cell4.innerHTML = `${logDate.getHours()}:${logDate.getMinutes()} ${logDate.getDate()}/${logDate.getMonth()+1}/${logDate.getFullYear()}`;
}

async function exportData() {
  const getLogsResult = await fetch(getAllLogs, {mode: 'cors'})
  .then(function (response) {
    return response.json();
  })
  .catch(function (error) {
    
  });
  const logDatas = [['ID Thiết bị', 'Tên thiết bị', 'Tọa độ GPS', 'Trạng thái', 'Thời gian']];
  getLogsResult.forEach(function (log) {
    var record = [];
    record.push(log.device[0]._id);
    record.push(log.device[0].name);
    record.push(log.device[0].address.latitude+":"+log.device[0].address.longitude);
    record.push(log.message);
    record.push(log.timestamp);
    logDatas.push(record.concat());
  })

  let csvContent = "data:text/csv;charset=utf-8,";
  logDatas.forEach(function (rowArray) {
    let row = rowArray.join(",");
    csvContent += row + "\r\n";
  });
  var encodedUri = encodeURI(csvContent);
  var link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "my_logs.csv");
  document.body.appendChild(link);

  link.click();
}
//# sourceMappingURL=my-logs.js.map