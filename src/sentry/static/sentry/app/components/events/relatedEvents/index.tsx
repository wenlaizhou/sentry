import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';
import uniqBy from 'lodash/uniqBy';
import {capitalize} from 'lodash';

import space from 'app/styles/space';
import {t, tct} from 'app/locale';
import DateTime from 'app/components/dateTime';
import {Organization, Event, GlobalSelection} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import LoadingIndicator from 'app/components/loadingIndicator';
import {transactionSummaryRouteWithQuery} from 'app/views/performance/transactionSummary/utils';
import EventDataSection from 'app/components/events/eventDataSection';
import {PanelTable, PanelItem} from 'app/components/panels';
import PlatformIcon from 'app/components/platformIcon';
import Link from 'app/components/links/link';
import Button from 'app/components/button';
import DiscoverQuery, {TableDataRow} from 'app/utils/discover/discoverQuery';
import Tooltip from 'app/components/tooltip';
import {generateEventSlug, eventDetailsRouteWithEventView} from 'app/utils/discover/urls';
import {DEFAULT_RELATIVE_PERIODS} from 'app/constants';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import TimeSince from 'app/components/timeSince';
import {IconClock, IconFire, IconSpan} from 'app/icons';

enum CURRENT_LOCATION {
  DISCOVER = 'discover',
  ISSUES = 'issues',
  PERFORMANCE = 'performance',
}

enum EVENT_TYPE {
  ERROR = 'error',
  TRANSACTION = 'transaction',
}

type Props = {
  organization: Organization;
  event: Event;
  location: Location;
  selection: GlobalSelection;
};

// List events that have the same tracing ID as the current Event
const RelatedEvents = ({organization, location, event, selection}: Props) => {
  const orgSlug = organization.slug;
  const orgFeatures = new Set(organization.features);

  const getCurrentLocation = () => {
    const pathname = location.pathname.split('/');
    switch (pathname[3]) {
      case 'discover':
        return CURRENT_LOCATION.DISCOVER;
      case 'issues':
        return CURRENT_LOCATION.ISSUES;
      default:
        return CURRENT_LOCATION.PERFORMANCE;
    }
  };

  const getEventView = () => {
    // traceId should always be defined
    const traceId = event.contexts?.trace?.trace_id;

    return EventView.fromSavedQuery({
      id: undefined,
      name: `Events with Trace ID ${traceId}`,
      fields: [
        'title',
        'event.type',
        'project',
        'project.id',
        'trace.span',
        'timestamp',
        'lastSeen',
        'issue',
      ],
      orderby: '-timestamp',
      query: `trace:${traceId}`,
      projects: orgFeatures.has('global-views') ? [-1] : [Number(event.projectID)],
      version: 2,
      range: '90d',
    });
  };

  const getTransactionLink = (projectId: string, transationName: string) => {
    return transactionSummaryRouteWithQuery({
      orgSlug,
      transaction: transationName,
      projectID: projectId,
      query: {
        statsPeriod: '90d',
      },
    });
  };

  const getEventTarget = (
    dataRow: TableDataRow,
    eventView: EventView,
    currentLocation: CURRENT_LOCATION
  ) => {
    if (currentLocation === CURRENT_LOCATION.DISCOVER) {
      const eventSlug = generateEventSlug(dataRow);

      return eventDetailsRouteWithEventView({
        orgSlug,
        eventSlug,
        eventView,
      });
    }

    return dataRow['event.type'] === 'error'
      ? `/organizations/${orgSlug}/issues/${dataRow['issue.id']}/`
      : getTransactionLink(String(dataRow['project.id']), String(dataRow.title));
  };

  const renderEventId = (
    dataRow: TableDataRow,
    eventView: EventView,
    currentLocation: CURRENT_LOCATION
  ) => {
    return (
      <Tooltip title={t('View Event')}>
        <StyledLink to={getEventTarget(dataRow, eventView, currentLocation)}>
          {dataRow.id as React.ReactNode}
        </StyledLink>
      </Tooltip>
    );
  };

  const renderActions = (eventView: EventView, currentLocation: CURRENT_LOCATION) => {
    if (
      !orgFeatures.has('discover-basic') ||
      currentLocation === CURRENT_LOCATION.DISCOVER
    ) {
      return undefined;
    }

    const discoverURL = eventView.getResultsViewUrlTarget(orgSlug);

    return (
      <Button size="small" to={discoverURL}>
        {t('Open in Discover')}
      </Button>
    );
  };

  const renderEmptyMessage = () => {
    const {
      datetime: {period},
    } = selection;

    const selectedTimePeriod = period && DEFAULT_RELATIVE_PERIODS[period];
    const displayedPeriod = selectedTimePeriod
      ? selectedTimePeriod.toLowerCase()
      : t('given timeframe');

    return tct('No related events have been found for the [timePeriod].', {
      timePeriod: displayedPeriod,
    });
  };

  const renderIcon = (type: EVENT_TYPE) => {
    if (type === EVENT_TYPE.ERROR) {
      return <IconFire color="red400" />;
    }
    return <IconSpan color="pink400" />;
  };

  const eventView = getEventView();
  const currentLocation = getCurrentLocation();

  return (
    <DiscoverQuery location={location} eventView={eventView} orgSlug={orgSlug}>
      {({isLoading, tableData}) => {
        if (isLoading) {
          return <LoadingIndicator />;
        }

        const data = uniqBy(tableData?.data, 'id').filter(evt => evt.id !== event.id);

        if (!data.length) {
          return null;
        }

        return (
          <EventDataSection
            type="related-events"
            title={t('Related Events')}
            actions={renderActions(eventView, currentLocation)}
          >
            <PanelTable
              emptyMessage={renderEmptyMessage()}
              headers={[t('Id'), t('Title'), t('Type'), t('Project'), t('Created')]}
            >
              {data.map((row, index) => {
                const {id, title, project, timestamp} = row;

                const eventType = row['event.type'] as EVENT_TYPE;
                const panelItemProps = {
                  isLast: index === data.length - 1,
                };

                return (
                  <React.Fragment key={id}>
                    <StyledPanelItem {...panelItemProps}>
                      {renderEventId(row, eventView, currentLocation)}
                    </StyledPanelItem>
                    <StyledPanelItem {...panelItemProps}>{title}</StyledPanelItem>
                    <StyledPanelItem {...panelItemProps}>
                      <TypeWrapper>
                        {renderIcon(eventType)}
                        {capitalize(eventType)}
                      </TypeWrapper>
                    </StyledPanelItem>
                    <StyledPanelItem {...panelItemProps}>
                      <StyledPlatformIcon platform={String(project)} size="16px" />
                      {project}
                    </StyledPanelItem>
                    <StyledPanelItem {...panelItemProps}>
                      <TimeWrapper>
                        <IconClock size="16px" />
                        <StyledTimeSince date={timestamp} />
                        <div>{'-'}</div>
                        <DateTime date={timestamp} />
                      </TimeWrapper>
                    </StyledPanelItem>
                  </React.Fragment>
                );
              })}
            </PanelTable>
          </EventDataSection>
        );
      }}
    </DiscoverQuery>
  );
};

export default withGlobalSelection(RelatedEvents);

const StyledPanelItem = styled(PanelItem)<{isLast: boolean}>`
  padding: ${space(1)} ${space(2)};
  font-size: ${p => p.theme.fontSizeMedium};
  align-items: center;
  ${p => p.isLast && `border-bottom: none`};
`;

const StyledPlatformIcon = styled(PlatformIcon)`
  border-radius: ${p => p.theme.borderRadius};
  box-shadow: 0 0 0 1px ${p => p.theme.white};
  margin-right: ${space(1)};
`;

const StyledTimeSince = styled(TimeSince)`
  color: #2f2936;
`;

const StyledLink = styled(Link)`
  > div {
    display: inline;
  }
`;

const TimeWrapper = styled('div')`
  display: grid;
  grid-template-columns: max-content max-content max-content max-content;
  grid-gap: ${space(1)};
  align-items: center;
  color: ${p => p.theme.gray500};
`;

const TypeWrapper = styled('div')`
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: ${space(1)};
  align-items: center;
`;
