import React from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';

import SentryTypes from 'app/sentryTypes';
import ErrorPanel from 'app/components/charts/errorPanel';
import EventsRequest from 'app/components/charts/eventsRequest';
import ChartZoom from 'app/components/charts/chartZoom';
import AreaChart from 'app/components/charts/areaChart';
import BarChart from 'app/components/charts/barChart';
import LineChart from 'app/components/charts/lineChart';
import MarkLine from 'app/components/charts/components/markLine';
import {getInterval} from 'app/components/charts/utils';
import TransparentLoadingMask from 'app/components/charts/transparentLoadingMask';
import {IconWarning} from 'app/icons';
import TransitionChart from 'app/components/charts/transitionChart';
import {tooltipFormatter, axisLabelFormatter} from 'app/utils/discover/charts';
import {t} from 'app/locale';
import {getUtcToLocalDateObject, getFormattedDate} from 'app/utils/dates';
import {escape} from 'app/utils';
import {formatVersion} from 'app/utils/formatters';
import theme from 'app/utils/theme';
import withApi from 'app/utils/withApi';

class WidgetChart extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    organization: SentryTypes.Organization,
    widget: SentryTypes.Widget,
    router: PropTypes.object,
    releases: PropTypes.arrayOf(SentryTypes.Release),
    selection: SentryTypes.GlobalSelection,
  };

  generateReleaseSeries() {
    const {organization, releases, router} = this.props;

    return [
      {
        seriesName: 'Releases',
        data: [],
        markLine: MarkLine({
          lineStyle: {
            normal: {
              color: theme.purple400,
              opacity: 0.3,
              type: 'solid',
            },
          },
          tooltip: {
            formatter: ({data}) => {
              // XXX using this.props here as this function does not get re-run
              // unless projects are changed. Using a closure variable would result
              // in stale values.
              const time = getFormattedDate(data.value, 'MMM D, YYYY LT', {
                local: !this.props.selection.datetime.utc,
              });
              const version = escape(formatVersion(data.name, true));
              return [
                '<div class="tooltip-series">',
                `<div><span class="tooltip-label"><strong>${t(
                  'Release'
                )}</strong></span> ${version}</div>`,
                '</div>',
                '<div class="tooltip-date">',
                time,
                '</div>',
                '</div>',
                '<div class="tooltip-arrow"></div>',
              ].join('');
            },
          },
          label: {
            show: false,
          },
          data: releases.map(release => ({
            xAxis: +new Date(release.dateCreated),
            name: formatVersion(release.version, true),
            value: formatVersion(release.version, true),
            onClick: () => {
              router.push({
                pathname: `/organizations/${organization.slug}/releases/${release.version}/`,
                query: new Set(organization.features).has('global-views')
                  ? undefined
                  : {project: router.location.query.project},
              });
            },
            label: {
              formatter: () => formatVersion(release.version, true),
            },
          })),
        }),
      },
    ];
  }

  render() {
    const {api, router, widget, selection, organization} = this.props;

    const start = selection.datetime.start
      ? getUtcToLocalDateObject(selection.datetime.start)
      : null;

    const end = selection.datetime.end
      ? getUtcToLocalDateObject(selection.datetime.end)
      : null;

    const yAxis = widget.displayOptions.yAxis || [widget.savedQuery.yAxis];

    // TODO Add top5 modes and fancy stuff like that.
    // Include previous only on relative dates (defaults to relative if no start and end)
    // const includePrevious = !disablePrevious && !start && !end;
    const includePrevious = false;

    // TODO add daily modes
    // const intervalVal = showDaily ? '1d' : interval || getInterval(selection, true);
    const intervalVal = getInterval(selection, true);

    // TODO make this work.
    const utc = false;
    const topEvents = undefined;
    const showDaily = false;

    // TODO consider moving this higher up the component tree.
    const releaseSeries = this.generateReleaseSeries();

    return (
      <ChartZoom
        router={router}
        period={selection.datetime.period}
        utc={utc}
        projects={selection.projects}
        environments={selection.environments}
      >
        {zoomRenderProps => (
          <EventsRequest
            api={api}
            organization={organization}
            period={selection.datetime.period}
            project={selection.projects}
            environment={selection.environments}
            start={start}
            end={end}
            interval={intervalVal}
            query={widget.savedQuery.query}
            currentSeriesName={yAxis[0]}
            includePrevious={includePrevious}
            yAxis={yAxis}
            field={widget.savedQuery.field}
            orderby={widget.savedQuery.orderby}
            topEvents={topEvents}
            confirmedQuery
          >
            {({errored, loading, reloading, results, timeseriesData}) => {
              if (errored) {
                return (
                  <ErrorPanel>
                    <IconWarning color="gray500" size="lg" />
                  </ErrorPanel>
                );
              }
              const seriesData = results ? results : timeseriesData;

              return (
                <TransitionChart loading={loading} reloading={reloading}>
                  <TransparentLoadingMask visible={reloading} />
                  <Chart
                    {...zoomRenderProps}
                    loading={loading}
                    reloading={reloading}
                    utc={utc}
                    showLegend
                    displayType={widget.displayType}
                    releaseSeries={releaseSeries || []}
                    timeseriesData={seriesData}
                    stacked={typeof topEvents === 'number' && topEvents > 0}
                    yAxis={yAxis}
                    showDaily={showDaily}
                  />
                </TransitionChart>
              );
            }}
          </EventsRequest>
        )}
      </ChartZoom>
    );
  }
}

class Chart extends React.Component {
  static propTypes = {
    loading: PropTypes.bool,
    reloading: PropTypes.bool,
    releaseSeries: PropTypes.array,
    zoomRenderProps: PropTypes.object,
    timeseriesData: PropTypes.array,
    showLegend: PropTypes.bool,
    showDaily: PropTypes.bool,
    displayType: PropTypes.string,
    yAxis: PropTypes.arrayOf(PropTypes.string),
  };

  state = {
    forceUpdate: false,
  };

  shouldComponentUpdate(nextProps) {
    if (nextProps.reloading || !nextProps.timeseriesData) {
      return false;
    }

    if (
      isEqual(this.props.timeseriesData, nextProps.timeseriesData) &&
      isEqual(this.props.releaseSeries, nextProps.releaseSeries)
    ) {
      return false;
    }

    return true;
  }

  getChartComponent() {
    const {showDaily, displayType} = this.props;
    if (showDaily) {
      return BarChart;
    }
    switch (displayType) {
      case 'bar':
        return BarChart;
      case 'line':
        return LineChart;
      case 'area':
      default:
        return AreaChart;
    }
  }

  render() {
    const {
      loading: _loading,
      reloading: _reloading,
      yAxis,
      releaseSeries,
      zoomRenderProps,
      timeseriesData,
      showLegend,
      ...props
    } = this.props;

    const data = yAxis.slice();
    if (Array.isArray(releaseSeries)) {
      data.push(t('Releases'));
    }

    const legend = showLegend && {
      right: 16,
      top: 0,
      icon: 'circle',
      itemHeight: 8,
      itemWidth: 8,
      itemGap: 12,
      align: 'left',
      textStyle: {
        verticalAlign: 'top',
        fontSize: 11,
        fontFamily: 'Rubik',
      },
      data,
    };

    const chartOptions = {
      colors: theme.charts.getColorPalette(timeseriesData.length - 2),
      grid: {
        left: '24px',
        right: '24px',
        top: '10px',
        bottom: '12px',
      },
      seriesOptions: {
        showSymbol: false,
      },
      tooltip: {
        truncate: 80,
        valueFormatter: value => tooltipFormatter(value, yAxis),
      },
      yAxis: {
        axisLabel: {
          color: theme.gray400,
          formatter: value => axisLabelFormatter(value, yAxis),
        },
      },
    };

    const Component = this.getChartComponent();
    const series = Array.isArray(releaseSeries)
      ? [...timeseriesData, ...releaseSeries]
      : timeseriesData;
    console.log(series);

    return (
      <Component
        {...props}
        {...zoomRenderProps}
        {...chartOptions}
        legend={legend}
        onLegendSelectChanged={this.handleLegendSelectChanged}
        series={series}
        previousPeriod={null}
      />
    );
  }
}

export default withApi(WidgetChart);
