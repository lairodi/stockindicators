var calc = (function(){
  function calculateIndicator(indicatorKey, data, indicatorParams){
    var indicatorParam = indicatorParams[indicatorKey];
    var windowSize = indicatorParam["windowSize"];
    if(indicatorKey=="SMA"){
      var col = "Adj Close";
      var windowSum = 0;
      for (var i=0;i<windowSize;i++){
        windowSum += data[i][col];
        data[i]["SMA"] = null;
        data[i]["SMAP"] = null;
      }
      data[windowSize-1]["SMA"] = windowSum/windowSize;
      data[windowSize-1]["SMAP"] = data[windowSize-1][col]/data[windowSize-1]["SMA"];

      for (var i=windowSize;i<data.length;i++){
        data[i]["SMA"] = data[i-1]["SMA"] + (data[i][col] - data[i-windowSize][col])/windowSize;
        data[i]["SMAP"] = data[i][col]/data[i]["SMA"];
      }
    }

    if (indicatorKey=="EMA"){
      var windowSum = 0;
      var col = "Adj Close";
      for (var i=0;i<windowSize;i++){
        windowSum += data[i][col];
        data[i]["EMA"] = null;
        data[i]["EMAP"] = null;
      }
      var firstSMA = windowSum/windowSize; //use first sma as first ema

      var c = 2/(windowSize+1)
      data[windowSize-1]["EMA"] = firstSMA;
      data[windowSize-1]["EMAP"] = data[windowSize-1][col]/data[windowSize-1]["EMA"];
      for (var i=windowSize;i<data.length;i++){
        data[i]["EMA"] = (data[i][col] - data[i-1]["EMA"])*c + data[i-1]["EMA"];
        data[i]["EMAP"] = data[i][col]/data[i]["EMA"];
      }
    }

    if (indicatorKey == "BB"){
      var col = "Adj Close";
      var windowSum = 0;
      var temp = data.map(function(d){return {};});
      for (var i=0;i<windowSize;i++){
        windowSum += data[i][col];
        data[i]["BB_TOP"] = null;
        data[i]["BB_BOTTOM"] = null;
        data[i]["%B"] = null;
      }
      temp[windowSize-1]["SMA"] = windowSum/windowSize;

      var windowErrorSquare = 0;
      for (var i=0;i<windowSize;i++){
        windowErrorSquare += Math.pow(data[i][col]-temp[windowSize-1]["SMA"],2);
      }
      temp[windowSize-1]["variance"] = windowErrorSquare/(windowSize-1);
      temp[windowSize-1]["STD"] = Math.sqrt(temp[windowSize-1]["variance"]);

      for (var i=windowSize;i<data.length;i++){
        temp[i]["SMA"] = temp[i-1]["SMA"] + (data[i][col] - data[i-windowSize][col])/windowSize;
        temp[i]["variance"] = temp[i-1]["variance"] + (data[i][col] - data[i-windowSize][col]) * (data[i][col]-temp[i]["SMA"]+data[i-windowSize][col]-temp[i-1]["SMA"])/(windowSize-1);
        temp[i]["STD"] = Math.sqrt(temp[i]["variance"]);
      }
      for (var i=windowSize-1;i<data.length;i++){
        data[i]["BB_TOP"] = temp[i]["SMA"] + indicatorParam["bandwidth"] * temp[i]["STD"];
        data[i]["BB_BOTTOM"] = temp[i]["SMA"] -  indicatorParam["bandwidth"]* temp[i]["STD"];
        data[i]["%B"] = (data[i][col]- data[i]["BB_BOTTOM"]) / (data[i]["BB_TOP"]-data[i]["BB_BOTTOM"]);
      }
    }

    if (indicatorKey =="CCI"){
      var temp = data.map(function(d){return {};});
      for (var i=0;i<data.length;i++){
        var high = -1;
        var low = Number.POSITIVE_INFINITY;
        var windowBegin = i-windowSize+1>=0?i-windowSize+1:0;
        for (var j=windowBegin;j<=i;j++){
          high = data[j]["High"]>high? data[j]["High"]:high;
          low = data[j]["Low"]<low? data[j]["Low"]:low;
        }
        temp[i]["TP"] = (high+low+data[i]["Close"])/3;
      }
      windowSum = 0;
      col = "TP";
      for (var i=0;i<windowSize;i++){
        windowSum += temp[i][col];
        data[i]["CCI"] = null;
      }
      temp[windowSize-1]["SMA"] = windowSum/windowSize;

      windowDeviationSum = 0;
      for (var i=0;i<windowSize;i++){
        temp[i]["SMA"] = temp[windowSize-1]["SMA"]; // use "first" SMA
        windowDeviationSum += Math.abs(temp[i]["TP"] - temp[i]["SMA"]);
      }
      temp[windowSize-1]["mean_dev"] = windowDeviationSum/windowSize;

      for (var i=windowSize;i<data.length;i++){
        temp[i]["SMA"] = temp[i-1]["SMA"] + (temp[i][col] - temp[i-windowSize][col])/windowSize;
        windowDeviationSum += Math.abs(temp[i][col] - temp[i]["SMA"]);
        windowDeviationSum -= Math.abs(temp[i-windowSize][col] - temp[i-windowSize]["SMA"]);
        temp[i]["mean_dev"] = windowDeviationSum/windowSize;
      }
      for (var i = windowSize-1;i<data.length;i++){
        data[i]["CCI"] = (temp[i][col] - temp[i]["SMA"]) / (0.015 * temp[i]["mean_dev"]);
      }
    }

    if (indicatorKey == "VROC"){
      var col = "Volume";
      for (var i=0; i<windowSize;i++){
        data[i]["VROC"] = null;
      }
      for (var i=windowSize;i<data.length;i++){
        data[i]["VROC"] = (data[i][col]/data[i-windowSize][col] - 1)*100;
      }
    }

    if (indicatorKey == "RSI"){
      var col = "Adj Close";
      var down_ret = [0];
      var up_ret = [0];
      data[0]["RSI"] = null;
      for (var i=1;i<data.length;i++){
        var delta = data[i][col] - data[i-1][col];
        up_ret.push(delta>=0? up_ret[i-1]+delta : up_ret[i-1])
        down_ret.push(delta<0? down_ret[i-1]-delta: down_ret[i-1])
        if(i>=windowSize){
          var up_gain = up_ret[i] - up_ret[i-windowSize];
          var down_loss = down_ret[i] - down_ret[i-windowSize];
          var rs = up_gain/down_loss;
          data[i]["RSI"] = 100 - (100/(1+rs));
        }
        else{
          data[i]["RSI"] = null;
        }
      }
    }
  }

  function calculateBenchmark(benchmarkType, data, initialCondition){
    // static: invest on day 1 and hold
    // best: theoretically best case (know the future)
    var policy = [];
    var col = "Adj Close";
    if(benchmarkType=="static"){
      data.forEach(function(d,i){
        var dayEntry = Object.assign({}, d);
        if(i==0){// first day
          dayEntry["trade"] = initialCondition.cash/d[col];
          dayEntry["holding"] = initialCondition.share+initialCondition.cash/d[col];
          dayEntry["cash"] = 0;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
        else if(i==data.length-1){ // last day
          dayEntry["trade"] = 0;
          dayEntry["holding"] = policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
        else{
          // do nothing for static
          dayEntry["trade"] = 0;
          dayEntry["holding"] = policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
      });
    }
    else if (benchmarkType=="best"){
      data.forEach(function(d,i){
        var dayEntry = Object.assign({}, d);
        if(i==0){// first day
          if(data[i+1][col] > d[col]){
            dayEntry["trade"] = initialCondition.cash/d[col];
            dayEntry["holding"] = initialCondition.share+initialCondition.cash/d[col];
            dayEntry["cash"] = 0;
            dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
          else if(data[i+1][col] < d[col]){
            dayEntry["trade"] = (-1)*initialCondition.share;
            dayEntry["holding"] = 0;
            dayEntry["cash"] = initialCondition.share*d[col]+initialCondition.cash;
            dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
          else{
            dayEntry["trade"] = 0;
            dayEntry["holding"] = initialCondition.share;
            dayEntry["cash"] = initialCondition.cash;
            dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
        }
        else if(i==data.length-1){ // last day
          dayEntry["trade"] = 0;
          dayEntry["holding"] = policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
        else{
          // update based on tomorrow's price
          dayEntry["trade"] = 0;
          dayEntry["holding"] = policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          if (data[i+1][col] > d[col]){
            dayEntry.trade = dayEntry.cash / d[col];
            dayEntry.holding += dayEntry.trade;
            dayEntry.cash = 0;
            dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
          else if(data[i+1][col]< d[col]){
            // sell everything, don't short
            dayEntry.holding = 0;
            dayEntry.trade = dayEntry.holding - policy[i-1].holding;
            dayEntry.cash =  policy[i-1].cash - dayEntry.trade*d[col];
            dayEntry.value = dayEntry.holding*d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
          else{
            dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
            policy.push(dayEntry);
          }
        }
      });
    }
    else if(benchmarkType=="mockSim"){
      data.forEach(function(d,i){
        var dayEntry = Object.assign({}, d);
        if(i==0){// first day
          dayEntry["trade"]=0;
          dayEntry["holding"]=initialCondition.share;
          dayEntry["cash"] = initialCondition.cash;
          dayEntry["value"]=0;
          dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
        else if(i==data.length-1){ // last day
          dayEntry["trade"]=0;
          dayEntry["holding"]=policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
        else{
          // do random for mock
          dayEntry["trade"]=0;
          dayEntry["holding"]=policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry["value"]=0;
          if (Math.random()>0.9){
            if (dayEntry.holding>0 &&Math.random()>0.5){
              dayEntry.trade = -dayEntry.holding/2.0;
              dayEntry.holding += dayEntry.trade;
              dayEntry.cash -= dayEntry.trade*d[col];
            }
            else if (dayEntry.cash>0 && Math.random()>0.5){
              dayEntry.trade = dayEntry.cash/2.0/d[col];
              dayEntry.holding += dayEntry.trade;
              dayEntry.cash -= dayEntry.trade*d[col];
            }
          }
          dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
          policy.push(dayEntry);
        }
      });
    }


    return policy;
  }

  function calculateReturnByRule_SIMPLE(whichIndicator,indicators,data,investment){
    var policy = [];
    if (whichIndicator == "static" || whichIndicator=="best"){
      policy = calculateBenchmark(whichIndicator,data,investment);
    }
    else{
      var rules = indicators[whichIndicator].rules;
      data.forEach(function(d,i){
        if (i==0){
          var dayEntry = {"Date":d.Date, "trade":0,"holding":0,"cash":investment,"value":investment,"rule":-1};
        }
        else{
          var dayEntry = {"Date":d.Date, "trade":0,"holding":policy[i-1].holding,"cash":policy[i-1].cash,"value":0,"rule":-1};
          dayEntry.value = dayEntry.holding * d["Adj Close"] + dayEntry.cash;
        }

        var buyOrSell = 0;
        var triggeredRule = -1;
        if (d[whichIndicator]!==null){ // indicator has value (passed first n-day window)
          rules.forEach(function(rule,rInd){
            // if multiple rules with 1 indicator, they won't overlap, at most 1 will pass
            var compareValue = d[rule.field];
            var thresholdValue = rule.thresholdRelativeTo? rule.threshold*d[rule.thresholdRelativeTo]:rule.threshold;
            if(rule.relation=="<" && compareValue<thresholdValue){
              buyOrSell = rule.action;
              triggeredRule = rInd;
            }
            else if (rule.relation==">" && compareValue>thresholdValue){
              buyOrSell = rule.action;
              triggeredRule = rInd;
            }
          });
        }
        if (buyOrSell>0){ // buy signal
          dayEntry["originalData"] = d;
          dayEntry.trade = dayEntry.cash / d["Adj Close"];
          dayEntry.holding += dayEntry.trade;
          dayEntry.cash = 0;
          dayEntry.value = dayEntry.holding * d["Adj Close"] + dayEntry.cash;
          dayEntry.rule = triggeredRule;
        }
        else if (buyOrSell<0){
          // sell everything, don't short
          dayEntry["originalData"] = d;
          dayEntry.holding = 0;
          dayEntry.trade = dayEntry.holding - policy[i-1].holding;
          dayEntry.cash =  policy[i-1].cash - dayEntry.trade*d["Adj Close"];
          dayEntry.value = dayEntry.holding* d["Adj Close"] + dayEntry.cash;
          dayEntry.rule = triggeredRule;
        }
        policy.push(dayEntry);
      });
    }
    return policy;
  }

  function calculateReturnByRule(whichIndicator,indicators,data,initialCondition){
    var policy = [];
    var col = "Adj Close";
    if (whichIndicator == "static" || whichIndicator=="best"){
      policy = calculateBenchmark(whichIndicator,data,initialCondition);
    }
    else{
      var rules = indicators[whichIndicator].rules;
      var yesterday = null;
      data.forEach(function(d,i){
        var dayEntry = Object.assign({}, d);
        if (i==0){
          dayEntry["trade"] = 0;
          dayEntry["holding"] = initialCondition.share;
          dayEntry["cash"] = initialCondition.cash;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
          dayEntry["rule"] = -1;
        }
        else{
          dayEntry["trade"] = 0;
          dayEntry["holding"] = policy[i-1].holding;
          dayEntry["cash"] = policy[i-1].cash;
          dayEntry["rule"] = -1;
          dayEntry["value"] = dayEntry.holding * d[col] + dayEntry.cash;
        }

        var buyOrSell = 0;
        var triggeredRule = -1;
        if (d[whichIndicator]!==null){ // indicator has value (passed first n-day window)

          rules.forEach(function(rule,rInd){
            // manually implement each rule for each indicator
            if (whichIndicator=="SMA" || whichIndicator=="EMA"){
              var compareValue = d[rule.field];
              var thresholdValue = rule.thresholdRelativeTo? rule.threshold*d[rule.thresholdRelativeTo]:rule.threshold;
              var trend = 0;
              if (yesterday !==null && yesterday[whichIndicator]!==null){
                trend = d[whichIndicator] - yesterday[whichIndicator];
              }
              if(rule.relation=="<" && compareValue<thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
              else if (rule.relation==">" && compareValue>thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
            }
            else if(whichIndicator=="BB"){
              var compareValue = d[rule.field];
              var thresholdValue = rule.thresholdRelativeTo? rule.threshold*d[rule.thresholdRelativeTo]:rule.threshold;
              var trend = 0;
              // BB indicator doesn't have a field "BB", instead "BB_TOP","BB_BOTTOM","%B"
              if (yesterday !==null && yesterday[rule.field]!==null){
                trend = d[rule.field] - yesterday[rule.field];
              }
              if(rule.relation=="<" && compareValue<thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
              else if (rule.relation==">" && compareValue>thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
            }
            else if (whichIndicator=="RSI"){
              var compareValue = d[rule.field];
              var thresholdValue = rule.thresholdRelativeTo? rule.threshold*d[rule.thresholdRelativeTo]:rule.threshold;
              var trend = 0;
              if (yesterday !==null && yesterday[whichIndicator]!==null){
                trend = d[whichIndicator] - yesterday[whichIndicator];
              }
              if (trend*rule.trend>0){
                if(rule.relation=="<" && compareValue<thresholdValue && yesterday[rule.field]>thresholdValue){
                  buyOrSell = rule.action;
                  triggeredRule = rInd;
                }
                else if(rule.relation==">" && compareValue>thresholdValue && yesterday[rule.field]<thresholdValue){
                  buyOrSell = rule.action;
                  triggeredRule = rInd;
                }
              }
            }
            else if (whichIndicator=="CCI"){
              var compareValue = d[rule.field];
              var thresholdValue = rule.thresholdRelativeTo? rule.threshold*d[rule.thresholdRelativeTo]:rule.threshold;
              var trend = 0;
              if (yesterday !==null && yesterday[whichIndicator]!==null){
                trend = d[whichIndicator] - yesterday[whichIndicator];
              }
              if(rule.relation=="<" && compareValue<thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
              else if (rule.relation==">" && compareValue>thresholdValue && trend*rule.trend>0){
                buyOrSell = rule.action;
                triggeredRule = rInd;
              }
            }
          });
        }
        if (buyOrSell>0){ // buy signal
          // dayEntry["yesterdayData"] = ye
          dayEntry.trade = dayEntry.cash / d[col];
          dayEntry.holding += dayEntry.trade;
          dayEntry.cash = 0;
          dayEntry.value = dayEntry.holding * d[col] + dayEntry.cash;
          dayEntry.rule = triggeredRule;
        }
        else if (buyOrSell<0){
          // sell everything, don't short
          dayEntry.holding = 0;
          dayEntry.trade = dayEntry.holding - policy[i-1].holding;
          dayEntry.cash =  policy[i-1].cash - dayEntry.trade*d[col];
          dayEntry.value = dayEntry.holding* d[col] + dayEntry.cash;
          dayEntry.rule = triggeredRule;
        }
        policy.push(dayEntry);
        yesterday = d;
      });
    }
    return policy;
  }


  function calculatePerformanceStats(data){
    var dailyReturn = [0];
    col = "value";
    var cumReturn = (data[data.length-1][col]/data[0][col]) - 1.0;
    var avgDailyReturn = 0;
    for (var i=1; i<data.length;i++){
      var dr = data[i][col]/data[i-1][col] - 1.0;
      avgDailyReturn += dr; //sum first
      dailyReturn.push(dr);
    }
    avgDailyReturn = avgDailyReturn/(data.length-1);

    var sumErrorSquare = 0;
    for (var i=1; i<data.length;i++){
      sumErrorSquare += Math.pow(dailyReturn[i]-avgDailyReturn,2);
    }
    var stdDailyReturn = Math.sqrt(sumErrorSquare/(data.length-1-1));
    var sharpeRatio = avgDailyReturn/stdDailyReturn*Math.sqrt(252);
    return {
      "cumReturn":cumReturn,
      "avgDailyReturn":avgDailyReturn,
      "stdDailyReturn":stdDailyReturn,
      "sharpeRatio":sharpeRatio
    };
  }


  return {
    "calculateIndicator":calculateIndicator,
    "calculateBenchmark":calculateBenchmark,
    "calculateReturnByRule":calculateReturnByRule,
    "calculatePerformanceStats":calculatePerformanceStats
  }
}());
