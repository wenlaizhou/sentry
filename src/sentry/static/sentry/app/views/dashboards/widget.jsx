import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';

import {Panel, PanelBody} from 'app/components/panels';
import {t} from 'app/locale';
import ErrorBoundary from 'app/components/errorBoundary';
import LoadingMask from 'app/components/loadingMask';
import SentryTypes from 'app/sentryTypes';
import space from 'app/styles/space';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';

import ExploreWidget from './exploreWidget';
import WidgetChart from './widgetChart';

class Widget extends React.Component {
  static propTypes = {
    api: PropTypes.object,
    releasesLoading: PropTypes.bool,
    releases: PropTypes.arrayOf(SentryTypes.Release),
    widget: SentryTypes.Widget,
    organization: SentryTypes.Organization,
    selection: SentryTypes.GlobalSelection,
    router: PropTypes.object,
  };

  render() {
    const {organization, router, widget, releases, selection} = this.props;
    const {title, savedQuery} = widget;

    return (
      <ErrorBoundary customComponent={<ErrorCard>{t('Error loading widget')}</ErrorCard>}>
        <WidgetWrapperForMask>
          <StyledPanel>
            <WidgetHeader>{title}</WidgetHeader>
            <StyledPanelBody>
              <WidgetChart
                widget={widget}
                router={router}
                releases={releases}
                organization={organization}
                selection={selection}
              />
            </StyledPanelBody>
            <WidgetFooter>
              <div />
              <ExploreWidget {...{widget, savedQuery, router, selection}} />
            </WidgetFooter>
          </StyledPanel>
        </WidgetWrapperForMask>
      </ErrorBoundary>
    );
  }
}

export default withOrganization(withGlobalSelection(Widget));
export {Widget};

const StyledPanel = styled(Panel)`
  margin-bottom: ${space(2)};
`;

const StyledPanelBody = styled(PanelBody)`
  height: 200px;
`;

const Placeholder = styled('div')`
  background-color: ${p => p.theme.gray100};
  height: 237px;
`;

const WidgetWrapperForMask = styled('div')`
  position: relative;
`;

const ErrorCard = styled(Placeholder)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${p => p.theme.alert.error.backgroundLight};
  border: 1px solid ${p => p.theme.alert.error.border};
  color: ${p => p.theme.alert.error.textLight};
  border-radius: ${p => p.theme.borderRadius};
  margin-bottom: ${space(2)};
`;

const WidgetHeader = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${space(1)} ${space(2)};
`;
const WidgetFooter = styled(WidgetHeader)`
  border-top: 1px solid ${p => p.theme.borderLight};
  padding: 0;
`;
