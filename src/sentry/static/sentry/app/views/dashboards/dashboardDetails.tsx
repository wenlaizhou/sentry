import React from 'react';
import {browserHistory, WithRouterProps} from 'react-router';

import {t} from 'app/locale';
import {Organization, Release, DashboardDetailed, DashboardWidget} from 'app/types';
import AsyncView from 'app/views/asyncView';
import {deleteDashboard} from 'app/actionCreators/dashboards';
import Breadcrumbs from 'app/components/breadcrumbs';
import {PageHeader} from 'app/styles/organization';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {IconDelete, IconEdit} from 'app/icons';
import {addSuccessMessage} from 'app/actionCreators/indicator';
import withOrganization from 'app/utils/withOrganization';

import DashboardWidgets from './dashboardWidgets';

type Props = WithRouterProps<{orgId: string; id: string}, {}> & {
  organization: Organization;
};

type State = AsyncView['state'] & {
  isEditing: boolean;
  dashboard: DashboardDetailed | null;
  releases: Release[] | null;
};

class DashboardDetails extends AsyncView<Props, State> {
  handleEdit = () => {
    this.setState({isEditing: !this.state.isEditing});
  };

  handleSave = () => {
    this.setState({isEditing: !!this.state.isEditing});
    alert('Should save now!');
  };

  handleDelete = () => {
    const {params} = this.props;

    deleteDashboard(this.api, params.orgId, params.id).then(() => {
      addSuccessMessage(t('Dashboard deleted.'));
      browserHistory.push(`/organizations/${params.orgId}/dashboards/`);
    });
  };

  handleCancel = () => {
    this.setState({isEditing: false});
  };

  handleAddWidget = (widget: DashboardWidget) => {
    const {dashboard} = this.state;
    if (!dashboard) {
      return;
    }
    this.setState({dashboard: {...dashboard, widgets: [...dashboard.widgets, widget]}});
  };

  getEndpoints(): Array<[string, string, any?, any?]> {
    const {organization, params} = this.props;
    return [
      ['dashboard', `/organizations/${organization.slug}/dashboards/${params.id}/`],
      ['releases', `/organizations/${organization.slug}/releases/`],
    ];
  }

  getTitle() {
    const {params} = this.props;
    const {dashboard} = this.state;
    return t('Dashboard - %s', dashboard ? dashboard.title : params.orgId);
  }

  getCrumbs() {
    const {organization} = this.props;
    const {dashboard} = this.state;

    return [
      {
        to: `/organizations/${organization.slug}/dashboards/`,
        label: t('Dashboards'),
      },
      {
        label: dashboard ? dashboard.title : '\u2016',
      },
    ];
  }

  renderBody() {
    const {router, organization} = this.props;
    const {dashboard, isEditing, releases, loading} = this.state;

    return (
      <React.Fragment>
        <PageHeader>
          <Breadcrumbs crumbs={this.getCrumbs()} />
          <ButtonBar gap={1}>
            {isEditing ? (
              <React.Fragment>
                <Button size="small" onClick={this.handleCancel}>
                  {t('Cancel')}
                </Button>
                <Button priority="primary" size="small" onClick={this.handleSave}>
                  {t('Save changes')}
                </Button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Button
                  size="small"
                  onClick={this.handleEdit}
                  icon={<IconEdit />}
                  title={t('Edit this dashboard')}
                />
                <Button
                  size="small"
                  priority="danger"
                  onClick={this.handleDelete}
                  title={t('Delete this dashboard')}
                  icon={<IconDelete />}
                />
              </React.Fragment>
            )}
          </ButtonBar>
        </PageHeader>
        <DashboardWidgets
          organization={organization}
          releases={releases}
          releasesLoading={loading}
          router={router}
          dashboard={dashboard}
          isEditing={isEditing}
          onAddWidget={this.handleAddWidget}
        />
      </React.Fragment>
    );
  }
}

export default withOrganization(DashboardDetails);
