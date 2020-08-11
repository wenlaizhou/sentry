import React from 'react';
import {Location} from 'history';
import uniqBy from 'lodash/uniqBy';
import styled from '@emotion/styled';

import {t, tct} from 'app/locale';
import {Organization, GlobalSelection, Event} from 'app/types';
import EventView from 'app/utils/discover/eventView';
import EmptyStateWarning from 'app/components/emptyStateWarning';
import {Panel} from 'app/components/panels';
import DiscoverQuery, {TableDataRow} from 'app/utils/discover/discoverQuery';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';
import {DEFAULT_RELATIVE_PERIODS} from 'app/constants';
import LoadingIndicator from 'app/components/loadingIndicator';
import EventDataSection from 'app/components/events/eventDataSection';
import Button from 'app/components/button';
import {IconTelescope} from 'app/icons';
import space from 'app/styles/space';

import Content, {CURRENT_LOCATION} from './content';

export type RelatedEventsProps = {
  location: Location;
  event?: Event;
  relatedEvents?: Array<TableDataRow>;
  eventView?: EventView;
};

type Props = {
  organization: Organization;
  selection: GlobalSelection;
} & RelatedEventsProps;

type State = {
  relatedEvents: Array<TableDataRow>;
  isLoading: boolean;
  orgFeatures: Set<string>;
  orgSlug: string;
  eventView?: EventView;
};

class RelatedEvents extends React.Component<Props, State> {
  state: State = {
    relatedEvents: this.props.relatedEvents ?? [],
    eventView: this.props.eventView,
    isLoading: true,
    orgFeatures: new Set(this.props.organization.slug),
    orgSlug: this.props.organization.slug,
  };

  componentDidMount() {
    this.getEventView();
  }

  getEventView = () => {
    const {event, organization} = this.props;

    if (this.props.eventView || !event) {
      this.setState({isLoading: false});
      return;
    }

    // traceId should always be defined
    const traceId = event.contexts?.trace?.trace_id;
    const orgFeatures = new Set(organization.features);

    const eventFromSavedQuery = EventView.fromSavedQuery({
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

    this.setState({eventView: eventFromSavedQuery, isLoading: false});
  };

  getCurrentLocation = () => {
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

  renderEmptyMessage = () => {
    const {
      selection: {
        datetime: {period},
      },
    } = this.props;

    const selectedTimePeriod = period && DEFAULT_RELATIVE_PERIODS[period];

    const displayedPeriod = selectedTimePeriod
      ? selectedTimePeriod.toLowerCase()
      : t('given timeframe');

    return (
      <Panel>
        <EmptyStateWarning small>
          {tct('No related events have been found for the [timePeriod].', {
            timePeriod: displayedPeriod,
          })}
        </EmptyStateWarning>
      </Panel>
    );
  };

  renderOpenInDiscoverButton = (
    eventView: EventView,
    currentLocation: CURRENT_LOCATION
  ) => {
    const {orgFeatures, orgSlug} = this.state;

    if (
      !orgFeatures.has('discover-basic') ||
      currentLocation === CURRENT_LOCATION.DISCOVER
    ) {
      return undefined;
    }

    const discoverURL = eventView.getResultsViewUrlTarget(orgSlug);

    return (
      <Button size="small" to={discoverURL} icon={<IconTelescope size="xs" />}>
        {t('Open in Discover')}
      </Button>
    );
  };

  render() {
    const {relatedEvents, location, event, organization} = this.props;
    const {isLoading, eventView} = this.state;

    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (!eventView) {
      return this.renderEmptyMessage();
    }

    const currentLocation = this.getCurrentLocation();
    const discoverButton = this.renderOpenInDiscoverButton(eventView, currentLocation);

    if (!relatedEvents?.length && event) {
      return (
        <EventDataSection
          type="related-events"
          title={t('Related Events')}
          actions={discoverButton}
        >
          <DiscoverQuery
            location={location}
            eventView={eventView}
            orgSlug={organization.slug}
          >
            {discoverData => {
              if (discoverData.isLoading) {
                return <LoadingIndicator />;
              }

              const events = uniqBy(discoverData.tableData?.data, 'id').filter(
                evt => evt.id !== event?.id
              );

              return (
                <Content
                  relatedEvents={events}
                  eventView={eventView}
                  currentLocation={currentLocation}
                  isEventDataSection
                />
              );
            }}
          </DiscoverQuery>
        </EventDataSection>
      );
    }

    return (
      <React.Fragment>
        <Action>{discoverButton}</Action>
        <Content
          relatedEvents={relatedEvents}
          eventView={eventView}
          currentLocation={currentLocation}
        />
      </React.Fragment>
    );
  }
}

export default withOrganization(withGlobalSelection(RelatedEvents));

const Action = styled('div')`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${space(2)};
`;
