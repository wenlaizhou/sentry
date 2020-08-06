import React from 'react';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {Organization, Dashboard, DashboardWidget, SavedQuery} from 'app/types';
import {t} from 'app/locale';
import {fetchSavedQueries} from 'app/actionCreators/discoverSavedQueries';
import Form from 'app/views/settings/components/forms/form';
import TextField from 'app/views/settings/components/forms/textField';
import SelectField from 'app/views/settings/components/forms/selectField';
import {ModalRenderProps} from 'app/actionCreators/modal';
import withApi from 'app/utils/withApi';
import {Client} from 'app/api';

type Props = ModalRenderProps & {
  api: Client;
  organization: Organization;
  dashboard: Dashboard;
  onAddWidget: (data: DashboardWidget) => void;
};

type State = {
  selectedQuery?: SavedQuery;
  savedQueries: SavedQuery[];
};

const DISPLAY_TYPE_CHOICES = [
  {label: t('Table'), value: 'table'},
  {label: t('Area chart'), value: 'area'},
  {label: t('Bar chart'), value: 'bar'},
  {label: t('Line chart'), value: 'line'},
];

class CreateDashboardWidgetModal extends React.Component<Props, State> {
  state: State = {
    selectedQuery: undefined,
    savedQueries: [],
  };

  handleSuccess = (data: object) => {
    const {closeModal, onAddWidget} = this.props;
    onAddWidget(data as DashboardWidget);
    closeModal();
    addSuccessMessage(t('Added widget.'));
  };

  handleError = () => {
    addErrorMessage(t('Failed to add widget.'));
  };

  handleSubmit = (data: any, onSubmitSuccess, onSubmitError) => {
    const {api, dashboard, organization} = this.props;
    try {
      const widget = {
        title: data.title,
        savedQuery: data.savedQuery,
        displayType: data.displayType,
        displayOptions: {
          yAxis: data.yAxis,
        },
      };
      // Not sure why, but I'm not getting a response back here?
      const resp = api.requestPromise(
        `/organizations/${organization.slug}/dashboards/${dashboard.id}/widgets/`,
        {
          method: 'POST',
          data: widget,
        }
      );
      // Temporary hack
      widget.savedQuery = this.state.selectedQuery;

      onSubmitSuccess(widget);
    } catch (e) {
      onSubmitError(e);
    }
  };

  handleLoadOptions = (inputValue: string) => {
    const {api, organization} = this.props;
    return new Promise((resolve, reject) => {
      fetchSavedQueries(api, organization.slug, inputValue)
        .then((queries: SavedQuery[]) => {
          const results = queries.map(query => ({
            label: query.name,
            value: query.id,
          }));
          this.setState({savedQueries: queries});
          resolve({options: results});
        })
        .catch(reject);
    });
  };

  handleSavedQueryChange = (choice: string) => {
    const selected = this.state.savedQueries.find(item => item.id === choice);
    this.setState({selectedQuery: selected});
  };

  render() {
    const {Body, Header, closeModal} = this.props;
    const {selectedQuery} = this.state;

    const hasQuery = selectedQuery !== undefined;
    const axisOptions =
      selectedQuery !== undefined
        ? selectedQuery.fields.filter(item => item.includes('('))
        : [];

    return (
      <React.Fragment>
        <Header closeButton onHide={closeModal}>
          {t('Add Widget')}
        </Header>
        <Body>
          <Form
            submitLabel={t('Create')}
            onSubmit={this.handleSubmit}
            onSubmitSuccess={this.handleSuccess}
            onSubmitError={this.handleError}
          >
            <TextField autoFocus name="title" label={t('Title')} required />
            <SelectField
              deprecatedSelectControl
              async
              autoload
              required
              choices={[]}
              defaultOptions
              loadOptions={this.handleLoadOptions}
              onChange={this.handleSavedQueryChange}
              name="savedQuery"
              label={t('Saved Query')}
              value={selectedQuery !== undefined ? selectedQuery.id : undefined}
              cache={false}
              onSelectResetsInput={false}
              onCloseResetsInput={false}
              onBlurResetsInput={false}
            />
            <SelectField
              deprecatedSelectControl
              required
              disabled={!hasQuery}
              choices={axisOptions}
              name="yAxis"
              label={t('Display Series')}
              multiple
            />
            <SelectField
              deprecatedSelectControl
              required
              disabled={!hasQuery}
              options={DISPLAY_TYPE_CHOICES.slice()}
              name="displayType"
              label={t('Chart Style')}
            />
          </Form>
        </Body>
      </React.Fragment>
    );
  }
}

export default withApi(CreateDashboardWidgetModal);
