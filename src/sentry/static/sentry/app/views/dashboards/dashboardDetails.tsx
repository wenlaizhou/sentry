import React from 'react';
import {WithRouterProps} from 'react-router';

import {t} from 'app/locale';
import {Organization, Release} from 'app/types';
import withOrganization from 'app/utils/withOrganization';
import AsyncView from 'app/views/asyncView';

import Dashboard from './dashboard';
import overviewDashboard from './data/dashboards/overviewDashboard';

type Props = WithRouterProps<{orgId: string; id: string}, {}> & {
  organization: Organization;
};

type State = AsyncView['state'] & {
  releases: Release[];
};

class DashboardDetails extends AsyncView<Props, State> {
  getEndpoints(): Array<[string, string, any?, any?]> {
    return [['releases', `/organizations/${this.props.params.orgId}/releases/`]];
  }

  getTitle() {
    return t('Dashboard - %s', this.props.params.orgId);
  }

  renderLoading() {
    // We don't want a loading state
    return this.renderBody();
  }

  renderBody() {
    // Passing the rest of `this.props` to `<Dashboard>` for tests
    const {router, ...props} = this.props;

    return (
      <Dashboard
        releases={this.state.releases}
        releasesLoading={this.state.loading}
        router={router}
        {...overviewDashboard}
        {...props}
      />
    );
  }
}

export default withOrganization(DashboardDetails);
