import React from 'react';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import SentryTypes from 'app/sentryTypes';
import space from 'app/styles/space';
import withOrganization from 'app/utils/withOrganization';
import Button from 'app/components/button';
import {IconChevron} from 'app/icons';
import {getDiscover2UrlPathFromDiscoverQuery} from 'app/views/dashboards/utils/getDiscoverUrlPathFromDiscoverQuery';

class ExploreWidget extends React.Component {
  static propTypes = {
    widget: SentryTypes.Widget,
    organization: SentryTypes.Organization,
    selection: SentryTypes.GlobalSelection,
  };

  getExportToDiscover(query) {
    const {selection, organization} = this.props;
    return getDiscover2UrlPathFromDiscoverQuery({organization, selection, query});
  }

  render() {
    const {widget} = this.props;

    return (
      <ExploreButton
        borderless
        size="zero"
        to={this.getExportToDiscover(widget.savedQuery)}
      >
        {t('Explore Data')}
        <Chevron direction="right" size="xs" />
      </ExploreButton>
    );
  }
}
export default withOrganization(ExploreWidget);

const ExploreButton = styled(Button)`
  position: relative;
  color: ${p => p.theme.gray500};
  padding: ${space(1)} ${space(2)};
  border-radius: 0 0 ${p => p.theme.borderRadius} 0;

  &:hover {
    color: ${p => p.theme.purple400};
  }
`;

const Chevron = styled(IconChevron)`
  margin-left: ${space(0.25)};
`;
