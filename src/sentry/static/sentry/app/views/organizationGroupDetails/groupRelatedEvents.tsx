import React from 'react';

import RelatedEvents, {RelatedEventsProps} from 'app/components/events/relatedEvents';

type Props = Required<RelatedEventsProps>;

const GroupRelatedEvents = (props: Props) => <RelatedEvents {...props} />;

export default GroupRelatedEvents;
