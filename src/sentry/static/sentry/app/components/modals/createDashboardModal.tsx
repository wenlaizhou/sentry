import React from 'react';
import {browserHistory} from 'react-router';

import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';
import {Organization} from 'app/types';
import {t} from 'app/locale';
import Form from 'app/views/settings/components/forms/form';
import TextField from 'app/views/settings/components/forms/textField';
import {ModalRenderProps} from 'app/actionCreators/modal';

type Props = ModalRenderProps & {
  location: Location;
  organization: Organization;
};

class CreateDashboardModal extends React.Component<Props> {
  handleSuccess = data => {
    const {closeModal, organization} = this.props;
    closeModal();
    addSuccessMessage(t('Created dashboard.'));
    browserHistory.push(`/organizations/${organization.slug}/dashboards/${data.id}/`);
  };

  handleError = () => {
    addErrorMessage(t('Failed to create dashboard.'));
  };

  render() {
    const {Body, Header, closeModal, organization} = this.props;

    return (
      <React.Fragment>
        <Header closeButton onHide={closeModal}>
          {t('Create Dashboard')}
        </Header>
        <Body>
          <Form
            apiMethod="POST"
            apiEndpoint={`/organizations/${organization.slug}/dashboards/`}
            submitLabel={t('Create')}
            onSubmitSuccess={this.handleSuccess}
            onSubmitError={this.handleError}
          >
            <TextField autoFocus name="title" label={t('Title')} required />
          </Form>
        </Body>
      </React.Fragment>
    );
  }
}

export default CreateDashboardModal;
