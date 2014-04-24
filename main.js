/**
 * Main Application -- does nothing at the moment
 */
var charts = d3.select(".graphic").append('div')
  .attr('class', 'charts');

var hourWidth = 3;
var hourHeight = 8;
var dayWidth = 24 * hourWidth;

var stopMargin = {top: 15,right: 0,bottom: 0,left: 0}
var gridMargin = {top: 10,right: 0,bottom: 0,left: 20}
var dayMargin  = {top: 0, right: 2,bottom: 2,left: 0}

// progress indicator for our large data file
var text = d3.select('.progress')
  .append('p');
var progress = 0;
var total = 3465844;
 
d3.json('perHourStops.json')
  .on('progress', function() {
    var i = d3.interpolate(progress, d3.event.loaded / total);
    text.text('loading data '+d3.format(".0%")(progress));
  })
  .get(function(error, stops) {
    text.remove();

    // render in next event loop to let text settle
    setTimeout(function () {
      charts.selectAll('div.chart')
        .data(stops.stops)
        .enter()
        .append('div')
        .attr('class', 'chart')
        .attr('id', function (d) {return getId(d.name, 'chart') })
        .append('h3')
        .text(function(d) { return d.name })
        .each(drawStop);
    });
  
    function drawStop(stopData, index) {
      setTimeout(function () {
        var daysOfWeek = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    
        var svg = charts.select('#'+getId(stopData.name, 'chart'))
          .append('svg')
          .attr('height', 115)
          .attr('width', 600)
          .append('g')
          .attr('transform', "translate(" + stopMargin.left + "," + stopMargin.top + ")");

        var gridWidth = (dayWidth + dayMargin.right) * 7;
        var gridTranslate = gridWidth + gridMargin.left + gridMargin.right
    
        var entrancesSvg = svg.append('g')
          .attr('class', 'gridSection');
        var exitsSvg = svg.append('g')
          .attr('class', 'gridSection')
          .attr('transform', 'translate('+gridTranslate+',0)');
    
        
        // draw one grid for entrances or exits with axis labels
        // and a heat map for values.  Datatype can be either
        // 'entrances' or 'exits'
        var dayLabels = svg.selectAll('.dayLabel')
          .data(daysOfWeek)
          .enter()
          .append('g')
          .attr('class', 'xAxis');

        dayLabels.append('text')
          .attr('class', 'dayLabel')
          .text(function (d) {return d})
          .attr('dx', function (d, i) {return dayWidth/2})
          .attr('dy', 0)
          .style('text-anchor', 'middle');

        var hourLabelsScale = d3.scale.ordinal()
          .domain(['6am', '12pm', '6pm'])
          .rangePoints([0, dayWidth], 2.0);
        var xAxis = d3.svg.axis()
          .scale(hourLabelsScale)
          .orient('bottom')
          .tickSize(-3);
        dayLabels
          .attr('transform', function(d, i) {return 'translate('+(3 + gridMargin.left + (dayWidth + dayMargin.right) * i) +',0)'})
          .call(xAxis);

        var stop = svg.append('g')
          .attr('width', 400)
          .attr('height', 200)
          .attr('transform', 'translate('+gridMargin.left+','+gridMargin.top+")");

        var colorScale = d3.scale.linear()
          .domain([stops.min, stops.mean, stops.max])
          .range(['white', 'black', 'red']);

        var positionScale = d3.scale.ordinal()
         .rangeRoundBands([0, dayWidth], 0, 0)
         .domain(d3.range(0, 24));

        // console.log(stopData.name);

        // draw the heat map
        stop.selectAll('.exits')
          .data(stopData.times)
          .enter().append('rect')
          .attr('class', 'exits')
          .attr('x', function(d) { return (dayWidth + dayMargin.right) * day(d) + positionScale(hour(d)) })
          .attr('y', function(d) { return (hourHeight + dayMargin.bottom)* (week(d) + 5) })
          .attr('width', hourWidth)
          .attr('height', hourHeight)
          .attr('fill', function(d) { return colorScale(d['exits']) })
          .attr('value', function(d) { return d['exits'] })
          .attr('time', function(d) { return d.time });
        stop.selectAll('.entrances')
          .data(stopData.times)
          .enter().append('rect')
          .attr('class', 'entrances')
          .attr('x', function(d) { return (dayWidth + dayMargin.right) * day(d) + positionScale(hour(d)) })
          .attr('y', function(d) { return (hourHeight + dayMargin.bottom)* week(d) })
          .attr('width', hourWidth)
          .attr('height', hourHeight)
          .attr('fill', function(d) { return colorScale(d['entrances']) })
          .attr('value', function(d) { return d['entrances'] })
          .attr('time', function(d) { return d.time });

        // text label so we can see values
        var infoLabel = svg.append('text')
          .attr('class', 'infoLabel')
          .attr('dy', 4 * (hourHeight+ dayMargin.bottom) + 18)
          .attr('dx', 20)
          .style('text-anchor', 'beginning');

        // add interactivity
        $('html')
        .on('mouseover', '#' + getId(stopData.name, 'chart') + ' rect', function () {
          var d = d3.select(this).datum();
          infoLabel
            .text(getTextForRollover(d, $(this).hasClass('entrances') ? 'entrances' : 'exits'))
            .attr('dx', (dayWidth + dayMargin.right) * day(d));
        })
        .on('mouseout', '#' + getId(stopData.name, 'chart') + ' rect', function () {
          svg.select('.infoLabel').text('');
        });
      });
    }
  });

// our data looks like this
// {
//   "time": "2014-02-01 05:10:00",
//   "entrances": 1,
//   "exits": 1
// }
var format = d3.time.format("%Y-%m-%d %H:%M:%S");
var begining = format.parse('2014-01-26 00:00:00');
var formatForDisplay = d3.time.format("%b %d, %H:%M");

function hour(d) {
  return d.hour;
}

// zero based day of the week
function day(d) {
  return d.day;
}

// zero based week index for february
function week(d) {
  return d.week - 1;
}

function getId(stopName, type) {
  return stopName.replace(/\s+/g, '').replace(/\//g, '') + type;
}

function getId(stopName, type) {
  return stopName.replace(/\s+/g, '').replace(/\//g, '') + type;
}

function getTextForRollover(d, dataType) {
  return moment(d.time).format('M/D h:mma')+' '+d[dataType]+' '+dataType;
}