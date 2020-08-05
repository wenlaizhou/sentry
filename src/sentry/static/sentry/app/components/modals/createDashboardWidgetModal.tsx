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
  savedQuery?: SavedQuery;
};

type SelectedValue = {
  label: string;
  value: string;
  query: SavedQuery;
  searchKey: string;
};

const DISPLAY_TYPE_CHOICES = [
  {label: t('Table'), value: 'table'},
  {label: t('Area chart'), value: 'area'},
  {label: t('Bar chart'), value: 'bar'},
  {label: t('Line chart'), value: 'line'},
];

class CreateDashboardWidgetModal extends React.Component<Props, State> {
  state: State = {
    savedQuery: undefined,
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

  handleLoadOptions = (inputValue: string) => {
    const {api, organization} = this.props;
    return new Promise((resolve, reject) => {
      fetchSavedQueries(api, organization.slug, inputValue)
        .then((queries: SavedQuery[]) => {
          const results = queries.map(query => ({
            label: query.name,
            value: query.id,
            query,
            test: 'yes',
          }));
          resolve({options: results});
        })
        .catch(reject);
    });
  };

  handleSavedQueryChange = (choice: SelectedValue, other) => {
    // TODO how do I get the selecte option and not just the ID here?
    // I don't really want to have to load the query again
    this.setState({savedQuery: choice.query});
  };

  render() {
    const {Body, Header, closeModal, organization, dashboard} = this.props;
    const {savedQuery} = this.state;

    const hasQuery = savedQuery !== undefined;
    const axisOptions =
      savedQuery !== undefined
        ? savedQuery.fields.filter(item => item.includes('('))
        : [];

    return (
      <React.Fragment>
        <Header closeButton onHide={closeModal}>
          {t('Add Widget')}
        </Header>
        <Body>
          <Form
            apiMethod="POST"
            apiEndpoint={`/organizations/${organization.slug}/dashboards/${dashboard.id}/widgets/`}
            submitLabel={t('Create')}
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
              value={savedQuery !== undefined ? savedQuery.id : undefined}
              cache={false}
              onSelectResetsInput={false}
              onCloseResetsInput={false}
              onBlurResetsInput={false}
            />
            <SelectField
              required
              disabled={!hasQuery}
              choices={axisOptions}
              name="displayOptions.yAxis"
              label={t('Display Series')}
              multiple
            />
            {/*
            <SelectField
              required
              disabled={!hasQuery}
              choices={DISPLAY_TYPE_CHOICES}
              name="displayType"
              label={t('Chart Style')}
            />
             */}
          </Form>
        </Body>
      </React.Fragment>
    );
  }
}

export default withApi(CreateDashboardWidgetModal);
