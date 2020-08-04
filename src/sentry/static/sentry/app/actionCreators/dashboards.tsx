import {Client} from 'app/api';
import {t} from 'app/locale';
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
