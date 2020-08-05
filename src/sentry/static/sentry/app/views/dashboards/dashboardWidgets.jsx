import PropTypes from 'prop-types';
import React from 'react';
import styled from '@emotion/styled';

import {IconAdd} from 'app/icons';
import SentryTypes from 'app/sentryTypes';
import {t} from 'app/locale';
import space from 'app/styles/space';

import Widget from './widget';

class DashboardWidgets extends React.Component {
  static propTypes = {
    releasesLoading: PropTypes.bool,
    releases: PropTypes.arrayOf(SentryTypes.Release),
    widgets: PropTypes.arrayOf(SentryTypes.Widget),
    router: PropTypes.object,
    isEditing: PropTypes.bool,
  };

  handleAdd = () => {
    alert('Add a widget!');
  };

  render() {
    const {isEditing, releasesLoading, router, releases, widgets} = this.props;

    return (
      <Widgets>
        {widgets.map((widget, i) => (
          <WidgetWrapper key={i}>
            <Widget
              releasesLoading={releasesLoading}
              releases={releases}
              widget={widget}
              router={router}
              isEditing={isEditing}
            />
          </WidgetWrapper>
        ))}
        {isEditing && (
          <WidgetWrapper key="add">
            <AddWidgetWrapper key="add" onClick={this.handleAdd}>
              <IconAdd size="xl" />
              {t('Add widget')}
            </AddWidgetWrapper>
          </WidgetWrapper>
        )}
      </Widgets>
    );
  }
}
export default DashboardWidgets;

const Widgets = styled('div')`
  display: flex;
  flex-wrap: wrap;
`;

const WidgetWrapper = styled('div')`
  width: 50%;
  :nth-child(odd) {
    padding-right: ${space(2)};
  }
`;

const AddWidgetWrapper = styled('a')`
  width: 100%;
  height: 250px;
  border: 1px solid ${p => p.theme.borderLight};
  border-radius: ${p => p.theme.borderRadius};
  display: flex;
  align-items: center;
  justify-content: center;

  > svg {
    margin-right: ${space(1)};
  }
`;
