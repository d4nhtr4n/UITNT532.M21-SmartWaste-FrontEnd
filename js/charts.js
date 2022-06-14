//console.log("Charts!");
var days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const getLast7Days = "http://localhost:3000/data/getLast10Days";
function initLineChart() {
  
  fetch(getLast7Days, {mode: 'cors'})
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    var chartLabes = data.map(function (data) {
      var date = new Date(data._id);
      return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth()}`;
    });

    var chartDatas = data.map(function (data) {
      return data.total;
    });

    new Chart(document.getElementById('day-chart'), {
      type: 'line',
      data: {
        labels: chartLabes,
        datasets: [{
          label: 'Số lần đầy',
          backgroundColor: "#B4FE9F",
          borderColor: "#00a651",
          pointHoverBackgroundColor: '#fff',
          borderWidth: 2,
          data: chartDatas,
          fill: true
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: {
              drawOnChartArea: false
            }
          },
          y: {
            ticks: {
              beginAtZero: true,
              maxTicksLimit: 5,
              stepSize: Math.ceil(250 / 5),
              max: 250
            }
          }
        },
        elements: {
          line: {
            tension: 0.4
          },
          point: {
            radius: 0,
            hitRadius: 10,
            hoverRadius: 4,
            hoverBorderWidth: 3
          }
        }
      }
    });
  }).catch(function (error) {//console.log('Request failed', error)
  });
}

const getDataStatistic = "http://localhost:3000/data/getDeviceStatistic";
function initPolarAreaChart(){
  chartColor = [];
  fetch(getDataStatistic, {
    mode: 'cors'
  })
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    var chartLabes = data.map(function (data) {
      return data.device[0].name;
    });
    
    chartLabes.forEach(function () {
      const randomColor = Math.floor(Math.random()*16777215).toString(16)
      chartColor.push(`#${randomColor}`)
    })
    
    var chartDatas = data.map(function (data) {
      return data.total;
    });
    
    new Chart(document.getElementById('device-chart'), {
      type: 'polarArea',
      data: {
        labels: chartLabes,
        datasets: [{
          data: chartDatas,
          backgroundColor: chartColor
        }]
      },
      options: {
        responsive: true
      }
    });
  })
  .catch(function (error) {//console.log('Request failed', error)
});
}

initLineChart();
initPolarAreaChart();
