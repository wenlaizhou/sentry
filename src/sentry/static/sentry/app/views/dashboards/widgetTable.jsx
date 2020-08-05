import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import SentryTypes from 'app/sentryTypes';
import EventView from 'app/utils/discover/eventView';
import DiscoverQuery from 'app/utils/discover/discoverQuery';
import withApi from 'app/utils/withApi';
import LoadingIndicator from 'app/components/loadingIndicator';
import {getFieldRenderer} from 'app/utils/discover/fieldRenderers';
import space from 'app/styles/space';

class WidgetTable extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    organization: SentryTypes.Organization,
    widget: SentryTypes.Widget,
    router: PropTypes.object,
    selection: SentryTypes.GlobalSelection,
  };

  renderRow(index, row, tableMeta, columns) {
    const {organization, router} = this.props;
    const {location} = router;

    return (
      <tr key={index}>
        {columns.map(column => {
          const field = String(column.key);

          const fieldRenderer = getFieldRenderer(field, tableMeta);
          const rendered = fieldRenderer(row, {organization, location});
          return <td key={`${index}:${field}`}>{rendered}</td>;
        })}
      </tr>
    );
  }

  render() {
    const {organization, api, widget, selection, router} = this.props;
    const eventView = EventView.fromSavedQuery({
      ...widget.savedQuery,
      // Copy current selection parameters in so dashboard
      // reflects global selection header.
      projects: selection.projects,
      environment: selection.environment,
      start: selection.datetime.start,
      end: selection.datetime.end,
      range: selection.datetime.period,
    });

    const columns = eventView.getColumns();

    return (
      <DiscoverQuery
        api={api}
        location={router.location}
        orgSlug={organization.slug}
        eventView={eventView}
      >
        {({isLoading, tableData, error}) => {
          if (error) {
            return <span>Big fail {error}</span>;
          }
          const data = isLoading ? [] : tableData.data;
          return (
            <TableWrapper>
              <ChartTable>
                <thead>
                  {columns.map(({key}, index) => (
                    <th key={index}>{key}</th>
                  ))}
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td>
                        <LoadingIndicator />
                      </td>
                    </tr>
                  )}
                  {data.map((row, index) =>
                    this.renderRow(index, row, tableData.meta, columns)
                  )}
                </tbody>
              </ChartTable>
            </TableWrapper>
          );
        }}
      </DiscoverQuery>
    );
  }
}
const TableWrapper = styled('div')`
  height: calc(100% - ${space(1)});
  overflow-y: scroll;
  margin: ${space(1)};
  margin-top: 0;
`;

const ChartTable = styled('table')`
  border-collapse: separate;
  position: relative;
  width: 100%;
  font-size: ${p => p.theme.fontSizeMedium};

  th {
    position: sticky;
    top: 0;
    color: ${p => p.theme.gray600};
    font-weight: normal;
    background: #fff;
  }
  th,
  td {
    padding: ${space(1)};
    border: 0;
    border-bottom: 1px solid ${p => p.theme.borderLight};
  }
  tr:last-child td {
    border-bottom: 0;
  }
`;

export default withApi(WidgetTable);
