import {Client} from 'app/api';
import {t} from 'app/locale';
import {Dashboard, DashboardWidget, NewDashboardWidget} from 'app/types';
import {addErrorMessage} from 'app/actionCreators/indicator';

export function deleteDashboard(api: Client, orgId: string, dashboardId: string) {
  const promise: Promise<void> = api.requestPromise(
    `/organizations/${orgId}/dashboards/${dashboardId}/`,
    {method: 'DELETE'}
  );

  promise.catch(() => {
    addErrorMessage(t('Unable to delete the dashboard'));
  });
  return promise;
}

export function createDashboardWidget(
  api: Client,
  orgId: string,
  dashboardId: string,
  widget: NewDashboardWidget
): Promise<DashboardWidget> {
  const promise = api.requestPromise(
    `/organizations/${orgId}/dashboards/${dashboardId}/widgets/`,
    {
      method: 'POST',
      data: widget,
    }
  );
  promise.catch(() => {
    addErrorMessage(t('Unable to add dashboard widget'));
  });
  return promise;
}

export function updateDashboard(
  api: Client,
  orgId: string,
  dashboard: Dashboard
): Promise<Dashboard> {
  const promise = api.requestPromise(
    `/organizations/${orgId}/dashboards/${dashboard.id}/`,
    {
      method: 'PUT',
      data: dashboard,
    }
  );
  promise.catch(() => {
    addErrorMessage(t('Unable to update dashboard.'));
  });
  return promise;
}

export function deleteDashboardWidget(
  api: Client,
  orgId: string,
  dashboardId: string,
  widgetId: string
) {
  const promise: Promise<void> = api.requestPromise(
    `/organizations/${orgId}/dashboards/${dashboardId}/widgets/${widgetId}/`,
    {method: 'DELETE'}
  );

  promise.catch(() => {
    addErrorMessage(t('Unable to delete the dashboard widget'));
  });
  return promise;
}
