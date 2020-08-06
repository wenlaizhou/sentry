import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';

import {Panel, PanelBody} from 'app/components/panels';
import {t} from 'app/locale';
import ErrorBoundary from 'app/components/errorBoundary';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {IconDelete} from 'app/icons';
import SentryTypes from 'app/sentryTypes';
import space from 'app/styles/space';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import withOrganization from 'app/utils/withOrganization';

import {WIDGET_DISPLAY} from './constants';
import ExploreWidget from './exploreWidget';
import WidgetChart from './widgetChart';
import WidgetTable from './widgetTable';

class Widget extends React.Component {
  static propTypes = {
    releases: PropTypes.arrayOf(SentryTypes.Release),
    widget: SentryTypes.Widget,
    organization: SentryTypes.Organization,
    selection: SentryTypes.GlobalSelection,
    router: PropTypes.object,
    isEditing: PropTypes.bool,
    onDelete: PropTypes.func,
  };

  getVisualizationComponent() {
    const {widget} = this.props;
    switch (widget.displayType) {
      case WIDGET_DISPLAY.TABLE:
        return WidgetTable;
      case WIDGET_DISPLAY.AREA_CHART:
      case WIDGET_DISPLAY.LINE_CHART:
      default:
        return WidgetChart;
    }
  }

  render() {
    const {
      isEditing,
      organization,
      router,
      widget,
      releases,
      selection,
      onDelete,
    } = this.props;
    const Visualization = this.getVisualizationComponent();

    return (
      <ErrorBoundary customComponent={<ErrorCard>{t('Error loading widget')}</ErrorCard>}>
        <WidgetWrapperForMask>
          <StyledPanel>
            <WidgetHeader>{widget.title}</WidgetHeader>
            {isEditing && <WidgetToolbar widget={widget} onDelete={onDelete} />}
            <StyledPanelBody>
              <Visualization
                widget={widget}
                router={router}
                releases={releases}
                organization={organization}
                selection={selection}
              />
            </StyledPanelBody>
            <WidgetFooter>
              <div />
              <ExploreWidget widget={widget} router={router} selection={selection} />
            </WidgetFooter>
          </StyledPanel>
        </WidgetWrapperForMask>
      </ErrorBoundary>
    );
  }
}

class WidgetToolbar extends React.Component {
  static propTypes = {
    onDelete: PropTypes.func,
    widget: SentryTypes.Widget,
  };

  handleDelete = () => {
    const {onDelete, widget} = this.props;
    onDelete(widget);
  };

  render() {
    return (
      <StyledButtonBar gap={1}>
        <Button
          size="xsmall"
          priority="danger"
          onClick={this.handleDelete}
          icon={<IconDelete size="xs" />}
          title={t('Delete this widget')}
        />
      </StyledButtonBar>
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
const StyledButtonBar = styled(ButtonBar)`
  position: absolute;
  z-index: ${p => p.theme.zIndex.header};
  top: 0;
  right: 0;
  padding: ${space(1)} ${space(2)};
  border-radius: ${p => p.theme.borderRadius};
  background: rgba(255, 255, 255, 0.4);
`;
