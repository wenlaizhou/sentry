import React from 'react';

import RelatedEvents, {RelatedEventsProps} from 'app/components/events/relatedEvents';

type Props = Required<Omit<RelatedEventsProps, 'event'>>;

const GroupRelatedEvents = ({eventView, location, relatedEvents}: Props) => (
  <RelatedEvents
    eventView={eventView}
    location={location}
    relatedEvents={relatedEvents}
  />
);

export default GroupRelatedEvents;
