        'use strict';
        gapi.analytics.ready(function() {
            var dashNS = {
                userFilter: 'none',
                dateRange: {'start-date': 'yesterday', 'end-date': 'today'}
            };


            gapi.analytics.auth.authorize({
                container: 'embed-api-auth-container',
                clientid: '358104014451-02duldjjicu85olvisf18jcm6t297oj7.apps.googleusercontent.com'
              });

            $( '#reporterFilter' ).on('change', function(){
                dashNS.userFilter = $("#reporterFilter").val();
                articleTraffic(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                referalDetail(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                trafficByDayHour(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                thirtyDayTotals(dashNS.userFilter);
              });

            var dateRangeSelector = new gapi.analytics.ext.DateRangeSelector({
                container: 'date-range-selector'
            })
                .set(dashNS.dateRange)
                .execute();

            dateRangeSelector.on('change', function(data){
                dashNS.dateRange = data;
                articleTraffic(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                referalDetail(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                trafficByDayHour(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
            });

              function articleTraffic(dateStart, dateEnd, reporter, storyHed){
                  $('#todayTraffic').html(loadingIcon);

                  var rawTraffic = new gapi.analytics.report.Data({
                      query: {
                          ids: 'ga:60921314',
                          metrics: 'ga:uniquePageviews, ga:pageviews, ga:avgTimeOnPage',
                          'start-date': dateStart,
                          'end-date': dateEnd,
                          dimensions: 'ga:dimension2',
                          sort: '-ga:uniquePageviews'
                      }
                  });

                  if (reporter != 'none'){
                      rawTraffic.set({query: {filters: 'ga:dimension1=@' + reporter}});
                  } else {
                    rawTraffic.set({query: {filters: 'ga:pagePath=@article'}});
                  };

                  if (typeof storyHed != 'undefined'){
                      rawTraffic.set({query: {filters: 'ga:dimension2=@' + storyHed}});
                  };

                  rawTraffic.on('success', function(response){
                          /*$("#go-button").toggleClass('disabled');*/
                          var totals, u, p, t, s, stories, tales, article;

                          totals = response.totalsForAllResults;
                          u = parseInt(totals['ga:uniquePageviews']).toLocaleString();
                          p = parseInt(totals['ga:pageviews']).toLocaleString();
                          t = totals['ga:avgTimeOnPage'];
                          s = toHHMMSS(t);

                          $( '#totalUnique' ).html(u);
                          $( '#totalPages').html(p);
                          $( '#totalAveTime').html(s);

                          stories = [];
                          tales = response.rows.slice(0,15);
                          tales.forEach(function(row){
                              article = {title:row[0], uniques:row[1], pageviews:row[2], avetime: toHHMMSS(row[3])};
                              stories.push(article);
                          });

                          var source = $("#daily-table").html();
                          var template = Handlebars.compile(source);
                          var html = template(stories);

                          $('#todayTraffic').html(html);
                          /*var heds = $('#todayTraffic th.hed')*/
                          if (storyHed === undefined){
                              $('#todayTraffic tbody').one( "click", "th.hed", function(){
                                    storyHed = $( this ).text();
                                    articleTraffic(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], reporter, storyHed);
                                    referalDetail(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], reporter, storyHed);
                                    trafficByDayHour(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], reporter, storyHed);
                                    /*$("#go-button").toggleClass('disabled');*/
                              });
                          } else {
                            $('#todayTraffic tbody').on("click", "th.hed", function(){
                                      storyHed = undefined;
                                      articleTraffic(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                                      referalDetail(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                                      trafficByDayHour(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                                      /*$("#go-button").toggleClass('disabled');*/

                                    });
                              }
                      });

                  rawTraffic.execute();
              }

              function referalDetail(dateStart, dateEnd, reporter, storyHed){

                  var dailyRefer, referalSources, refer;
                  $('#todayReferral').html(loadingIcon);
                  dailyRefer = new gapi.analytics.report.Data({

                          query: {
                                  ids: 'ga:60921314',
                                  metrics: 'ga:uniquePageviews, ga:pageviews',
                                  dimensions: 'ga:source',
                                  'start-date': dateStart,
                                  'end-date': dateEnd,
                                  sort: '-ga:uniquePageviews',
                                  'max-results': '10'
                          }
                      });

                  if (reporter != 'none'){
                      dailyRefer.set({query: {filters: 'ga:dimension1=@' + reporter}});
                  }


                  if (typeof storyHed != 'undefined'){
                      dailyRefer.set({query: {filters: 'ga:dimension2=@' + storyHed}});
                  }

                  dailyRefer.on('success', function(response){
                      /*console.log(response);*/
                      referalSources = [];
                      response.rows.forEach(function(row){
                          refer = {site:row[0], uniques:row[1], pageviews:row[2]};
                          /*console.log(refer)*/
                          referalSources.push(refer);
                      });

                      var source = $( "#referral-table").html();
                      var template = Handlebars.compile(source);
                      var html = template(referalSources);
                      $( '#todayReferral' ).html(html);
                  });


                  dailyRefer.execute();
              }

              function trafficByDayHour(dateStart, dateEnd, reporter, storyHed){
                  var s, e, sd, ed, d, hourlyMetrics;
                  hourlyMetrics = new gapi.analytics.googleCharts.DataChart({
                      query: {
                          ids: 'ga:60921314',
                          metrics: 'ga:uniquePageviews, ga:pageviews',
                          dimensions: 'ga:dateHour',
                          'start-date': dateStart,
                          'end-date': dateEnd


                      },
                      chart: {
                          container: 'timeDateTraffic',
                          type: 'COLUMN',
                          options: {
                              width: '80%',
                              chartArea: {left:20},
                              hAxis: {
                                format: 'MMM d h',
                                gridlines: {
                                  count: -1
                                }
                              },
                              vAxis: {
                                format: 'decimal',
                                gridlines: {
                                  color: '#777',
                                  count: 4
                                },
                                textPosition: 'out',
                                textStyle: {fontSize: 12}
                              }
                          }
                      }
                  });

                  if (reporter != 'none'){
                      hourlyMetrics.set({query: {filters: 'ga:dimension1=@' + reporter}});
                  }

                  if (typeof storyHed != 'undefined'){
                      hourlyMetrics.set({query: {filters: 'ga:dimension2=@' + storyHed}});
                  }

                  s = $('div.DateRangeSelector div.DateRangeSelector-item:last-child input').attr('min');
                  e = $('div.DateRangeSelector div.DateRangeSelector-item:first-child input').attr('max');
                  sd = new Date(s);
                  ed = new Date(e);
                  d = ed - sd;

                  if (d > 86400000){
                      hourlyMetrics.set({query: {dimensions: 'ga:day'}});
                  } else {
                      hourlyMetrics.set({query: {dimensions: 'ga:dateHour'}});
                      hourlyMetrics.set({chart: {options: {hAxis:{format: 'd hh'}}}});
                  }

                  hourlyMetrics.execute();

                  hourlyMetrics.on('success', function(response){
                      console.log(response.chart);
                      console.log(response.data);
                    });
              }



              $( 'input[name=monthMetric]' ).change(function(){
                var metricMonthPicked = $( 'input[name=monthMetric]:checked' ).val();
                var sortMonthMetric = '-' + metricMonthPicked;
                monthlyMetrics.set({query: {metrics: metricMonthPicked}});
                monthlyMetrics.execute();
            });




          function thirtyDayTotals(reporter, storyHed){
              var monthlyMetrics = new gapi.analytics.googleCharts.DataChart({
                      query: {
                        ids: 'ga:60921314',
                          metrics: 'ga:uniquePageviews',
                          dimensions: 'ga:date', 'start-date': '30daysAgo', 'end-date': 'today'
                      },
                      chart: {
                          container: 'monthlyChart',
                          type: 'COLUMN',
                          options: {
                              width: '80%',
                              chartArea: {left:20, top:10, width: '80%', height: '80%'},
                              title: 'Unique Page Views',
                              hAxis: {
                                format: 'MMM dd y',
                                gridlines: {
                                  count: -1
                                }
                              }
                          }
                      }
                 });

              if (reporter != 'none'){
                  monthlyMetrics.set({query: {filters: 'ga:dimension1=@' + reporter}});
              }

              if (typeof storyHed != 'undefined'){
                      monthlyMetrics.set({query: {filters: 'ga:dimension2=@' + storyHed}});
                  }

              monthlyMetrics.execute();
          }

                  articleTraffic(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                referalDetail(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);
                thirtyDayTotals(dashNS.userFilter)
                trafficByDayHour(dashNS.dateRange['start-date'], dashNS.dateRange['end-date'], dashNS.userFilter);

        })/*end ready function for GAPI*/

        var loadingIcon = '<i class="fa fa-cog fa-spin fa-5x fa-fw"></i>'


        var toHHMMSS = function (seconds) {
                var sec = Math.round(seconds)
                var sec_num = parseInt(sec, 10); // don't forget the second param
                var hours   = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds = sec_num - (hours * 3600) - (minutes * 60);

                if (hours   < 10) {hours   = "0"+hours;}
                if (minutes < 10) {minutes = "0"+minutes;}
                if (seconds < 10) {seconds = "0"+seconds;}
                return hours+':'+minutes+':'+seconds;
            };
