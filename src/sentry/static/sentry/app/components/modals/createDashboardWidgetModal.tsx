import React from 'react';
import {withRouter} from 'react-router';
import {WithRouterProps} from 'react-router/lib/withRouter';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {
  Organization,
  Dashboard,
  DashboardWidget,
  NewDashboardWidget,
  SavedQuery,
  GlobalSelection,
} from 'app/types';
import {t} from 'app/locale';
import {fetchSavedQueries} from 'app/actionCreators/discoverSavedQueries';
import {createDashboardWidget} from 'app/actionCreators/dashboards';
import Form from 'app/views/settings/components/forms/form';
import FormModel from 'app/views/settings/components/forms/model';
import {Panel, PanelHeader, PanelBody} from 'app/components/panels';
import Placeholder from 'app/components/placeholder';
import TextField from 'app/views/settings/components/forms/textField';
import SelectField from 'app/views/settings/components/forms/selectField';
import {ModalRenderProps} from 'app/actionCreators/modal';
import withApi from 'app/utils/withApi';
import withGlobalSelection from 'app/utils/withGlobalSelection';
import {Client} from 'app/api';
import {WIDGET_DISPLAY} from 'app/views/dashboards/constants';
import WidgetChart from 'app/views/dashboards/widgetChart';
import WidgetTable from 'app/views/dashboards/widgetTable';

type Props = ModalRenderProps &
  WithRouterProps & {
    api: Client;
    organization: Organization;
    dashboard: Dashboard;
    selection: GlobalSelection;
    onAddWidget: (data: DashboardWidget) => void;
  };

type State = {
  selectedQuery: SavedQuery | undefined;
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

  handleSubmit = async (data: any, onSubmitSuccess, onSubmitError) => {
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
      const resp = await createDashboardWidget(
        api,
        organization.slug,
        dashboard.id,
        widget
      );
      onSubmitSuccess(resp);
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

  getVisualizationComponent(model) {
    switch (model.displayType) {
      case WIDGET_DISPLAY.TABLE:
        return WidgetTable;
      case WIDGET_DISPLAY.AREA_CHART:
      case WIDGET_DISPLAY.LINE_CHART:
      default:
        return WidgetChart;
    }
  }

  renderPreview(model: FormModel) {
    const {selectedQuery} = this.state;
    if (!selectedQuery) {
      return <Placeholder height="200px" />;
    }
    const {organization, router, selection} = this.props;
    const Visualization = this.getVisualizationComponent(model);
    const modelData = model.getTransformedData();
    const fakeWidget = {
      id: 0,
      title: modelData.title,
      displayType: modelData.displayType,
      displayOptions: {
        yAxis: modelData.yAxis || ['count()'],
      },
      savedQuery: selectedQuery,
      order: 0,
      dateCreated: '',
      createdBy: undefined,
    };

    return (
      <Visualization
        widget={fakeWidget}
        router={router}
        releases={[]}
        organization={organization}
        selection={selection}
      />
    );
  }

  renderQueryBasedInputs() {
    const {selectedQuery} = this.state;
    if (!selectedQuery) {
      return null;
    }
    const axisOptions =
      selectedQuery !== undefined
        ? selectedQuery.fields.filter(item => item.includes('('))
        : [];
    if (axisOptions.length === 0) {
      axisOptions.push('count()');
    }

    return (
      <Panel>
        <PanelHeader>{t('Configure Widget')}</PanelHeader>
        <PanelBody>
          <TextField
            key={selectedQuery.name}
            name="title"
            label={t('Title')}
            required
            defaultValue={selectedQuery.name}
          />
          <SelectField
            deprecatedSelectControl
            required
            choices={axisOptions}
            name="yAxis"
            label={t('Display Series')}
            multiple
          />
          <SelectField
            deprecatedSelectControl
            required
            options={DISPLAY_TYPE_CHOICES.slice()}
            name="displayType"
            label={t('Chart Style')}
          />
        </PanelBody>
      </Panel>
    );
  }

  render() {
    const {Body, Header, closeModal} = this.props;
    const {selectedQuery} = this.state;

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
            submitDisabled={selectedQuery === undefined}
          >
            {({model}) => (
              <React.Fragment>
                <Panel>
                  <PanelHeader>{t('Preview')}</PanelHeader>
                  <PanelBody>{this.renderPreview(model)}</PanelBody>
                </Panel>
                <Panel>
                  <PanelHeader>{t('Choose a discover query')}</PanelHeader>
                  <PanelBody>
                    <SelectField
                      deprecatedSelectControl
                      async
                      autoload
                      autofocus
                      required
                      choices={[]}
                      defaultOptions
                      loadOptions={this.handleLoadOptions}
                      onChange={this.handleSavedQueryChange}
                      name="savedQuery"
                      label={t('Query')}
                      value={selectedQuery !== undefined ? selectedQuery.id : undefined}
                      cache={false}
                      onSelectResetsInput={false}
                      onCloseResetsInput={false}
                      onBlurResetsInput={false}
                    />
                  </PanelBody>
                </Panel>
                {selectedQuery && this.renderQueryBasedInputs()}
              </React.Fragment>
            )}
          </Form>
        </Body>
      </React.Fragment>
    );
  }
}

export default withApi(withGlobalSelection(withRouter(CreateDashboardWidgetModal)));
