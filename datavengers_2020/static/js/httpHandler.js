var http = (function () {
  //https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=MSFT&apikey=U8GE10LUUO67SB0P&outputsize=full
  var API_KEYS = ['TNG5WJGOPZ8TIOV3', 'U8GE10LUUO67SB0P', 'GCCOCWOD97HS7KZW', 'YVQTWARKU1FJ501D','N6XEAABRCX9K2WVQ'];

  var alphaBaseUrl = "https://www.alphavantage.co/query";
  var baseUrl = window.location.href;

  function random_api_key(){
    var ind = Math.floor(Math.random() * API_KEYS.length);
    return API_KEYS[ind];
  }

  function searchSymbolConfig(){
    return {
      language: {
        inputTooShort: function() {
          return 'Please enter name of stock';
        }
      },
      placeholder: {
         id: 'SPY',
         text: "SPDR S&P 500 ETF Trust"
      },
      ajax: {
        url: alphaBaseUrl,
        dataType: 'json',
        delay: 250,
        data: function(params) {
          var query = {
            function: "SYMBOL_SEARCH",
            keywords: params.term,
            apikey: random_api_key()
          }
          return query;
        },
        processResults: function(data, params) {
          // parse the results into the format expected by Select2
          var bestMatches = data["bestMatches"];

          return {
            results: $.map(bestMatches, function(item) {
              return {
                text: item["2. name"],
                id: item["1. symbol"]
              }
            })
          };
        },
        cache: true
      },
      minimumInputLength: 1
    }
  }

  function alphaConstructUrl(params){
    var url = alphaBaseUrl+"?";
    Object.keys(params).forEach(function(k){
      url += "&"+k+"="+params[k];
    });
    return url;
  }

  function constructUrl(query,params){
    var url = baseUrl+query;
    Object.keys(params).forEach(function(k,i){
      i==0 && (url+="?");
      url += "&"+k+"="+params[k];
    });
    return url;
  }

  function estDate(dateString){
    dateString = dateString.split("T")[0];
    var result = new Date(dateString); // utc date, a day before
    result.setDate(result.getDate() + 1);
    return result;
  }

  function alphaParseJsonData(rawData, dateRange){
    // "Time Series (Daily)": {
    //      "2020-03-10": {
    //          "1. open": "277.1400",
    //          "2. high": "281.8300",
    //          "3. low": "269.3700",
    //          "4. close": "275.1300",
    //          "5. adjusted close": "275.1300",
    //          "6. volume": "43963881",
    //          "7. dividend amount": "0.0000",
    //          "8. split coefficient": "1.0000"
    //      },
    //}
    var parsedData = [];
    var data = rawData["Time Series (Daily)"]
    var keyMap = {"1. open":"Open","2. high":"High","3. low":"Low","4. close":"Close","5. adjusted close":"Adj Close","6. volume":"Volume"};
    var allDates = Object.keys(data);
    allDates.forEach(function(d){
      var d1 = data[d];
      var d2 = {"Date":estDate(d)};
      Object.keys(keyMap).forEach(function(field){
        d2[keyMap[field]] = +d1[field];
      });
      if (d2.Date>=dateRange.startDate && d2.Date<=dateRange.endDate){
        parsedData.push(d2);
      }
    });
    return parsedData.sort(function(a,b){return a.Date - b.Date});
  }

  function parseJsonData(rawData, dateRange){
    // "prices": [
    //
    //     "adj_close": 211.091,
    //     "close": 213.04,
    //     "date": "2019-07-31T00:00:00Z",
    //     "high": 221.37,
    //     "low": 211.3,
    //     "open": 216.42,
    //     "volume": 69281361.0
    //   }]
    var data = rawData["prices"];
    var keyMap = {"date":"Date","open":"Open","high":"High","low":"Low","close":"Close","adj_close":"Adj Close","volume":"Volume"};
    return mapKeys(keyMap,data);
  }

  function parseTextData(data, dateRange){
    var parsedData = [];
    data.forEach(function(d){
      var keys = Object.keys(d);
      var d2 = {};
      keys.forEach(function(k){
        d2[k] = k==="Date" ? estDate(d[k]):+d[k];
      });
      if (d2.Date>=dateRange.startDate && d2.Date<=dateRange.endDate){
        parsedData.push(d2);
      }
    });
    return parsedData.sort(function(a,b){return a.Date - b.Date});
  }


  function alphaGetStockData(symbol,dateRange){
    console.log("getting data from alpha vantage for symbol "+symbol+" and date range:",dateRange.startDate.toISOString().split('T')[0],dateRange.endDate.toISOString().split('T')[0]);
    var params = {
      "function":"TIME_SERIES_DAILY_ADJUSTED",
      "outputsize":"full",
      "symbol":symbol,
      "apikey":random_api_key()
    };
    var url = alphaConstructUrl(params);

    return $.ajax({
     url: url,
     type: 'get',
     beforeSend: function(){
      $("#cover-spin").show();
     },
     complete:function(data){
      $("#cover-spin").hide();
     }
    })
    .then(function(data){
      return alphaParseJsonData(data,dateRange);
    });
  }

  function getStockData(symbol,dateRange){
    var start = dateRange.startDate.toISOString().split('T')[0];
    var end = dateRange.endDate.toISOString().split('T')[0];
    console.log("getting data from ws for symbol "+symbol+" and date range:",start,end);
    var params = {
      "ticker":symbol,
      "start_date":start,
      "end_date":end
    };
    var url = constructUrl("prices",params);

    return $.ajax({
     url: url,
     type: 'get',
     beforeSend: function(){
      $("#cover-spin").show();
     },
     complete:function(data){
      $("#cover-spin").hide();
     },
     statusCode: {
       500: function(){
         alert("Sorry, we've reached the quota of 5 calls/minute to Alpha Vantage server. Please wait 1 miniute to try again and make sure to select at most 4 indicators.");
       },
       503: function(){
         alert("Sorry, server is busy and was not able to complete your request within 30 seconds. Thank you for your patience and please try again later.");
       }
     }
    })
    .then(function(data){
      return parseJsonData(data,dateRange);
    });
  }

  function runSimulation(simParams){
    var payload = {
      symbols:[simParams.symbol],
      initialCondition:[simParams.initialCondition],
      trainingStartDate:simParams.trainingDateRange.startDate.toISOString().split('T')[0],
      trainingEndDate:simParams.trainingDateRange.endDate.toISOString().split('T')[0],
      testingStartDate:simParams.testingDateRange.startDate.toISOString().split('T')[0],
      testingEndDate:simParams.testingDateRange.endDate.toISOString().split('T')[0],
      indicators:Object.keys(simParams.indicators).map(function(k){
        var temp = simParams.indicators[k];
        temp.indicator = k.toLowerCase();
        return temp;
      }).filter(function(ind){return ind.on;}),
      algorithm:[simParams.algorithm]
    };
    console.log("run simulation with:",payload);
    // return alphaGetStockData(simParams.symbol,{startDate:simParams.trainingDateRange.startDate,endDate:simParams.testingDateRange.endDate})
    // .then(function(data){
    //   return mockSimulationData(data,simParams);
    // });
    return $.ajax({
     url: constructUrl("simulation",{}),
     type: 'POST',
     contentType: 'application/json',
     dataType: 'json',
     data:JSON.stringify(payload),
     beforeSend: function(){
      $("#cover-spin").show();
     },
     complete:function(data){
      $("#cover-spin").hide();
    },
    statusCode: {
      500: function(){
        alert("Sorry, we've reached the quota of 5 calls/minute to Alpha Vantage server. Please wait 1 miniute to try again and make sure to select at most 4 indicators.");
      },
      503: function(){
        alert("Sorry, server is busy and was not able to complete your request within 30 seconds. Thank you for your patience and please try again later.");
      }
    }
    })
    .then(function(data){
      console.log("sim raw data",data)
      return parseSimulationData(data);
    });
  }

  function mapKeys(keyMap,data){
    var parsedData = [];
    data.forEach(function(d){
      var d2 = {};
      Object.keys(keyMap).forEach(function(field){
        d2[keyMap[field]] = d[field];
      });
      d2.Date = estDate(d2.Date);
      parsedData.push(d2);
    });
    return parsedData.sort(function(a,b){return a.Date - b.Date});
  }

  function parseSimulationData(data){
    var keyMap = {"date":"Date","open":"Open","high":"High","low":"Low","close":"Close","adj_close":"Adj Close","volume":"Volume",
      "sma":"SMA","ema":"EMA","bb_bottom":"BB_BOTTOM","bb_top":"BB_TOP","percent_b":"%B","rsi":"RSI","cci":"CCI",
      "trade":"trade","holding":"holding","value":"value","cash":"cash"
    };
    return {train:mapKeys(keyMap,data.train),test:mapKeys(keyMap,data.test)};
  }

  function mockSimulationData(data,simParams){
    var trainData = [];
    var testData = [];
    data.forEach(function(d){
      if (d.Date < simParams.trainingDateRange.endDate){
        trainData.push(d);
      }
      else{
        testData.push(d);
      }
    });
    Object.keys(simParams.indicators).forEach(function(indicatorKey){
      if(simParams.indicators[indicatorKey].on){
        calc.calculateIndicator(indicatorKey,trainData,simParams.indicators);
        calc.calculateIndicator(indicatorKey,testData,simParams.indicators);
      }
    });
    trainData = calc.calculateBenchmark("mockSim", trainData, simParams.initialCondition);
    testData = calc.calculateBenchmark("mockSim", testData, simParams.initialCondition);
    return {train:trainData,test:testData};
  }

  return {
    "searchSymbolConfig":searchSymbolConfig,
    //"estDate":estDate,
    "getStockData":getStockData,
    "runSimulation":runSimulation
  }
}());
