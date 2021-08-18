var plot = (function(){
  var colorPallete = {
    "green" : "#66BB6A",
    "red": "#EF5350",
    "Adj Close": "#000000",
    "Adj Close sim": "#EC407A",
    "SMA": "#0080FF", // blue
    "EMA": "#0080FF",
    "SMAP": "#EC407A", // pinkish
    "EMAP": "#EC407A",
    "BB_TOP": "#0080FF",
    "BB_BOTTOM": "#0080FF",
    "BB_band": "#0080FF",
    "BB":"#0080FF",
    "%B":"#EC407A",
    "RSI": "#0080FF",
    "CCI": "#0080FF", // blue
    "VROC": "#0080FF",
    "Volume":"#0080FF", //blue
    "static":"#000000",
    "best":"#0080FF",  // blue
    "sim":"#0080FF",  // blue
    "indicatorBuy": "#9C27B0",
    "indicatorSell":"#FF9800",
    "refLine":"#90A4AE"
  };

  var candleStickTooltip = d3.tip().attr('class', 'd3-tip')
    .style("width","120px")
    .html(function(d) {
      var content = "";
      d.forEach(function(row){
        content += "<span>"+row.key+": "+row.value+"</span></br>";
      });
      return content;
    })
    .direction('e').offset([-8,10]);

  var indicatorTooltip = d3.tip().attr('class', 'd3-tip')
    .style("width","300px")
    .html(function(d) {
      var leftContent = "";
      d["left"].forEach(function(row){
        leftContent += "<span>"+row.key+": "+row.value+"</span></br>";
      });
      var rightContent = "<p>"+d["right"]+"</p>";
      var content = "<div class='double-side-tip'><div class='left-half'>"+leftContent+"</div><div class='right-half'>"+rightContent+"</div></div>";
      return content;
    })
    .direction('e').offset([-8,10]);
  var returnTooltip = d3.tip().attr('class', 'd3-tip')
  .style("width","200px")
  .html(function(d) {
    var content = "";
    d.forEach(function(row){
      var value = row.value == "sim"? "Simulation":row.value;
      var key = row.key;
      content += "<span>"+key+": "+value+"</span></br>";
    });
    return content;
  })
  .direction('n');

  var simulationStatsTooltip = d3.tip().attr('class', 'd3-tip')
  .style("width","200px")
  .html(function(d) {
    var content = "";
    d.forEach(function(row){
      content += "<span>"+row.key+": "+row.value+"</span></br>";
    });
    return content;
  })
  .direction('n');//.offset([0,10]);
  var simulationTriggerTooltip = d3.tip().attr('class', 'd3-tip')
    .style("width","300px")
    .html(function(d) {
      var leftContent = "";
      d["left"].forEach(function(row){
        leftContent += "<span>"+row.key+": "+row.value+"</span></br>";
      });
      var rightContent = "<p>"+d["right"]+"</p>";
      var content = "<div class='double-side-tip'><div class='left-half'>"+leftContent+"</div><div class='right-half'>"+rightContent+"</div></div>";
      return content;
    })
    .direction('e').offset([-8,10]);

  var mainContainerWidth = 1200;
  var paramControlWidth = 1200;
  var indicatorChartWidth = 750;
  var returnChartWidth = 450;
  var simulationChartWidth = 600; // train and test each half
  var indicatorChartMargin = {top: 20, left: 50, right: 0, bottom: 28};
  var returnChartMargin = {top: 20, left: 50, right: 2, bottom: 28}; // could be different
  var simulationChartMargin = {top: 20, left: 50, right: 0, bottom: 28};
  d3.select("#main-container").style("width",mainContainerWidth+"px");


  function setupHtml(options){
      d3.select(options.selector +" .param-control")
        //.style("height",(options.height)+"px")
        .style("width",(options["param-control"].divWidth)+"px");

      // set param in html based on data
      var indicatorKey = options["param-control"].params.key;
      // every indicator has windowSize param
      $("#"+indicatorKey+"-windowSize-input").val(options["param-control"].params.windowSize);
      $("#"+indicatorKey+"-windowSize-display").html(options["param-control"].params.windowSize);
      // BBP has additional bandwidth param
      if (indicatorKey=='BB'){
        $("#"+indicatorKey+"-bandwidth-input").val(options["param-control"].params.bandwidth);
        $("#"+indicatorKey+"-bandwidth-display").html(options["param-control"].params.bandwidth);
      }
      // rule params
      options["param-control"].params.rules.forEach(function(rule,i){
        $("#"+indicatorKey+"-threshold-input"+i).val(rule.threshold);
        $("#"+indicatorKey+"-threshold-display"+i).html(rule.threshold);
      });
      // only update chart-plot svg's width, no need to reset/append other stuff
      ["indicator-chart","policy-return-chart"].forEach(function(chart){
        d3.select(options.selector +" ."+chart)
        .style("height",options.height+"px");
        d3.select(options.selector +" ."+chart+" .title-svg-container")
        .style("width",options[chart].divWidth+"px");
        d3.select(options.selector +" ."+chart+" .title-svg-container .chart-title")
        .attr("width",options[chart].divWidth)
        .attr("height",options[chart].margin.top);

        d3.select(options.selector +" ."+chart+" .fixed-svg-container")
        .style("width",options[chart].margin.left+"px");
        d3.select(options.selector +" ."+chart+" .fixed-svg-container .chart-left")
        .attr("width",options[chart].margin.left)
        .attr("height",options.height-options[chart].margin.top);

        $(options.selector +" ."+chart+" .scorll-svg-container").scrollLeft(0);
        d3.select(options.selector +" ."+chart+" .scorll-svg-container")
        .style("width",(options[chart].divWidth-options[chart].margin.left)+"px");
        d3.select(options.selector +" ."+chart+" .scorll-svg-container .chart-plot")
        .attr("width",options[chart].svgWidth)
        .attr("height",options.height-options[chart].margin.top);
      });
  }


  function updateChartsForIndicator(indicatorKey,indicatorParams,data,policyReturnData,performanceStats){
    var dayWidth = 9;
    var dayPadding = 0.15;
    var numDays = data.length || policyReturnData[indicatorKey].length;
    var totalPlotWidth = dayWidth*numDays + dayWidth*dayPadding*2;
    var visibleWidth = indicatorChartWidth - indicatorChartMargin.left - indicatorChartMargin.right;
    totalPlotWidth = totalPlotWidth<visibleWidth? visibleWidth:totalPlotWidth;

    var options = {
      "selector":indicatorParams[indicatorKey]["chartLocation"],
      "height": indicatorParams[indicatorKey]["chartHeight"],
      "width":paramControlWidth, // 1200px
      "param-control":{
        "divWidth": paramControlWidth, //150, no svg in here
        "params":indicatorParams[indicatorKey]
      },
      "indicator-chart":{
        "margin": indicatorChartMargin,
        "divWidth": indicatorChartWidth, //650
        "svgWidth": totalPlotWidth // long, don't squeeze, scroll
      },
      "policy-return-chart":{
        "margin": returnChartMargin,
        "divWidth": returnChartWidth, //400
        "svgWidth": returnChartWidth-returnChartMargin.left//ok to squeeze, want to see the end
      }
    };
    setupHtml(options);

    // update indicator chart
    var chartContainerInfo = {
      selector:indicatorParams[indicatorKey]["chartLocation"]+" .indicator-chart",
      margin:options["indicator-chart"].margin,
      plotHeight: options.height - options["indicator-chart"].margin.top,
      plotWidth:options["indicator-chart"].svgWidth,
      titleWidth:options["indicator-chart"].divWidth,
      title:indicatorKey,
      minMaxBuffer:[-0.2,0.2] // leave some space on y axis
    };
    if(indicatorKey=="candle"){
      chartContainerInfo.title = "Price and Volume";
      chartContainerInfo.minMaxBuffer = [-0.02,0.02];
      drawCandleStickChart(data,chartContainerInfo,candleStickTooltip);
    }
    else{
      var refLines = [];
      if(indicatorKey!=="sim"){
        refLines = indicatorParams[indicatorKey].rules
          .map(function(r){
            return {"y1":r.threshold,"y2":r.threshold,"x1":0, "x2":totalPlotWidth,"stroke":colorPallete["refLine"]};
          });
      }

      if (indicatorKey=="SMA" || indicatorKey=="EMA"){
        drawMAIndicatorChart(policyReturnData,indicatorKey,indicatorParams,chartContainerInfo,refLines,indicatorTooltip);
      }
      else if (indicatorKey=="BB"){
       drawBBIndicatorChart(policyReturnData,indicatorKey,indicatorParams,chartContainerInfo,refLines,indicatorTooltip);
      }
      else{ //(indicatorKey=="RSI" || indicatorKey=="CCI")
        drawGenericIndicatorChart(policyReturnData,[indicatorKey],indicatorParams,chartContainerInfo,refLines,indicatorTooltip);
      }

    }

    // update policy return chart
    var policiesToDraw = ["static"];
    var chartContainerInfo = {
      selector:indicatorParams[indicatorKey]["chartLocation"]+" .policy-return-chart",
      margin:options["policy-return-chart"].margin,
      plotHeight: options.height - options["policy-return-chart"].margin.top,
      plotWidth:options["policy-return-chart"].svgWidth-options["policy-return-chart"].margin.right,
      titleWidth:options["policy-return-chart"].divWidth,
      title:indicatorKey=="sim"? "Return of Simulation":"Return of "+indicatorKey+" Policy",
      minMaxBuffer:[-0.5,2] // leave some space on y axis
    };
    if (indicatorKey=="candle"){
      policiesToDraw.push("best");
      chartContainerInfo.title = "Return of Benchmarks";
      chartContainerInfo.minMaxBuffer = [-2,0.05]; //best would be very high, "lift" low
    }
    else{
      policiesToDraw.push(indicatorKey);
    }
    drawPolicyReturnChart(policyReturnData,performanceStats,policiesToDraw,chartContainerInfo,returnTooltip);

  }

  function drawCandleStickChart(data,chartContainerInfo,tooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var height1 = height * 0.75;
    var height2 = height * 0.25;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;

    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(tooltip);

    titleSvg.selectAll(".chart-title").remove();
    titleSvg.append("text")
    .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    .attr("class","chart-title")
    .text(chartContainerInfo.title);

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.15)
        .domain(data.map(function(_d){return _d.Date;}));
    var y1 = d3.scaleLinear().range([height1, 0])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d.Low;})),d3.max(data.map(function(_d){return _d.High;}))],minMaxBuffer));
    var y2 = d3.scaleLinear().range([height1+height2, height1])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d.Volume;})),d3.max(data.map(function(_d){return _d.Volume;}))],[minMaxBuffer[0],minMaxBuffer[1]*15]));

    plotSvg.selectAll("g.x-axis").data([0,1])
    .enter()
    .append("g").attr("class", "x-axis")
    .attr("transform", function(d,i){
      var heights = [height1, height];
      return "translate("+0 +"," + heights[i] + ")"
    });
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0,1]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").each(function(d,i){
      if (i==0){
        d3.select(this).transition().duration(1000).call(d3.axisLeft(y1));
      }
      else{
        d3.select(this).transition().duration(1000)
        .call(d3.axisLeft(y2).ticks(4)
        .tickFormat(function(d){
          return (d/1000000)+"M";
        }));
        d3.select(this).selectAll(".axis-title").remove();
        d3.select(this).append("text").attr("class","axis-title")
        .attr("fill", "#000")
        .attr("transform", "translate( "+ (5-margin.left) +", "+ (height1+height2/2) +") rotate(-90)")
        .attr("dy", "0.71em")
        .style("font-size","12px")
        .attr("text-anchor", "middle")
        .text("Volume");
      }
    });

    var dayStrip = plotSvg.selectAll('g.day-strip').data(data);
    dayStrip.exit().remove();
    dayStrip.enter().append('g').merge(dayStrip)
      .attr("class",'day-strip')
      .attr('transform', function(d) {
          return "translate("+(x(d.Date)+0.5*x.bandwidth())+", 0)";
      });
    var openClose = plotSvg.selectAll('g.day-strip').selectAll('.open-close')
        .data(function(d){return [d];});
    openClose.exit().transition().duration(1000).attr("y1",height1).attr("y2",height1).remove();
    openClose.enter().append('line').merge(openClose)
        .attr("class","open-close")
        .transition().duration(1000)
        .attr("y1",function(d){return y1(d.Open);})
        .attr("y2",function(d){return y1(d.Close);})
        .attr("stroke", function(d){
          return d.Open > d.Close? colorPallete.red:colorPallete.green;
        })
        .attr("stroke-width", x.bandwidth())
        .attr("opacity",1.0);
    var highLow = plotSvg.selectAll('g.day-strip').selectAll('.high-low')
        .data(function(d){return [d];});
    highLow.exit().remove();
    highLow.enter().append('line').merge(highLow)
      .attr("class","high-low")
      .transition().duration(1000)
      .attr("y1",function(d){return y1(d.Low);})
      .attr("y2",function(d){return y1(d.High);})
      .attr("stroke", "#000")
      .attr("stroke-width", 1);

    var volume = plotSvg.selectAll('g.day-strip').selectAll('.volume')
        .data(function(d){return [d];});
    volume.exit().remove();
    volume.enter().append('line').merge(volume)
        .attr("class","volume")
        .transition().duration(1000)
        .attr("y1",function(d){return y2(d.Volume);})
        .attr("y2",height)
        .attr("stroke", colorPallete["Volume"])
        .attr("stroke-width", x.bandwidth())
        .attr("opacity",1.0);

      plotSvg.selectAll(".day-strip").on("mouseover",function(d){
        d3.select(this).attr("opacity",0.5);
        var info = [];
        info.push({"key":"Date", "value":d3.timeFormat("%-Y/%-m/%-d")(d.Date)});
        ["Open","Close","High","Low","Adj Close","Volume"].forEach(function(key){
          info.push({"key":key, "value":d[key]});
        });
        tooltip.show(info);
      })
      .on("mouseout",function(){
        tooltip.hide();
        d3.select(this).attr("opacity",1.0);
      });

  }

  function drawBBIndicatorChart(policyReturnData,indicatorToDraw,indicatorParams,chartContainerInfo,refLines,tooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var height1 = height * 0.6;
    var height2 = height * 0.4;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;
    var data = policyReturnData[indicatorToDraw];
    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(tooltip);

    // titleSvg.selectAll(".chart-title").remove();
    // titleSvg.append("text")
    // .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    // .attr("class","chart-title")
    // .text(chartContainerInfo.title);
    titleSvg.selectAll("g.legend").remove();
    var legendG = titleSvg.selectAll("g.legend").data(["Adj Close","BB_band","%B","indicatorBuy","indicatorSell","refLine"])
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      if (i>1){
        return "translate(" + (margin.left+75*i+75) + "," +0 + ")"
      }
      if (i>0){
        return "translate(" + (margin.left+75*i+20) + "," +0 + ")"
      }

      return "translate(" + (margin.left+75*i+5) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){return colorPallete[d];})
    .style("stroke-width",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell" || d=="BB_band"){
        return 8;
      }
      else if(d=="refLine"){
        return 1;
      }
      return 2;
    })
    .style("stroke-opacity",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return 0.4;
      }
      else if( d=="BB_band"){
        return 0.2;
      }
      return 1;
    })
    .style("stroke-dasharray",function(d){
      return d=="refLine"?"3,3":"1,0";
    });
    legendG.append("text")
    .text(function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return d=="indicatorBuy"?"Buy":"Sell";
      }
      if(d=="BB_band"){
        return "Bollinger Band";
      }
      if(d=="refLine"){
        return "Threshold";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.15)
        .domain(data.map(function(_d){return _d.Date;}));
    var y1 = d3.scaleLinear().range([height1, 0])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d["BB_BOTTOM"];})),d3.max(data.map(function(_d){return _d["BB_TOP"];}))],minMaxBuffer));
    var y2 = d3.scaleLinear().range([height1+height2, height1])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d["%B"];})),d3.max(data.map(function(_d){return _d["%B"];}))],minMaxBuffer));

    plotSvg.selectAll("g.x-axis").data([0,1])
    .enter()
    .append("g").attr("class", "x-axis")
    .attr("transform", function(d,i){
      var heights = [height1, height];
      return "translate("+0 +"," + heights[i] + ")"
    });
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0,1]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").each(function(d,i){
      if (i==0){
        d3.select(this).transition().duration(1000).call(d3.axisLeft(y1));
      }
      else{
        d3.select(this).transition().duration(1000)
        .call(d3.axisLeft(y2).ticks(4));
        d3.select(this).selectAll(".axis-title").remove();
        d3.select(this).append("text").attr("class","axis-title")
        .attr("fill", "#000")
        .attr("transform", "translate( "+ (5-margin.left) +", "+ (height1+height2/2) +") rotate(-90)")
        .attr("dy", "0.71em")
        .style("font-size","12px")
        .attr("text-anchor", "middle")
        .text("%B");
      }
    });

    var refL = plotSvg.selectAll('.ref-line').data(refLines);
    refL.exit().remove();
    refL.enter().append('line').merge(refL)
      .attr("class",'ref-line')
      .attr("x1",0)
      .attr("x2",width)
      .transition().duration(1000)
      .attr("y1",function(d){
        return y2(d.y1);
      })
      .attr("y2",function(d){
        return y2(d.y2);
      })
      .attr("stroke",function(d){
        return d.stroke;
      })
      .attr("stroke-dasharray","3,3");

    var bandArea = d3.area()
  		    	  .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
  		      	.y0(function(d) { return y1(d["BB_BOTTOM"]); })
  		      	.y1(function(d) { return y1(d["BB_TOP"]); });
    var _bandArea = d3.area()
  		    	  .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
  		      	.y0(function(d) { return y1((d["BB_BOTTOM"]+d["BB_TOP"])/2); })
  		      	.y1(function(d) { return y1((d["BB_BOTTOM"]+d["BB_TOP"])/2); });
    var bbArea = plotSvg.selectAll("path.bb-band").data([indicatorToDraw]);
    bbArea.exit().remove();
    bbArea.enter().append("path").merge(bbArea)
            .datum(data.filter(function(d){
              return d["%B"]!==null;
            }))
  		    	.attr("class", "bb-band")
            .style("opacity",0)
            .attr("d", _bandArea)
            .transition().duration(1000)
  		    	.attr("d", bandArea)
            .attr("fill",colorPallete["BB_band"])
            .style("opacity",0.2);


    var linesToDraw = ["Adj Close","%B","BB_TOP","BB_BOTTOM"];
    var curve = d3.line()
            .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              if (d.secondY){
                return y2(d["val"]);
              }
              else{
                return y1(d["val"]);
              }
            })
            .curve(d3.curveMonotoneX);
    var indCurve = plotSvg.selectAll(".indicator-curve").data(linesToDraw);
    indCurve.exit().remove();
    indCurve.enter().append("path").merge(indCurve)
    .attr("class",function(p){
      return "indicator-curve indicator-curve_"+p;
    })
    .attr("stroke", function(p){
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return p=="%B"? 2:1;
    })
    .datum(function(p){
      return data.filter(function(_d){return _d[p]!==null;}).map(function(_d){return {"val":_d[p],"Date":_d.Date,"secondY":p=="%B"};});
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");


    var indTrigger = plotSvg.selectAll('g.indicator-trigger')
      .data([indicatorToDraw]);
    indTrigger.exit().remove();
    indTrigger.enter().append("g").merge(indTrigger)
    .attr("class",function(p){
      return "indicator-trigger indicator-trigger_"+p;
    });
    var dayTraded = plotSvg.selectAll('g.indicator-trigger').selectAll('.day-traded')
      .data(data.filter(function(d){
        return d.trade!==0;
      }));
      dayTraded.exit().transition().duration(1000).attr("y1",height).remove();
      dayTraded.enter().append('line').merge(dayTraded)
      .attr("class",'day-traded')
      .attr('x1', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr('x2', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr("y1",height)
      .attr("y2",height)
      .attr("stroke", function(d){
        return d.trade>0? colorPallete["indicatorBuy"]:colorPallete["indicatorSell"];
      })
      .attr("stroke-width", x.bandwidth())
      .attr("opacity",0.4)
      .attr("class",function(d,i){
        return d.trade>0? "indicator-buy day-traded":"indicator-sell day-traded";
      })
      .transition().duration(1000).attr("y1",0);

      plotSvg.selectAll('.day-traded')
      .on("mouseover",function(d,i){
        d3.select(this).attr("opacity",0.25);
        var info = {"left":[],"right":""};
        info["left"].push({"key":"Date", "value":d3.timeFormat("%-Y/%-m/%-d")(d.Date)});
        ["Open","Close","High","Low","Adj Close","Volume"].forEach(function(key){
          info["left"].push({"key":key, "value":d[key]});
        });
        info["left"].push({"key":"%B", "value":d3.format(".4f")(d["%B"])});

        if (d.trade>0 && indicatorParams[indicatorToDraw].rules.length>0 && d.rule>=0){
          var rule = indicatorParams[indicatorToDraw].rules[0]; // buying rule
          // info["right"] = "Triggered by "+indicatorToDraw+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a buying signal.";
          info["right"] = rule.tip;
        }
        else if (d.trade<0 && indicatorParams[indicatorToDraw].rules.length>1 && d.rule>=0){
          var rule = indicatorParams[indicatorToDraw].rules[1]; // selling rule
          info["right"] = "Triggered by "+indicatorToDraw+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a selling signal.";
          info["right"] = rule.tip;
        }
        tooltip.show(info);
      })
      .on("mouseout",function(d,i){
        tooltip.hide();
        d3.select(this).attr("opacity",0.4);
      });

  }

  function drawMAIndicatorChart(policyReturnData,indicatorToDraw,indicatorParams,chartContainerInfo,refLines,tooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var height1 = height * 0.5;
    var height2 = height * 0.5;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;
    var secondY = indicatorToDraw+"P"; // SMAP or EMAP
    var data = policyReturnData[indicatorToDraw];
    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(tooltip);

    // titleSvg.selectAll(".chart-title").remove();
    // titleSvg.append("text")
    // .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    // .attr("class","chart-title")
    // .text(chartContainerInfo.title);
    titleSvg.selectAll("g.legend").remove();
    var legendG = titleSvg.selectAll("g.legend").data(["Adj Close",indicatorToDraw,secondY,"indicatorBuy","indicatorSell","refLine"])
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      if (i==1){
        return "translate(" + (margin.left+75*i+20) + "," +0 + ")"
      }
      if (i>2){
        return "translate(" + (margin.left+75*i+80) + "," +0 + ")"
      }
      return "translate(" + (margin.left+75*i+5) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){return colorPallete[d];})
    .style("stroke-width",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return 8;
      }
      else if(d=="refLine"){
        return 1;
      }
      return 2;
    })
    .style("stroke-opacity",function(d){
      return (d=="indicatorBuy" || d == "indicatorSell")?0.4:1;
    })
    .style("stroke-dasharray",function(d){
      return d=="refLine"?"3,3":"1,0";
    });
    legendG.append("text")
    .text(function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return d=="indicatorBuy"?"Buy":"Sell";
      }
      if(d==secondY){
        return "Price/"+indicatorToDraw+" Ratio";
      }
      if(d=="refLine"){
        return "Threshold";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");

    var x = d3.scaleBand().rangeRound([0, width]).padding(0.15)
        .domain(data.map(function(_d){return _d.Date;}));
    var y1 = d3.scaleLinear().range([height1, 0])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d[indicatorToDraw];})),d3.max(data.map(function(_d){return _d[indicatorToDraw];}))],minMaxBuffer));
    var y2 = d3.scaleLinear().range([height1+height2, height1])
        .domain(relaxMinMax([d3.min(data.map(function(_d){return _d[secondY];})),d3.max(data.map(function(_d){return _d[secondY];}))],minMaxBuffer));

    plotSvg.selectAll("g.x-axis").data([0,1])
    .enter()
    .append("g").attr("class", "x-axis")
    .attr("transform", function(d,i){
      var heights = [height1, height];
      return "translate("+0 +"," + heights[i] + ")"
    });
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0,1]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").each(function(d,i){
      if (i==0){
        d3.select(this).transition().duration(1000).call(d3.axisLeft(y1));
      }
      else{
        d3.select(this).transition().duration(1000)
        .call(d3.axisLeft(y2).ticks(4));
        d3.select(this).selectAll(".axis-title").remove();
        d3.select(this).append("text").attr("class","axis-title")
        .attr("fill", "#000")
        .attr("transform", "translate( "+ (5-margin.left) +", "+ (height1+height2/2) +") rotate(-90)")
        .attr("dy", "0.71em")
        .style("font-size","12px")
        .attr("text-anchor", "middle")
        .text("Price/"+indicatorToDraw);
      }
    });

    var refL = plotSvg.selectAll('.ref-line').data(refLines);
    refL.exit().remove();
    refL.enter().append('line').merge(refL)
      .attr("class",'ref-line')
      .attr("x1",0)
      .attr("x2",width)
      .transition().duration(1000)
      .attr("y1",function(d){
        return y2(d.y1);
      })
      .attr("y2",function(d){
        return y2(d.y2);
      })
      .attr("stroke",function(d){
        return d.stroke;
      })
      .attr("stroke-dasharray","3,3");

    var linesToDraw = ["Adj Close",indicatorToDraw,secondY];
    var curve = d3.line()
            .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              if (d.secondY){
                return y2(d["val"]);
              }
              else{
                return y1(d["val"]);
              }
            })
            .curve(d3.curveMonotoneX);
    var indCurve = plotSvg.selectAll(".indicator-curve").data(linesToDraw);
    indCurve.exit().remove();
    indCurve.enter().append("path").merge(indCurve)
    .attr("class",function(p){
      return "indicator-curve indicator-curve_"+p;
    })
    .attr("stroke", function(p){
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return p!=="Adj Close" ? 2:1;
    })
    .datum(function(p){
      return data.filter(function(_d){return _d[p]!==null;}).map(function(_d){return {"val":_d[p],"Date":_d.Date,"secondY":p==secondY};});
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");

    var indTrigger = plotSvg.selectAll('g.indicator-trigger')
      .data([indicatorToDraw]);
    indTrigger.exit().remove();
    indTrigger.enter().append("g").merge(indTrigger)
    .attr("class",function(p){
      return "indicator-trigger indicator-trigger_"+p;
    });
    var dayTraded = plotSvg.selectAll('g.indicator-trigger').selectAll('.day-traded')
      .data(data.filter(function(d){
        return d.trade!==0;
      }));
      dayTraded.exit().transition().duration(1000).attr("y1",height).remove();
      dayTraded.enter().append('line').merge(dayTraded)
      .attr("class",'day-traded')
      .attr('x1', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr('x2', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr("y1",height)
      .attr("y2",height)
      .attr("stroke", function(d){
        return d.trade>0? colorPallete["indicatorBuy"]:colorPallete["indicatorSell"];
      })
      .attr("stroke-width", x.bandwidth())
      .attr("opacity",0.4)
      .attr("class",function(d,i){
        return d.trade>0? "indicator-buy day-traded":"indicator-sell day-traded";
      })
      .transition().duration(1000).attr("y1",0);

      plotSvg.selectAll('.day-traded')
      .on("mouseover",function(d,i){
        d3.select(this).attr("opacity",0.25);
        var info = {"left":[],"right":""};
        info["left"].push({"key":"Date", "value":d3.timeFormat("%-Y/%-m/%-d")(d.Date)});
        ["Open","Close","High","Low","Adj Close","Volume"].forEach(function(key){
          info["left"].push({"key":key, "value":d[key]});
        });
        info["left"].push({"key":indicatorToDraw, "value":d3.format(".4f")(d[indicatorToDraw])});

        if (d.trade>0 && indicatorParams[indicatorToDraw].rules.length>0 && d.rule>=0){
          var rule = indicatorParams[indicatorToDraw].rules[d.rule]; // buying rule
          // info["right"] = "Triggered by "+indicatorToDraw+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a buying signal.";
          info["right"] = rule.tip;
        }
        else if (d.trade<0 && indicatorParams[indicatorToDraw].rules.length>1 && d.rule>=0){
          var rule = indicatorParams[indicatorToDraw].rules[d.rule]; // selling rule
          // info["right"] = "Triggered by "+indicatorToDraw+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a selling signal.";
          info["right"] = rule.tip;
        }
        tooltip.show(info);
      })
      .on("mouseout",function(d,i){
        tooltip.hide();
        d3.select(this).attr("opacity",0.4);
      });

  }

  function drawPolicyReturnChart(policyReturnData,performanceStats,policiesToDraw,chartContainerInfo,tooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;

    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(tooltip);

    titleSvg.selectAll(".chart-title").remove();
    titleSvg.append("text")
    .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    .attr("class","chart-title")
    .text(chartContainerInfo.title);

    titleSvg.selectAll("g.legend").remove();
    var legendG = titleSvg.selectAll("g.legend").data(policiesToDraw)
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      return "translate(" + (margin.left+70*i+145) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){return colorPallete[d];})
    .style("stroke-width",2);
    legendG.append("text")
    .text(function(d){
      if (d=="sim"){
        return "Simulation";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");


    var performanceStatsTable = {};
    Object.keys(performanceStats).forEach(function(policy){
      performanceStatsTable[policy] = objToTooltipHelper(performanceStats[policy],[{"cumReturn":"Cum. Return"},{"avgDailyReturn":"Avg. Daily Return"},{"stdDailyReturn":"Std. Daily Return"},{"sharpeRatio":"Sharpe Ratio"}]);
    });

    // find out range of return for all policies
    var yMin = Number.POSITIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;
    policiesToDraw.forEach(function(p){
      policyReturnData[p].forEach(function(d){
        yMin = d["value"] < yMin? d["value"] : yMin;
        yMax = d["value"] > yMax? d["value"] : yMax;
      });
    });
    var investment = policyReturnData[policiesToDraw[0]][0].value;
    yMin = yMin/investment - 1;
    yMax = yMax/investment - 1; // convert to value to cum return
    var x = d3.scaleBand().range([0, width]).padding(0.1)
        .domain(policyReturnData[policiesToDraw[0]].map(function(_d){return _d.Date;}));
    var y = d3.scaleLinear().range([height, 0])
        .domain(relaxMinMax([yMin, yMax],minMaxBuffer));
    plotSvg.selectAll("g.x-axis").data([0]).enter()
    .append("g").attr("class", "x-axis")
      .attr("transform", "translate("+0 +"," + height + ")");
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(policyReturnData[policiesToDraw[0]].filter(function(_d,i){ return _d.Date.getDate()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0]).enter()
    .append("g").attr("class", "y-axis")
    .attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").transition().duration(1000).call(d3.axisLeft(y));


    var curve = d3.line()
            .x(function(d, i) {
              return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              return y(d["value"]/investment-1);
            })
            .curve(d3.curveMonotoneX);

    var retCurve = plotSvg.selectAll(".return-curve").data(policiesToDraw);

    retCurve.exit().remove();
    retCurve.enter()
    .append("path")
    .merge(retCurve)
    .attr("class",function(p){
      return "return-curve return-curve_"+p;
    })
    .attr("stroke", function(p){
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return 2;
    })
    .datum(function(p){
      return policyReturnData[p];
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");

    plotSvg.selectAll(".return-curve")
    .on("mouseover",function(){
      var classNames = d3.select(this).attr("class").split("_");
      var p = classNames[classNames.length-1];
      // plotSvg.selectAll(".return-curve_"+p).attr("stroke-width",3);
      d3.select(this).attr("stroke-width",3);
      var info = [{"key":"Policy", "value":p}];
      info = info.concat(performanceStatsTable[p]);
      tooltip.show(info)
      .style("left", (d3.event.pageX-100) + "px")
      .style("top", (d3.event.pageY - 120) + "px");
    })
    .on("mouseout",function(){
      tooltip.hide();
      // plotSvg.selectAll(".return-curve").attr("stroke-width",1);
      d3.select(this).attr("stroke-width",2);
    });
  }

  function drawGenericIndicatorChart(policyReturnData,indicatorsToDraw,indicatorParams,chartContainerInfo,refLines,tooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth - margin.right;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;
    var data = policyReturnData[indicatorsToDraw[0]]; // any data contains all indicator values
    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(tooltip);

    titleSvg.selectAll("g.legend").remove();
    var legends = indicatorsToDraw.concat(["indicatorBuy","indicatorSell"]);
    refLines.length && legends.push("refLine");
    var legendG = titleSvg.selectAll("g.legend").data(legends)
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      return "translate(" + (margin.left+75*i+5) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){
      if (d=="sim"){
        return colorPallete["Adj Close"];
      }
      return colorPallete[d];
    })
    .style("stroke-width",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return 8;
      }
      else if(d=="refLine"){
        return 1;
      }
      return 2;
    })
    .style("stroke-opacity",function(d){
      return (d=="indicatorBuy" || d == "indicatorSell")?0.4:1;
    })
    .style("stroke-dasharray",function(d){
      return d=="refLine"?"3,3":"1,0";
    });
    legendG.append("text")
    .text(function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return d=="indicatorBuy"?"Buy":"Sell";
      }
      if(d=="refLine"){
        return "Threshold";
      }
      if(d=="sim"){
        return "Adj Close";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");

    // find out range of return for all policies
    var yMin = Number.POSITIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;
    indicatorsToDraw.forEach(function(ind){
      if (ind=="sim"){
        ind = "Adj Close";
      }
      data.forEach(function(d){
        yMin = d[ind] < yMin? d[ind] : yMin;
        yMax = d[ind] > yMax? d[ind] : yMax;
      });
    });
    var x = d3.scaleBand().rangeRound([0, width]).padding(0.15)
        .domain(data.map(function(_d){return _d.Date;}));
    var y = d3.scaleLinear().range([height, 0])
        .domain(relaxMinMax([yMin, yMax],minMaxBuffer));

    plotSvg.selectAll("g.x-axis").data([0])
    .enter().append("g").attr("class", "x-axis")
      .attr("transform", "translate("+0 +"," + height + ")");
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").transition().duration(1000).call(d3.axisLeft(y));

    var refL = plotSvg.selectAll('.ref-line').data(refLines);
    refL.exit().remove();
    refL.enter().append('line').merge(refL)
      .attr("class",'ref-line')
      .attr("x1",0)
      .attr("x2",width)
      .transition().duration(1000)
      .attr("y1",function(d){
        return y(d.y1);
      })
      .attr("y2",function(d){
        return y(d.y2);
      })
      .attr("stroke",function(d){
        return d.stroke;
      })
      .attr("stroke-dasharray","3,3");


    var curve = d3.line()
            .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              return y(d["val"]);
            })
            .curve(d3.curveMonotoneX);
    var indCurve = plotSvg.selectAll(".indicator-curve").data(indicatorsToDraw);
    indCurve.exit().remove();
    indCurve.enter().append("path").merge(indCurve)
    .attr("class",function(p){
      return "indicator-curve indicator-curve_"+p;
    })
    .attr("stroke", function(p){
      if (p=="sim"){
        return colorPallete["Adj Close"];
      }
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return 2;
    })
    .datum(function(p){
      if (p=="sim"){
        p = "Adj Close";
      }
      return data.filter(function(_d){return _d[p]!==null;}).map(function(_d){return {"val":_d[p],"Date":_d.Date};});
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");

    var indTrigger = plotSvg.selectAll('g.indicator-trigger')
      .data(indicatorsToDraw);
    indTrigger.exit().remove();
    indTrigger.enter().append("g").merge(indTrigger)
    .attr("class",function(p){
      return "indicator-trigger indicator-trigger_"+p;
    });
    var dayTraded = plotSvg.selectAll('g.indicator-trigger').selectAll('.day-traded')
      .data(data.filter(function(d){
        return d.trade!==0;
      }));
      dayTraded.exit().transition().duration(1000).attr("y1",height).remove();
      dayTraded.enter().append('line').merge(dayTraded)
      .attr("class",'day-traded')
      .attr('x1', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr('x2', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr("y1",height)
      .attr("y2",height)
      .attr("stroke", function(d){
        return d.trade>0? colorPallete["indicatorBuy"]:colorPallete["indicatorSell"];
      })
      .attr("stroke-width", x.bandwidth())
      .attr("opacity",0.4)
      .attr("class",function(d,i){
        return d.trade>0? "indicator-buy day-traded":"indicator-sell day-traded";
      })
      .transition().duration(1000).attr("y1",0);

      plotSvg.selectAll('.day-traded')
      .on("mouseover",function(d,i){
        d3.select(this).attr("opacity",0.25);
        var info = {"left":[],"right":""};
        info["left"].push({"key":"Date", "value":d3.timeFormat("%-Y/%-m/%-d")(d.Date)});
        ["Open","Close","High","Low","Adj Close","Volume"].forEach(function(key){
          info["left"].push({"key":key, "value":d[key]});
        });
        var classes = d3.select(this.parentNode).attr("class").split("_");
        indicatorsToDraw.forEach(function(key){
          if(key!=="sim"){
            info["left"].push({"key":key, "value":d3.format(".4f")(d[key])});
          }
        });

        var key = classes[classes.length-1];
        if (key=="sim"){
          Object.keys(indicatorParams[key].indicators).forEach(function(_key){
            if (indicatorParams[key].indicators[_key].on){
              if (_key=="BB"){
                info["left"].push({"key":"%B", "value":d3.format(".4f")(d["%B"])});
              }
              else{
                info["left"].push({"key":_key, "value":d3.format(".4f")(d[_key])});
              }
            }
          });

          if (d.trade>0){
            info["right"] = "Purchased "+d3.format(".0f")(d.trade)+" shares. Currently holding "+d.holding+" shares, with $"+d3.format(".2f")(d.cash)+" in cash. Cumulative return is "+d3.format(".4f")(d.value/data[0].value)+".";
          }
          else if (d.trade<0){
            info["right"] = "Sold "+d3.format(".0f")(-d.trade)+" shares. Currently holding "+d.holding+" shares, with $"+d3.format(".2f")(d.cash)+" in cash. Cumulative return is "+d3.format(".4f")(d.value/data[0].value)+".";
          }
        }
        else{
          if (d.trade>0 && indicatorParams[key].rules.length>0 && d.rule>=0){
            var rule = indicatorParams[key].rules[d.rule]; // buying rule
            //info["right"] = "Triggered by "+key+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a buying signal.";
            info["right"] = rule.tip;
          }
          else if (d.trade<0 && indicatorParams[key].rules.length>1 && d.rule>=0){
            var rule = indicatorParams[key].rules[d.rule]; // selling rule
            // info["right"] = "Triggered by "+key+". "+rule.field +" "+rule.relation+" "+rule.threshold+" "+rule.thresholdRelativeTo+" is a selling signal.";
            info["right"] = rule.tip;
          }
        }
        tooltip.show(info);
      })
      .on("mouseout",function(d,i){
        tooltip.hide();
        d3.select(this).attr("opacity",0.4);
      });
  }

  function setUpSimulationChartHtml(options){
    d3.select(options.selector)
    .style("height",options.height+"px")
    .style("width",options.divWidth+"px");
    d3.select(options.selector + " .title-svg-container")
    .style("width",options.divWidth+"px");
    d3.select(options.selector +" .title-svg-container .chart-title")
    .attr("width",options.divWidth)
    .attr("height",options.margin.top);

    d3.select(options.selector +" .fixed-svg-container")
    .style("width",options.margin.left+"px");
    d3.select(options.selector+" .fixed-svg-container .chart-left")
    .attr("width",options.margin.left)
    .attr("height",options.height-options.margin.top);

    d3.select(options.selector+" .scorll-svg-container")
    .style("width",(options.divWidth-options.margin.left-options.margin.right)+"px");
    d3.select(options.selector + " .scorll-svg-container .chart-plot")
    .attr("width",options.svgWidth)
    .attr("height",options.height-options.margin.top);

    d3.select(options.selector +" .fixed-svg-container-right")
    .style("width",options.margin.right+"px");
    d3.select(options.selector+" .fixed-svg-container-right .chart-right")
    .attr("width",options.margin.right)
    .attr("height",options.height-options.margin.top);
  }

  function updateChartsForSimulation(policyReturnData,performanceStats,simParams){
    var dayWidth = 9;
    var dayPadding = 0.15;

    ["train","test"].forEach(function(t){
      data = policyReturnData[t]["sim"];
      var totalPlotWidth = dayWidth*data.length + dayWidth*dayPadding*2;
      var visibleWidth = simulationChartWidth - simulationChartMargin.left - simulationChartMargin.right;
      totalPlotWidth = totalPlotWidth<visibleWidth? visibleWidth:totalPlotWidth;

      var options = {
        "selector":simParams["chartLocation"]+" .simulation-chart-"+t,
        "height": simParams["chartHeight"],
        "divWidth":simulationChartWidth, // 600px
        "svgWidth": totalPlotWidth,
        "margin": simulationChartMargin
      };
      setUpSimulationChartHtml(options);

      var chartContainerInfo = {
        type:t, // training or testing
        selector:options.selector,
        margin:options.margin,
        plotHeight: options.height - options.margin.top,
        plotWidth:options.svgWidth,
        titleWidth:options.divWidth,
        title:t=="train"?"Training Performance":"Testing Performance",
        minMaxBuffer:[-0.2,0.2] // leave some space on y axis
      };
      drawSimulationChart(policyReturnData[t],performanceStats[t],simParams,chartContainerInfo,simulationStatsTooltip,simulationTriggerTooltip);
    });

  }

  function _drawSimulationChart(policyReturnData,performanceStats,simParams,chartContainerInfo,statsTooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;
    var policiesToDraw = ["sim","static"];
    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var rightSvg = d3.select(selector+ " .chart-right");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(statsTooltip);

    titleSvg.selectAll(".chart-title").remove();
    titleSvg.append("text")
    .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    .attr("class","chart-title")
    .text(chartContainerInfo.title);

    titleSvg.selectAll("g.legend").remove();
    var legendG = titleSvg.selectAll("g.legend").data(policiesToDraw.concat(["indicatorBuy","indicatorSell","Adj Close"]))
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      return "translate(" + (margin.left+70*i+145) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){
      if (d=="Adj Close"){
        return colorPallete["Adj Close sim"];
      }
      return colorPallete[d];
    })
    .style("stroke-width",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return 8;
      }
      else if(d=="refLine"){
        return 1;
      }
      return 2;
    })
    .style("stroke-opacity",function(d){
      return (d=="indicatorBuy" || d == "indicatorSell")?0.4:1;
    })
    .style("stroke-dasharray",function(d){
      return d=="refLine"?"3,3":"1,0";
    });
    legendG.append("text")
    .text(function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return d=="indicatorBuy"?"Buy":"Sell";
      }
      if(d=="refLine"){
        return "Threshold";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");


    var performanceStatsTable = {};
    Object.keys(performanceStats).forEach(function(policy){
      performanceStatsTable[policy] = objToTooltipHelper(performanceStats[policy],[{"cumReturn":"Cum. Return"},{"avgDailyReturn":"Avg. Daily Return"},{"stdDailyReturn":"Std. Daily Return"},{"sharpeRatio":"Sharpe Ratio"}]);
    });

    // find out range of return for all policies
    var yMin = Number.POSITIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;
    policiesToDraw.forEach(function(p){
      policyReturnData[p].forEach(function(d){
        yMin = d["value"] < yMin? d["value"] : yMin;
        yMax = d["value"] > yMax? d["value"] : yMax;
      });
    });
    var investment = policyReturnData[policiesToDraw[0]][0].value;
    yMin = yMin/investment - 1;
    yMax = yMax/investment - 1; // convert to value to cum return
    var x = d3.scaleBand().range([0, width]).padding(0.1)
        .domain(policyReturnData["sim"].map(function(_d){return _d.Date;}));
    var y1 = d3.scaleLinear().range([height, 0])
        .domain(relaxMinMax([yMin, yMax],minMaxBuffer));
    var y2 = d3.scaleLinear().range([height,0])
        .domain(relaxMinMax([d3.min(policyReturnData["sim"].map(function(_d){return _d["Adj Close"];})),d3.max(policyReturnData["sim"].map(function(_d){return _d["Adj Close"];}))],minMaxBuffer));

    plotSvg.selectAll("g.x-axis").data([0])
    .enter().append("g").attr("class", "x-axis")
      .attr("transform", "translate("+0 +"," + height + ")");
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));

    leftSvg.selectAll("g.y-axis").data([0]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").transition().duration(1000).call(d3.axisLeft(y1));

    rightSvg.selectAll("g.y-axis").data([0]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (0) + "," +0 + ")");
    rightSvg.selectAll("g.y-axis").transition().duration(1000).call(d3.axisRight(y2));

    var curve = d3.line()
            .x(function(d, i) {
              return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              return y1(d["value"]/investment-1);
            })
            .curve(d3.curveMonotoneX);

    var retCurve = plotSvg.selectAll(".return-curve").data(policiesToDraw);

    retCurve.exit().remove();
    retCurve.enter()
    .append("path")
    .merge(retCurve)
    .attr("class",function(p){
      return "return-curve return-curve_"+p;
    })
    .attr("stroke", function(p){
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return 2;
    })
    .datum(function(p){
      return policyReturnData[p];
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");

    plotSvg.selectAll(".return-curve")
    .on("mouseover",function(){
      var classNames = d3.select(this).attr("class").split("_");
      var p = classNames[classNames.length-1];
      // plotSvg.selectAll(".return-curve_"+p).attr("stroke-width",3);
      d3.select(this).attr("stroke-width",3);
      var info = [{"key":"Policy", "value":p}];
      info = info.concat(performanceStatsTable[p]);
      statsTooltip.show(info)
      .style("left", (d3.event.pageX-100) + "px")
      .style("top", (d3.event.pageY - 120) + "px");
    })
    .on("mouseout",function(){
      statsTooltip.hide();
      // plotSvg.selectAll(".return-curve").attr("stroke-width",1);
      d3.select(this).attr("stroke-width",2);
    });
  }
  function drawSimulationChart(policyReturnData,performanceStats,simParams,chartContainerInfo,statsTooltip,triggerTooltip){
    var margin = chartContainerInfo.margin;
    var width = chartContainerInfo.plotWidth;
    var height = chartContainerInfo.plotHeight-margin.bottom;
    var height1 = height/2;
    var height2 = height - height1;
    var selector = chartContainerInfo.selector;
    var minMaxBuffer = chartContainerInfo.minMaxBuffer;
    var policiesToDraw = ["sim","static"];
    var titleSvg = d3.select(selector+ " .chart-title");
    var leftSvg = d3.select(selector+ " .chart-left");
    var rightSvg = d3.select(selector+ " .chart-right");
    var plotSvg = d3.select(selector+ " .chart-plot");

    plotSvg.call(statsTooltip);
    plotSvg.call(triggerTooltip);

    titleSvg.selectAll(".chart-title").remove();
    titleSvg.append("text")
    .attr("transform","translate(" + (margin.left+5) + "," + (margin.top-5) + ")")
    .attr("class","chart-title")
    .text(chartContainerInfo.title);

    titleSvg.selectAll("g.legend").remove();
    var legendG = titleSvg.selectAll("g.legend").data(policiesToDraw.concat(["indicatorBuy","indicatorSell","Adj Close"]))
    .enter()
    .append("g")
    .attr("class","legend")
    .attr("transform",function(d,i){
      return "translate(" + (margin.left+70*i+145) + "," +0 + ")"
    });
    legendG.append("line")
    .attr("x1",0).attr("x2",20)
    .attr("y1",margin.top/2).attr("y2",margin.top/2)
    .style("stroke",function(d){
      if (d=="Adj Close"){
        return colorPallete["Adj Close sim"];
      }
      return colorPallete[d];
    })
    .style("stroke-width",function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return 8;
      }
      else if(d=="refLine"){
        return 1;
      }
      return 2;
    })
    .style("stroke-opacity",function(d){
      return (d=="indicatorBuy" || d == "indicatorSell")?0.4:1;
    })
    .style("stroke-dasharray",function(d){
      return d=="refLine"?"3,3":"1,0";
    });
    legendG.append("text")
    .text(function(d){
      if(d=="indicatorBuy" || d == "indicatorSell"){
        return d=="indicatorBuy"?"Buy":"Sell";
      }
      if(d=="refLine"){
        return "Threshold";
      }
      return d;
    })
    .attr("transform","translate(" + 25 + "," +(margin.top/2+5) + ")");


    var performanceStatsTable = {};
    Object.keys(performanceStats).forEach(function(policy){
      performanceStatsTable[policy] = objToTooltipHelper(performanceStats[policy],[{"cumReturn":"Cum. Return"},{"avgDailyReturn":"Avg. Daily Return"},{"stdDailyReturn":"Std. Daily Return"},{"sharpeRatio":"Sharpe Ratio"}]);
    });

    // find out range of return for all policies
    var yMin = Number.POSITIVE_INFINITY;
    var yMax = Number.NEGATIVE_INFINITY;
    policiesToDraw.forEach(function(p){
      policyReturnData[p].forEach(function(d){
        yMin = d["value"] < yMin? d["value"] : yMin;
        yMax = d["value"] > yMax? d["value"] : yMax;
      });
    });
    var investment = policyReturnData[policiesToDraw[0]][0].value;
    yMin = yMin/investment - 1;
    yMax = yMax/investment - 1; // convert to value to cum return
    var x = d3.scaleBand().range([0, width]).padding(0.1)
        .domain(policyReturnData["sim"].map(function(_d){return _d.Date;}));
    var y1 = d3.scaleLinear().range([height1, 0])
        .domain(relaxMinMax([d3.min(policyReturnData["sim"].map(function(_d){return _d["Adj Close"];})),d3.max(policyReturnData["sim"].map(function(_d){return _d["Adj Close"];}))],minMaxBuffer));
    var y2 = d3.scaleLinear().range([height1+height2, height1])
        .domain(relaxMinMax([yMin, yMax],[minMaxBuffer[0],minMaxBuffer[1]*5]));

    plotSvg.selectAll("g.x-axis").data([0,1])
    .enter()
    .append("g").attr("class", "x-axis")
    .attr("transform", function(d,i){
      var heights = [height1, height];
      return "translate("+0 +"," + heights[i] + ")"
    });
    plotSvg.selectAll("g.x-axis").transition().duration(1000).call(d3.axisBottom(x)
      .tickValues(data.filter(function(_d){ return _d.Date.getDay()==1;}).map(function(_d){return _d.Date;}))
      .tickFormat(d3.timeFormat("%-m/%-d")));
    leftSvg.selectAll("g.y-axis").data([0,1]).enter()
    .append("g").attr("class", "y-axis").attr("transform","translate(" + (margin.left-1) + "," +0 + ")");
    leftSvg.selectAll("g.y-axis").each(function(d,i){
      if (i==0){
        d3.select(this).transition().duration(1000)
        .call(d3.axisLeft(y1).ticks(4));
        d3.select(this).selectAll(".axis-title").remove();
        d3.select(this).append("text").attr("class","axis-title")
        .attr("fill", "#000")
        .attr("transform", "translate( "+ (5-margin.left) +", "+ (height1/2) +") rotate(-90)")
        .attr("dy", "0.71em")
        .style("font-size","12px")
        .attr("text-anchor", "middle")
        .text("Price");
      }
      else{
        d3.select(this).transition().duration(1000)
        .call(d3.axisLeft(y2).ticks(4));
        d3.select(this).selectAll(".axis-title").remove();
        d3.select(this).append("text").attr("class","axis-title")
        .attr("fill", "#000")
        .attr("transform", "translate( "+ (5-margin.left) +", "+ (height1+height2/2) +") rotate(-90)")
        .attr("dy", "0.71em")
        .style("font-size","12px")
        .attr("text-anchor", "middle")
        .text("Return");
      }
    });

    var curve = d3.line()
            .x(function(d, i) {
              return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
              return y2(d["value"]/investment-1);
            })
            .curve(d3.curveMonotoneX);

    var retCurve = plotSvg.selectAll(".return-curve").data(policiesToDraw);

    retCurve.exit().remove();
    retCurve.enter()
    .append("path")
    .merge(retCurve)
    .attr("class",function(p){
      return "return-curve return-curve_"+p;
    })
    .attr("stroke", function(p){
      return colorPallete[p];
    })
    .attr("stroke-width", function(p){
      return 2;
    })
    .datum(function(p){
      return policyReturnData[p];
    })
    .transition().duration(1000)
    .attr("d",curve)
    .attr("fill", "none");

    plotSvg.selectAll(".return-curve")
    .on("mouseover",function(){
      var classNames = d3.select(this).attr("class").split("_");
      var p = classNames[classNames.length-1];
      // plotSvg.selectAll(".return-curve_"+p).attr("stroke-width",3);
      d3.select(this).attr("stroke-width",3);
      var info = [{"key":"Policy", "value":p}];
      info = info.concat(performanceStatsTable[p]);
      statsTooltip.show(info)
      .style("left", (d3.event.pageX-100) + "px")
      .style("top", (d3.event.pageY - 120) + "px");
    })
    .on("mouseout",function(){
      statsTooltip.hide();
      // plotSvg.selectAll(".return-curve").attr("stroke-width",1);
      d3.select(this).attr("stroke-width",2);
    });


    var curve1 = d3.line()
            .x(function(d, i) { return x(d.Date)+0.5*x.bandwidth();})
            .y(function(d) {
                return y1(d["val"]);
            })
            .curve(d3.curveMonotoneX);
    var indCurve = plotSvg.selectAll(".indicator-curve").data(["Adj Close"]);
    indCurve.exit().remove();
    indCurve.enter().append("path").merge(indCurve)
    .attr("class",function(p){
      return "indicator-curve indicator-curve_"+p;
    })
    .attr("stroke", function(p){
      return p=="Adj Close"? colorPallete[p+" sim"]:colorPallete[p];
    })
    .attr("stroke-width", 2)
    .datum(function(p){
      return data.filter(function(_d){return _d[p]!==null;}).map(function(_d){return {"val":_d[p],"Date":_d.Date};});
    })
    .transition().duration(1000)
    .attr("d",curve1)
    .attr("fill", "none");

    var dayTraded = plotSvg.selectAll('.day-traded')
      .data(policyReturnData["sim"].filter(function(d){
        return d.trade!==0;
      }));
      dayTraded.exit().transition().duration(1000).attr("y1",height).remove();
      dayTraded.enter().append('line').merge(dayTraded)
      .attr("class",'day-traded')
      .attr('x1', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr('x2', function(d) {
          return x(d.Date)+0.5*x.bandwidth();
      })
      .attr("y1",height)
      .attr("y2",height)
      .attr("stroke", function(d){
        return d.trade>0? colorPallete["indicatorBuy"]:colorPallete["indicatorSell"];
      })
      .attr("stroke-width", x.bandwidth())
      .attr("opacity",0.4)
      .attr("class",function(d,i){
        return d.trade>0? "simulation-buy day-traded":"simulation-sell day-traded";
      })
      .transition().duration(1000).attr("y1",0);

      plotSvg.selectAll('.day-traded')
      .on("mouseover",function(d,i){
        d3.select(this).attr("opacity",0.25);
        var info = {"left":[],"right":""};
        info["left"].push({"key":"Date", "value":d3.timeFormat("%-Y/%-m/%-d")(d.Date)});
        ["Open","Close","High","Low","Adj Close","Volume"].forEach(function(key){
          info["left"].push({"key":key, "value":d[key]});
        });
        Object.keys(simParams.indicators).forEach(function(key){
          if (simParams.indicators[key].on){
            if (key=="BB"){
              info["left"].push({"key":"%B", "value":d3.format(".4f")(d["%B"])});
            }
            else{
              info["left"].push({"key":key, "value":d3.format(".4f")(d[key])});
            }
          }
        });

        if (d.trade>0){
          info["right"] = "Purchased "+d3.format(".0f")(d.trade)+" shares. Cumulative return is "+d3.format(".4f")(d.value/investment)+". TODO: Say something about how buying is triggered.";
        }
        else if (d.trade<0){
          info["right"] = "Sold "+d3.format(".0f")(-d.trade)+" shares. Cumulative return is "+d3.format(".4f")(d.value/investment)+". TODO: Say something about how selling is triggered.";
        }
        triggerTooltip.show(info);
      })
      .on("mouseout",function(d,i){
        triggerTooltip.hide();
        d3.select(this).attr("opacity",0.4);
      });

  }

  function objToTooltipHelper(obj,rows){
    var table = [];
    rows.forEach(function(r){
      row = {};
      Object.keys(r).forEach(function(k){
        row["key"] = r[k];
        row["value"] = d3.format(".4f")(obj[k]);
      });
      table.push(row);
    });
    return table;
  }

  function relaxMinMax(value,ratio){
    var relaxed = [];
    ratio = ratio || [0,0];
    value.forEach(function(v,i){
      relaxed.push(v + Math.abs(v)*ratio[i]);
    });
    //console.log("original value",value,"relaxed value",relaxed);
    return relaxed;
  }


  return {
    "updateChartsForIndicator":updateChartsForIndicator
  }
}());

// some global variables for plotting
