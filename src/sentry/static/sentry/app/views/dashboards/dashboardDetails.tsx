import React from 'react';
import {browserHistory, WithRouterProps} from 'react-router';

import {t} from 'app/locale';
import {Organization, Release, DashboardDetailed, DashboardWidget} from 'app/types';
import AsyncView from 'app/views/asyncView';
import {
  updateDashboard,
  deleteDashboard,
  deleteDashboardWidget,
} from 'app/actionCreators/dashboards';
import Breadcrumbs, {Crumb} from 'app/components/breadcrumbs';
import {PageHeader} from 'app/styles/organization';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {IconDelete, IconEdit} from 'app/icons';
import {addSuccessMessage} from 'app/actionCreators/indicator';
import withOrganization from 'app/utils/withOrganization';

import BufferedInput from './bufferedInput';
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

  handleDelete = () => {
    const {params} = this.props;

    deleteDashboard(this.api, params.orgId, params.id).then(() => {
      addSuccessMessage(t('Dashboard deleted.'));
      browserHistory.push(`/organizations/${params.orgId}/dashboards/`);
    });
  };

  handleUpdateTitle = async (title: string) => {
    const {organization} = this.props;
    const {dashboard} = this.state;
    if (!dashboard) {
      return;
    }
    // Remove widgets so they don't get reordered.
    const updated = {...dashboard, title, widgets: undefined};

    try {
      await updateDashboard(this.api, organization.slug, updated);
      addSuccessMessage(t('Dashboard renamed.'));
      this.setState({dashboard: {...dashboard, title}});
    } catch (e) {
      // Do nothing action creator handles indicator.
    }
  };

  handleAddWidget = (widget: DashboardWidget) => {
    const {dashboard} = this.state;
    if (!dashboard) {
      return;
    }
    this.setState({dashboard: {...dashboard, widgets: [...dashboard.widgets, widget]}});
  };

  handleDeleteWidget = async (widget: DashboardWidget) => {
    const {organization} = this.props;
    const {dashboard} = this.state;
    if (!dashboard) {
      return;
    }
    try {
      await deleteDashboardWidget(this.api, organization.slug, dashboard.id, widget.id);
      this.setState({
        dashboard: {
          ...dashboard,
          widgets: dashboard.widgets.filter(item => item.id !== widget.id),
        },
      });
    } catch (e) {
      // Do nothing, action creator shows a message.
    }
  };

  handleReorderWidgets = async (widgets: DashboardWidget[]) => {
    const {dashboard} = this.state;
    if (!dashboard) {
      return;
    }
    const {organization} = this.props;
    const reordered = widgets.map((item, i) => ({...item, order: i}));
    try {
      const updated: DashboardDetailed = {...dashboard, widgets: reordered};
      await updateDashboard(this.api, organization.slug, updated);
      this.setState({dashboard: updated});
    } catch (e) {
      // Do nothing action creator shows an indicator.
    }
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
    const {dashboard, isEditing} = this.state;

    const crumbs: Crumb[] = [
      {
        to: `/organizations/${organization.slug}/dashboards/`,
        label: t('Dashboards'),
      },
    ];
    if (isEditing && dashboard) {
      crumbs.push({
        label: (
          <BufferedInput
            type="text"
            name="title"
            value={dashboard.title}
            onUpdate={this.handleUpdateTitle}
          />
        ),
      });
    } else {
      crumbs.push({
        label: dashboard ? dashboard.title : '\u2016',
      });
    }
    return crumbs;
  }

  renderBody() {
    const {router, organization} = this.props;
    const {dashboard, isEditing, releases, loading} = this.state;
    if (!dashboard) {
      return null;
    }

    return (
      <React.Fragment>
        <PageHeader>
          <Breadcrumbs crumbs={this.getCrumbs()} />
          <ButtonBar gap={1}>
            {isEditing ? (
              <React.Fragment>
                <Button
                  size="small"
                  priority="danger"
                  onClick={this.handleDelete}
                  title={t('Delete this dashboard')}
                  icon={<IconDelete />}
                />
                <Button priority="primary" size="small" onClick={this.handleEdit}>
                  {t('Done Editing')}
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
          onDeleteWidget={this.handleDeleteWidget}
          onReorderWidget={this.handleReorderWidgets}
        />
      </React.Fragment>
    );
  }
}

export default withOrganization(DashboardDetails);
