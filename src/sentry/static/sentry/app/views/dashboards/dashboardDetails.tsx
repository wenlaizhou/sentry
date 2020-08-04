import React from 'react';
import {browserHistory, WithRouterProps} from 'react-router';

import {t} from 'app/locale';
import {Organization, Release, Dashboard} from 'app/types';
import AsyncView from 'app/views/asyncView';
import {deleteDashboard} from 'app/actionCreators/dashboards';
import Breadcrumbs from 'app/components/breadcrumbs';
import {PageHeader} from 'app/styles/organization';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {IconDelete, IconEdit, IconPlay, IconNot} from 'app/icons';
import {addSuccessMessage} from 'app/actionCreators/indicator';

import DashboardWidgets from './dashboardWidgets';

type Props = WithRouterProps<{orgId: string; id: string}, {}> & {
  organization: Organization;
};

type State = AsyncView['state'] & {
  isEditing: boolean;
  dashboard: Dashboard | null;
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

  getEndpoints(): Array<[string, string, any?, any?]> {
    const {params} = this.props;
    return [
      ['dashboard', `/organizations/${params.orgId}/dashboards/${params.id}/`],
      ['releases', `/organizations/${params.orgId}/releases/`],
    ];
  }

  getTitle() {
    const {params} = this.props;
    const {dashboard} = this.state;
    return t('Dashboard - %s', dashboard ? dashboard.title : params.orgId);
  }

  getCrumbs() {
    const {params} = this.props;
    const {dashboard} = this.state;

    return [
      {
        to: `/organizations/${params.orgId}/dashboards/`,
        label: t('Dashboards'),
      },
      {
        label: dashboard ? dashboard.title : '\u2016',
      },
    ];
  }

  renderBody() {
    const {router} = this.props;
    const {dashboard, isEditing, releases, loading} = this.state;

    return (
      <React.Fragment>
        <PageHeader>
          <Breadcrumbs crumbs={this.getCrumbs()} />
          <ButtonBar gap={1}>
            {isEditing ? (
              <React.Fragment>
                <Button
                  size="small"
                  onClick={this.handleCancel}
                  icon={<IconNot />}
                  title={t('Discard changes')}
                />
                <Button
                  priority="primary"
                  size="small"
                  onClick={this.handleSave}
                  icon={<IconPlay />}
                  title={t('Save changes')}
                />
              </React.Fragment>
            ) : (
              <Button
                size="small"
                onClick={this.handleEdit}
                icon={<IconEdit />}
                title={t('Edit this dashboard')}
              />
            )}
            <Button
              size="small"
              priority="danger"
              onClick={this.handleDelete}
              title={t('Delete this dashboard')}
              icon={<IconDelete />}
            />
          </ButtonBar>
        </PageHeader>
        <DashboardWidgets
          releases={releases}
          releasesLoading={loading}
          router={router}
          isEditing={isEditing}
          {...dashboard}
        />
      </React.Fragment>
    );
  }
}

export default DashboardDetails;
