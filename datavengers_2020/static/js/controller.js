var symbol = "";
var dateRange = {};
var data = {};
var policyReturnData = {};
var performanceStats = {};


var indicatorKeys = ["SMA","EMA","BB","RSI","CCI"]; // these are actual indicators, "candle" is not
var indicatorParams = {
  "candle":{ // treat candlestick chart as an indicator for simplicity
    "on":true,"key":"candle",
    "chartLocation":"#candle-stick-div",
    "chartHeight":250,
    "rules":[],
  },
  "sim":{
    "key":"sim",
    "rules":[],
    "chartLocation":"#sim-div",
    "chartHeight":300,
    "showTrainOrTest":"test",
    "algorithmOptions":[{id:"RF",name:"Random Forest"},{id:"Q-learner",name:"Q-Learner"}],
    "algorithm":"RF",
    "indicators":{"SMA":{"on":true,windowSize:20},"EMA":{"on":false,windowSize:20},"BB":{"on":true,windowSize:20,bandwidth:2},"RSI":{"on":true,windowSize:20},"CCI":{"on":true,windowSize:20}}, // which indicator to include, its window size
    "trainingDateRange":{}, // should predate testing date range
    "testingDateRange":{}, // same as main data date range for comparison
    "trainingMonths":9, // default for heroku
    "symbol":"", // same as main data symbol
    "initialCondition":{"cash":0,"share":0} // same as main data
  },
  "SMA":{
    "fullName":"Simple Moving Average",
    "on":true, "key":"SMA","windowSize":20,
    "chartLocation":"#sma-div",
    "chartHeight":300,
    "rules":[{"action":1, "field":"SMAP","relation":">", "trend":1, "threshold":1.05,"thresholdRelativeTo":"","min":1.01,"max":1.2,"step":0.01,"tip":"Price/SMA ratio crosses threshold upward triggers buying."},
            {"action":-1, "field":"SMAP","relation":"<","trend":-1, "threshold":0.95,"thresholdRelativeTo":"","min":0.8,"max":0.99,"step":0.01,"tip":"Price/SMA ratio crosses threshold downward triggers selling."}],
    "description":""
  },
  "EMA":{
    "fullName":"Exponential Moving Average",
    "on":true,"key":"EMA","windowSize":20,
    "chartLocation":"#ema-div","chartHeight":300,
    "rules":[{"action":1, "field":"EMAP","relation":">","trend":1,  "threshold":1.03,"thresholdRelativeTo":"","min":1.01,"max":1.2,"step":0.01,"tip":"Price/EMA ratio crosses threshold upward triggers buying."},
            {"action":-1, "field":"EMAP","relation":"<", "trend":-1,"threshold":0.97,"thresholdRelativeTo":"","min":0.8,"max":0.99,"step":0.01,"tip":"Price/EMA ratio crosses threshold downward triggers selling."}],
  "description":""
  },
  "BB":{
    "fullName":"Bollinger Band",
    "on":true, "key":"BB","bandwidth":2,"windowSize":20,
    "chartLocation":"#bb-div","chartHeight":300,
    "rules":[{"action":1, "field":"%B","relation":"<", "trend":-1,"threshold":0,"thresholdRelativeTo":"","min":-1,"max":0.5,"step":0.05,"tip":"Price drops below threshold relative to total bandwidth triggers buying."},
            {"action":-1, "field":"%B","relation":">", "trend":1,"threshold":0.7,"thresholdRelativeTo":"","min":0.5,"max":1.5,"step":0.05,"tip":"Price goes above threshold relative to total bandwidth triggers selling."}],
    "description":""
  },
  "RSI":{
    "fullName":"Relative Strength Index",
    "on":true,"key":"RSI","windowSize":20,
    "chartLocation":"#rsi-div","chartHeight":300,
    "rules":[{"action":1, "field":"RSI","relation":">","trend":1, "threshold":30,"thresholdRelativeTo":"","min":0,"max":50,"step":1,"tip":"RSI moves upward and goes above threshold triggers buying."},
            {"action":-1, "field":"RSI","relation":"<","trend":-1, "threshold":70,"thresholdRelativeTo":"","min":50,"max":100,"step":1,"tip":"RSI moves downward and drops below threshold triggers selling."}],
    "description":""
  },
  "CCI":{
    "fullName":"Commodity Channel Index",
    "on":true,"key":"CCI","windowSize":20,
    "chartLocation":"#cci-div","chartHeight":300,
    "rules":[{"action":1, "field":"CCI","relation":"<","trend":1, "threshold":-100,"thresholdRelativeTo":"","min":-200,"max":-50,"step":10,"tip":"CCI crosses below threshold and has started to curve upward triggers buying."},
            {"action":-1, "field":"CCI","relation":">","trend":-1, "threshold":100,"thresholdRelativeTo":"","min":50,"max":200,"step":10,"tip":"CCI crosses above threshold and has started to curve downward triggers selling."}],
    "description":""
  }
};
var initialCondition = {"cash":10000,"share":100,"minCash":1000,"minShare":0};

window.onscroll = function(){
  var alwaysOnTop = document.getElementsByClassName("always-on-top")[0];
  var sticky = alwaysOnTop.offsetTop;
  if (window.pageYOffset > sticky) {
    alwaysOnTop.classList.add("sticky");
  } else {
    alwaysOnTop.classList.remove("sticky");
  }
};

window.onload = function () {
    $("#symbol-search").select2(http.searchSymbolConfig());

    var yesterday = new Date().setDate(new Date().getDate() - 1);
    var halfYearAgo = new Date().setMonth(new Date().getMonth() - 6);
    yesterday = new Date(yesterday).toISOString().split('T')[0];
    halfYearAgo = new Date(halfYearAgo).toISOString().split('T')[0];
    document.getElementById("date-range-input-1").max = yesterday;
    document.getElementById("date-range-input-2").max = yesterday;
    document.getElementById("date-range-input-1").value = halfYearAgo;
    document.getElementById("date-range-input-2").value = yesterday;

    document.getElementById("initial-cash-input").value = initialCondition.cash;
    document.getElementById("initial-holding-input").value = initialCondition.share;
    document.getElementById("initial-cash-input").min = initialCondition.minCash;
    document.getElementById("initial-holding-input").min = initialCondition.minShare;

    // populate indicator selection tabs
    indicatorKeys.forEach(function(key,i){
      var a = $("<a/>",{"href":indicatorParams[key]["chartLocation"], "title":indicatorParams[key]["fullName"],"data-toggle":"tab"}).text(key).addClass("nav-link").addClass(i==0?"active":"");
      var li = $("<li></li>").addClass("nav-item").append(a);
      $("#indicator-selection-tabs").append(li);
    });

    //create input for each parameter
    indicatorKeys.forEach(function(key){
      var paramControl = indicatorParams[key].chartLocation+" .param-control";
      var paramDivList = $();
      var windowSizeInput = document.createElement('input');
      windowSizeInput.type = "range";
      windowSizeInput.value = indicatorParams[key].windowSize;
      windowSizeInput.id = key+"-windowSize-input";
      windowSizeInput.min = 1;
      windowSizeInput.max = 50;
      windowSizeInput.step = 1;
      windowSizeInput.oninput = function(){
        changeParam(key,'windowSize',windowSizeInput.value);
      };

      var paramDiv = $("<div>", {class: "param-div"}).append("<span>Window Size (Days): </span><span id="+key+"-windowSize-display></span>")
      .append(windowSizeInput);
      paramDivList = paramDivList.add(paramDiv);

      if(key=="BB"){
        var bandwidthInput = document.createElement('input');
        bandwidthInput.type = "range";
        bandwidthInput.id = key+"-bandwidth-input";
        bandwidthInput.min = 0.4;
        bandwidthInput.max = 5.0;
        bandwidthInput.step = 0.2;
        bandwidthInput.value = indicatorParams[key].bandwidth;
        bandwidthInput.oninput = function(){
          changeParam(key,'bandwidth',bandwidthInput.value);
        };
        var paramDiv = $("<div>", {class: "param-div"}).append("<span>Bandwidth: </span><span id="+key+"-bandwidth-display></span>")
        .append(bandwidthInput)
        .append($('<br><span/>').html("Number of standard deviations between moving average and either band."));
        paramDivList = paramDivList.add(paramDiv);
      }
      var thresholdInputs = [];
      indicatorParams[key].rules.forEach(function(rule,i){
        // usually buy and sell threshold
        var buyOrSell = rule.action>0? "Buy":"Sell";
        thresholdInputs.push(document.createElement('input'));
        thresholdInputs[i].type = "range";
        thresholdInputs[i].id = key+"-threshold-input"+i;
        thresholdInputs[i].min = rule.min;
        thresholdInputs[i].max = rule.max;
        thresholdInputs[i].step = rule.step;
        thresholdInputs[i].value = rule.threshold;
        thresholdInputs[i].oninput = function(){
          changeParam(key,'threshold',thresholdInputs[i].value,i);
        };
        var thresholdTip = $('<br><span/>').html(rule.tip);

        var paramDiv = $("<div>", {class: "param-div"}).append("<span>"+buyOrSell+" threshold: </span><span id="+key+"-threshold-display"+i+"></span><span>"+rule.thresholdRelativeTo+"</span>")
        .append(thresholdInputs[i])
        .append(thresholdTip);
        paramDivList = paramDivList.add(paramDiv);
      });

      $(paramControl).append("<h6>"+key+" Parameters</h6>");
      $(paramControl).append(paramDivList);
      // $(paramControl).append($("<div/>").append($("<button>Save as Rule</button>").click(function(){
      //   saveIndicatorAsRule(key);
      // })));
    });

    // simulation tab
    var a = $("<a/>",{"href":"#sim-div", "title":"Simulation","data-toggle":"tab"}).text("Simulation").addClass("nav-link");
    var li = $("<li></li>").addClass("nav-item").append(a);
    $("#indicator-selection-tabs").append(li);
    var paramControl = "#sim-div .param-control";
    var paramDivList = $();
    indicatorKeys.forEach(function(key){
      var checkbox = $('<input />', { type: 'checkbox', id: "sim-enable-"+key, value: key, checked:indicatorParams["sim"]["indicators"][key].on}).addClass("enable-indicator").click(toggleIndicator);
      var label = $('<label />', { 'for': "sim-enable-"+key, text: key});
      var windowSizeInput = document.createElement('input');
      windowSizeInput.type = "range";
      windowSizeInput.value = indicatorParams["sim"]["indicators"][key].windowSize;
      windowSizeInput.id = key+"-windowSize-input-sim";
      windowSizeInput.min = 1;
      windowSizeInput.max = 50;
      windowSizeInput.step = 1;
      windowSizeInput.oninput = function(){
        changeSimParam(key,'windowSize',windowSizeInput.value);
      };
      if(key=="BB"){
        var bandwidthInput = document.createElement('input');
        bandwidthInput.type = "range";
        bandwidthInput.id = key+"-bandwidth-input-sim";
        bandwidthInput.min = 0.4;
        bandwidthInput.max = 5.0;
        bandwidthInput.step = 0.2;
        bandwidthInput.value = indicatorParams["sim"]["indicators"][key].bandwidth;
        bandwidthInput.oninput = function(){
          changeSimParam(key,'bandwidth',bandwidthInput.value);
        };
      }
      var paramDiv = $("<div>", {class: "param-div"})
      .append(checkbox).append(label)
      .append("<br><span>Window Size (Days): </span><span id="+key+"-windowSize-display-sim>"+windowSizeInput.value+"</span>")
      .append(windowSizeInput);
      if(key=="BB"){
        paramDiv.append("<br><span>Bandwidth: </span><span id="+key+"-bandwidth-display-sim>"+bandwidthInput.value+"</span>")
        .append(bandwidthInput);
      }
      paramDivList = paramDivList.add(paramDiv);
    });

    $(paramControl).append("<h6>Simulation Parameters</h6>");
    $(paramControl).append("<div class='param-div' style='text-align:left;'><span>Select Indicators for Simlation:</span><br><span>(please select at most 4)</span></div>");
    $(paramControl).append(paramDivList);

    // second row, algorithm
    $(paramControl).append("<div class='param-div' style='text-align:left;'><span>Select Machine Learning Algorithm:</span><br><span>(a model used to generate trading strategy)</span></div>");

    indicatorParams.sim.algorithmOptions.forEach(function(algo){
      var selectAlgoRadio = $("<input/>",{ type: 'radio', id: "sim-select-algo-"+algo.id, value: algo.id, name:"select-algo-radio", checked:algo.id==indicatorParams.sim.algorithm});
      var radioLabel = $("<label for ="+"sim-select-algo-"+algo.id+" style='margin-left:5px;'>"+algo.name+"</label>");
      var radioSpan = $("<span/>").append(selectAlgoRadio).append(radioLabel);
      paramDiv = $("<div>", {class: "param-div"})
      .append("<span></span><br>")
      .append(radioSpan)
      $(paramControl).append(paramDiv);
    });

    var herokuFlag = window.location.href.indexOf("heroku")>=0;
    if (!herokuFlag){
      var trainingMonthsInput = document.createElement('input');
      trainingMonthsInput.type = "range";
      trainingMonthsInput.value = indicatorParams["sim"].trainingMonths;
      trainingMonthsInput.id = "training-months-input-sim";
      trainingMonthsInput.min = 6;
      trainingMonthsInput.max = 36;
      trainingMonthsInput.step = 1;
      trainingMonthsInput.oninput = function(){
        changeSimParam("",'trainingMonths',trainingMonthsInput.value);
      };

      paramDiv = $("<div>", {class: "param-div"})
      .append("<br><span>Training Duration:</span><br><span id=training-months-display-sim>"+trainingMonthsInput.value+" (Months)</span><br>")
      .append(trainingMonthsInput);
      $(paramControl).append(paramDiv);
    }

    paramDiv = $("<div>", {class: "param-div"})
    .append($("<span></span><br><button style='margin-top:0;'>Run Simulation</button>").click(function(){
      runSimulation();
    }));
    $(paramControl).append(paramDiv);
    $('input[type=radio][name=select-algo-radio]').change(function() {
      changeSimParam("",'algorithm',this.value);
    });

    $(paramControl).append($("<div>", {class: "param-div"})); // placeholder
    if (herokuFlag){
      $(paramControl).append($("<div>", {class: "param-div"})); // placeholder
    }
    $("#show-train-or-test-div").css("display","none"); //hide before running simulation
    $("#show-sim-"+indicatorParams.sim["showTrainOrTest"]).attr("checked",true);
    $("input[name='show-train-or-test-radio']").change(function(e){
      changeSimParam("",'showTrainOrTest',$(this).val());
    });

    submitDataSelection();
};

var timeout = null;
function changeParam(indicatorKey,param,val,ruleInd){
  clearTimeout(timeout);
  if(param!=="threshold"){
    // console.log("changed ",param, "to",val,"for ",indicatorKey);
    $("#"+indicatorKey+"-"+param+"-display").html(val);
    // var newVal = $("#"+indicatorKey+"-"+param+"-input").val();
    indicatorParams[indicatorKey][param] = parseFloat(val);
  }
  else{
    // console.log("changed threshold of rule ",ruleInd, "to",val,"for indicator ",indicatorKey);
    $("#"+indicatorKey+"-threshold-display"+ruleInd).html(val);
    // var newVal = $("#"+indicatorKey+"-threshold-input"+ruleInd).val();
    indicatorParams[indicatorKey].rules[ruleInd].threshold = parseFloat(val);
  }


  timeout = setTimeout(function(){
    console.log("updated params:",indicatorParams);
    calc.calculateIndicator(indicatorKey,data, indicatorParams);
    policyReturnData[indicatorKey] = calc.calculateReturnByRule(indicatorKey,indicatorParams,data,initialCondition);
    performanceStats[indicatorKey] = calc.calculatePerformanceStats(policyReturnData[indicatorKey]);
    console.log("data with updated indicator value",data);
    console.log("policy return data:",policyReturnData);
    console.log("performance stats:",performanceStats);
    plot.updateChartsForIndicator(indicatorKey,indicatorParams,data,policyReturnData,performanceStats);
  }, 500);

}

function submitDataSelection(){
  // update symbol and date range
  symbol = $("#symbol-search").val() || "SPY";
  dateRange.startDate = new Date(document.getElementById("date-range-input-1").value);
  dateRange.endDate = new Date(document.getElementById("date-range-input-2").value);

  var earliest = new Date(dateRange.startDate);
  earliest.setDate(earliest.getDate() + 60); // earliest end date based on start date entered

  if(dateRange.endDate < earliest){ // less than 60 days
    var yesterday = new Date().setDate(new Date().getDate() - 1);
    if (earliest <= yesterday){ // move back end date to earliest
      dateRange.endDate = earliest;
      document.getElementById("date-range-input-2").value = dateRange.endDate.toISOString().split('T')[0];
    }
    else{ // set end date to yesterday, move forward start date to 60 days ago
      dateRange.endDate = new Date(yesterday);
      document.getElementById("date-range-input-2").value = dateRange.endDate.toISOString().split('T')[0];
      dateRange.startDate.setDate(dateRange.endDate.getDate()-60);
      document.getElementById("date-range-input-1").value = dateRange.startDate.toISOString().split('T')[0];
    }
  }

  initialCondition.cash = parseInt(document.getElementById("initial-cash-input").value);
  initialCondition.share = parseInt(document.getElementById("initial-holding-input").value);
  if (initialCondition.cash < initialCondition.minCash){
    initialCondition.cash = initialCondition.minCash;
    document.getElementById("initial-cash-input").value = initialCondition.cash;
  }
  if (initialCondition.share < initialCondition.minShare){
    initialCondition.share = initialCondition.minShare;
    document.getElementById("initial-holding-input").value = initialCondition.share;
  }
  // getStockData(symbol,dateRange);

  indicatorParams["sim"].symbol = symbol;
  indicatorParams["sim"].testingDateRange = dateRange;
  indicatorParams["sim"].initialCondition = initialCondition;

  http.getStockData(symbol,dateRange).then(onNewStockData);
}

function onNewStockData(_data){
  data = {};
  policyReturnData = {};
  performanceStats = {};

  data = _data;
  var t0 = performance.now();
  indicatorKeys.forEach(function(indicatorKey){
    calc.calculateIndicator(indicatorKey,data, indicatorParams);
  });
  console.log("took time ", performance.now()-t0, "ms to calculate indicators for "+data.length+" rows of data");
  console.log("data with indicators appended",data);

  ["static","best"].forEach(function(key){
    policyReturnData[key] = calc.calculateReturnByRule(key,indicatorParams,data,initialCondition);
    performanceStats[key] = calc.calculatePerformanceStats(policyReturnData[key]);
  });

  indicatorKeys.forEach(function(key){
    if (indicatorParams[key].rules.length>0){
      policyReturnData[key] = calc.calculateReturnByRule(key,indicatorParams,data,initialCondition);
      performanceStats[key] = calc.calculatePerformanceStats(policyReturnData[key]);
    }
  });
  console.log("policy return data with full indicator rule:",policyReturnData);
  console.log("performance stats:",performanceStats);

  plot.updateChartsForIndicator("candle",indicatorParams,data,policyReturnData,performanceStats);

  indicatorKeys.forEach(function(indicatorKey){
    plot.updateChartsForIndicator(indicatorKey,indicatorParams,[],policyReturnData,performanceStats);
  });
}

function onNewSimulationData(_data){
  policyReturnData["train"] = {"sim": _data["train"]}
  policyReturnData["test"] = {"sim": _data["test"]};
  performanceStats["train"] = {};
  performanceStats["test"] = {};
  ["static","best"].forEach(function(key){
    policyReturnData["train"][key] = calc.calculateReturnByRule(key,indicatorParams,_data["train"],initialCondition);
    policyReturnData["test"][key] = calc.calculateReturnByRule(key,indicatorParams,_data["test"],initialCondition);
    performanceStats["train"][key] = calc.calculatePerformanceStats(policyReturnData["train"][key]);
    performanceStats["test"][key] = calc.calculatePerformanceStats(policyReturnData["test"][key]);
  });

  performanceStats["train"]["sim"] = calc.calculatePerformanceStats(policyReturnData["train"]["sim"]);
  performanceStats["test"]["sim"] = calc.calculatePerformanceStats(policyReturnData["test"]["sim"]);

  console.log("policy return data from simulation:",policyReturnData);
  console.log("performance stats from simulation:",performanceStats);

  $("#show-train-or-test-div").css("display","block");
  plot.updateChartsForIndicator("sim",indicatorParams,[],policyReturnData[indicatorParams.sim["showTrainOrTest"]],performanceStats[indicatorParams.sim["showTrainOrTest"]]);

  //plot.updateChartsForSimulation(policyReturnData,performanceStats,indicatorParams.sim);
}

function toggleIndicator(e){
  var indicatorKey = e.target.value;
  var enabled = e.target.checked;
  console.log(indicatorKey+" is enabled for simulation?",enabled);
  indicatorParams["sim"]["indicators"][indicatorKey].on = enabled;
  $("#"+indicatorKey+"-windowSize-input-sim").prop("disabled",!enabled);
  indicatorKey=="BB" && $("#"+indicatorKey+"-bandwidth-input-sim").prop("disabled",!enabled);
}

function changeSimParam(indicatorKey,param,val){
  if (indicatorKey){
    $("#"+indicatorKey+"-"+param+"-display-sim").html(val);
    indicatorParams["sim"]["indicators"][indicatorKey][param] = parseFloat(val);
  }
  else{
    indicatorParams["sim"][param] = val;
    if (param=="trainingMonths"){
      $("#training-months-display-sim").html(val+" (Months)");
      indicatorParams["sim"][param] = parseInt(val);
    }
    if (param=="showTrainOrTest"){
      plot.updateChartsForIndicator("sim",indicatorParams,[],policyReturnData[indicatorParams.sim["showTrainOrTest"]],performanceStats[indicatorParams.sim["showTrainOrTest"]]);
    }
  }
  // console.log("updated simulation params:",indicatorParams["sim"]);
}

function saveIndicatorAsRule(indicatorKey){
  console.log("should save this as rule",indicatorParams[indicatorKey]);
}
function runSimulation(){
  var trainEnd = new Date(indicatorParams["sim"].testingDateRange.startDate);
  trainEnd.setDate(trainEnd.getDate() - 1);
  var trainStart = new Date(trainEnd);
  trainStart.setMonth(trainStart.getMonth() - indicatorParams["sim"].trainingMonths);
  indicatorParams["sim"].trainingDateRange.startDate = trainStart;
  indicatorParams["sim"].trainingDateRange.endDate = trainEnd;
  http.runSimulation(indicatorParams["sim"]).then(onNewSimulationData);
}
