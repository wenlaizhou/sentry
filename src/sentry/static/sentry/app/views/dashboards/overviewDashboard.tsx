import React from 'react';
import {WithRouterProps} from 'react-router';
import styled from '@emotion/styled';

import {t} from 'app/locale';
import {Dashboard, Organization} from 'app/types';
import {openCreateDashboardModal} from 'app/actionCreators/modal';
import {PageHeader} from 'app/styles/organization';
import PageHeading from 'app/components/pageHeading';
import EmptyStateWarning from 'app/components/emptyStateWarning';
import Button from 'app/components/button';
import {IconAdd} from 'app/icons';
import Link from 'app/components/links/link';
import {PanelTable} from 'app/components/panels';
import UserAvatar from 'app/components/avatar/userAvatar';
import TimeSince from 'app/components/timeSince';
import AsyncView from 'app/views/asyncView';
import withOrganization from 'app/utils/withOrganization';
import {userDisplayName} from 'app/utils/formatters';
import space from 'app/styles/space';

type Props = WithRouterProps<{orgId: string}, {}> & {
  organization: Organization;
};

type State = AsyncView['state'] & {
  dashboards: Dashboard[];
};

class OverviewDashboard extends AsyncView<Props, State> {
  getEndpoints(): Array<[string, string, any?, any?]> {
    const {organization} = this.props;
    return [['dashboards', `/organizations/${organization.slug}/dashboards/`]];
  }

  getTitle() {
    const {organization} = this.props;
    return t('Dashboards - %s', organization.slug);
  }

  handleCreateDashboard = () => {
    const {organization} = this.props;
    openCreateDashboardModal({organization});
  };

  renderComponent() {
    const {organization} = this.props;
    const {dashboards, loading} = this.state;

    if (dashboards !== null && dashboards.length === 0) {
      return (
        <React.Fragment>
          <PageHeader>
            <PageHeading withMargins>{t('Dashboards')}</PageHeading>
          </PageHeader>
          <EmptyStateWarning>
            <p>{t('You have no dashboards')}</p>
            <Button
              icon={<IconAdd isCircled />}
              priority="primary"
              onClick={this.handleCreateDashboard}
            >
              {t('Create a Dashboard')}
            </Button>
          </EmptyStateWarning>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <PageHeader>
          <PageHeading withMargins>{t('Dashboards')}</PageHeading>
          <Button
            icon={<IconAdd isCircled />}
            priority="primary"
            size="small"
            onClick={this.handleCreateDashboard}
          >
            {t('New Dashboard')}
          </Button>
        </PageHeader>

        <PanelTable isLoading={loading} headers={[t('Title'), t('Date Added')]}>
          {dashboards &&
            dashboards.map(dashboard => (
              <React.Fragment key={dashboard.id}>
                <span>
                  <StyledUserAvatar
                    hasTooltip
                    tooltip={`Created by ${userDisplayName(dashboard.createdBy)}`}
                    user={dashboard.createdBy}
                  />
                  <Link
                    to={`/organizations/${organization.slug}/dashboards/${dashboard.id}/`}
                  >
                    {dashboard.title}
                  </Link>
                </span>
                <span>
                  <TimeSince date={dashboard.dateCreated} />
                </span>
              </React.Fragment>
            ))}
        </PanelTable>
      </React.Fragment>
    );
  }
}

const StyledUserAvatar = styled(UserAvatar)`
  margin-right: ${space(0.5)};
`;

export default withOrganization(OverviewDashboard);
