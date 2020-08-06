import React from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import {InjectedRouter} from 'react-router';

import {DashboardDetailed, Organization, Release, DashboardWidget} from 'app/types';
import {IconAdd, IconDelete, IconGrabbable} from 'app/icons';
import {
  UserSelectValues,
  setBodyUserSelect,
} from 'app/components/events/interfaces/spans/utils';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {t} from 'app/locale';
import space from 'app/styles/space';
import theme from 'app/utils/theme';
import {openAddDashboardWidgetModal} from 'app/actionCreators/modal';

import Widget from './widget';

type Props = {
  organization: Organization;
  dashboard: DashboardDetailed;
  releasesLoading: boolean;
  releases: Release[] | null;
  router: InjectedRouter;
  isEditing: boolean;
  onAddWidget: (widget: DashboardWidget) => void;
  onDeleteWidget: (widget: DashboardWidget) => void;
  onReorderWidget: (widgets: DashboardWidget[]) => void;
};

type State = {
  isDragging: boolean;
  draggingIndex: undefined | number;
  draggingTargetIndex: undefined | number;
  top: undefined | number;
  left: undefined | number;
};

enum PlaceholderPosition {
  BEFORE,
  AFTER,
}

const DRAG_CLASS = 'draggable-item';
const GRAB_HANDLE_FUDGE = Math.floor(475 / 2);

class DashboardWidgets extends React.Component<Props, State> {
  state: State = {
    draggingIndex: undefined,
    draggingTargetIndex: undefined,
    isDragging: false,
    top: undefined,
    left: undefined,
  };

  componentDidMount() {
    if (!this.portal) {
      const portal = document.createElement('div');

      portal.style.position = 'absolute';
      portal.style.top = '0';
      portal.style.left = '0';
      portal.style.zIndex = String(theme.zIndex.modal);

      this.portal = portal;

      document.body.appendChild(this.portal);
    }
  }

  componentWillUnmount() {
    if (this.portal) {
      document.body.removeChild(this.portal);
    }
    this.cleanUpListeners();
  }

  previousUserSelect: UserSelectValues | null = null;
  portal: HTMLElement | null = null;
  dragGhostRef = React.createRef<HTMLDivElement>();

  cleanUpListeners() {
    if (this.state.isDragging) {
      window.removeEventListener('mousemove', this.onDragMove);
      window.removeEventListener('mouseup', this.onDragEnd);
    }
  }

  startDrag(event: React.MouseEvent<HTMLButtonElement>, index: number) {
    const isDragging = this.state.isDragging;
    if (isDragging || event.type !== 'mousedown') {
      return;
    }

    // prevent the user from selecting things when dragging a column.
    this.previousUserSelect = setBodyUserSelect({
      userSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      webkitUserSelect: 'none',
    });

    // attach event listeners so that the mouse cursor can drag anywhere
    window.addEventListener('mousemove', this.onDragMove);
    window.addEventListener('mouseup', this.onDragEnd);

    this.setState({
      isDragging: true,
      draggingIndex: index,
      draggingTargetIndex: index,
      top: event.pageY,
      left: event.pageX,
    });
  }

  onDragMove = (event: MouseEvent) => {
    if (!this.state.isDragging || event.type !== 'mousemove') {
      return;
    }

    if (this.dragGhostRef.current) {
      // move the ghost box
      const ghostDOM = this.dragGhostRef.current;
      // Adjust so cursor is over the grab handle.
      ghostDOM.style.left = `${event.pageX - GRAB_HANDLE_FUDGE}px`;
      ghostDOM.style.top = `${event.pageY - 16}px`;
    }

    const dragItems = document.querySelectorAll(`.${DRAG_CLASS}`);

    // Find the item that the ghost is currently over.
    const targetIndex = Array.from(dragItems).findIndex(dragItem => {
      const rects = dragItem.getBoundingClientRect();
      const top = event.clientY;
      const left = event.clientX;

      const topStart = rects.top;
      const topEnd = rects.top + rects.height;

      const leftStart = rects.left;
      const leftEnd = rects.left + rects.width;

      return top >= topStart && top <= topEnd && left >= leftStart && left <= leftEnd;
    });

    if (targetIndex >= 0 && targetIndex !== this.state.draggingTargetIndex) {
      this.setState({draggingTargetIndex: targetIndex});
    }
  };

  onDragEnd = (event: MouseEvent) => {
    if (!this.state.isDragging || event.type !== 'mouseup') {
      return;
    }

    const sourceIndex = this.state.draggingIndex;
    const targetIndex = this.state.draggingTargetIndex;
    if (typeof sourceIndex !== 'number' || typeof targetIndex !== 'number') {
      return;
    }

    // remove listeners that were attached in startColumnDrag
    this.cleanUpListeners();

    // restore body user-select values
    if (this.previousUserSelect) {
      setBodyUserSelect(this.previousUserSelect);
      this.previousUserSelect = null;
    }

    // Reorder widgets and trigger change.
    const newWidgets = [...this.props.dashboard.widgets];
    const removed = newWidgets.splice(sourceIndex, 1);
    newWidgets.splice(targetIndex, 0, removed[0]);
    this.props.onReorderWidget(newWidgets);

    this.setState({
      isDragging: false,
      left: undefined,
      top: undefined,
      draggingIndex: undefined,
      draggingTargetIndex: undefined,
    });
  };

  renderGhost() {
    const index = this.state.draggingIndex;
    if (typeof index !== 'number' || !this.state.isDragging || !this.portal) {
      return null;
    }
    const top = Number(this.state.top) - GRAB_HANDLE_FUDGE;
    const left = Number(this.state.left) - GRAB_HANDLE_FUDGE;
    const widget = this.props.dashboard.widgets[index];

    const style = {
      top: `${top}px`,
      left: `${left}px`,
    };
    const ghost = (
      <Ghost ref={this.dragGhostRef} style={style}>
        {this.renderWidget(index, widget, true)}
      </Ghost>
    );

    return ReactDOM.createPortal(ghost, this.portal);
  }

  handleAdd = () => {
    const {organization, dashboard, onAddWidget} = this.props;
    openAddDashboardWidgetModal({
      organization,
      dashboard,
      onAddWidget,
    });
  };

  renderWidget(index: number, widget: DashboardWidget, isGhost: boolean = false) {
    const {isDragging, draggingTargetIndex, draggingIndex} = this.state;
    const {isEditing, releasesLoading, router, releases, onDeleteWidget} = this.props;

    let placeholder: React.ReactNode = null;
    // Add a placeholder above the target widget.
    if (isDragging && isGhost === false && draggingTargetIndex === index) {
      placeholder = (
        <DragPlaceholder key={`placeholder:${index}`} className={DRAG_CLASS} />
      );
    }

    // If the current row is the row in the drag ghost return the placeholder
    // or a hole if the placeholder is elsewhere.
    if (isDragging && isGhost === false && draggingIndex === index) {
      return placeholder;
    }

    const position =
      Number(draggingTargetIndex) <= Number(draggingIndex)
        ? PlaceholderPosition.BEFORE
        : PlaceholderPosition.AFTER;

    const key = `${widget.id}:${isGhost}`;

    return (
      <React.Fragment key={key}>
        {position === PlaceholderPosition.BEFORE && placeholder}
        <WidgetWrapper key={key} className={isGhost ? '' : DRAG_CLASS}>
          {isEditing && (
            <WidgetToolbar
              widget={widget}
              onDelete={onDeleteWidget}
              onDragStart={event => this.startDrag(event, index)}
            />
          )}
          <Widget
            releasesLoading={releasesLoading}
            releases={releases}
            widget={widget}
            router={router}
          />
        </WidgetWrapper>
        {position === PlaceholderPosition.AFTER && placeholder}
      </React.Fragment>
    );
  }

  render() {
    const {isEditing, dashboard} = this.props;

    return (
      <Widgets>
        {this.renderGhost()}
        {dashboard.widgets.map((widget, i) => this.renderWidget(i, widget))}
        {isEditing && (
          <WidgetWrapper key="add">
            <AddWidgetWrapper key="add" onClick={this.handleAdd}>
              <IconAdd size="xl" />
              {t('Add widget')}
            </AddWidgetWrapper>
          </WidgetWrapper>
        )}
      </Widgets>
    );
  }
}
export default DashboardWidgets;

type WidgetToolbarProps = {
  widget: DashboardWidget;
  onDragStart: (event: React.MouseEvent) => void;
  onDelete: (widget: DashboardWidget) => void;
};

class WidgetToolbar extends React.Component<WidgetToolbarProps> {
  handleDelete = () => {
    const {onDelete, widget} = this.props;
    onDelete(widget);
  };

  render() {
    const {onDragStart} = this.props;
    return (
      <React.Fragment>
        <StyledIconGrabbable size="md" onMouseDown={onDragStart} />
        <StyledButtonBar gap={1}>
          <Button
            size="xsmall"
            priority="danger"
            onClick={this.handleDelete}
            icon={<IconDelete size="xs" />}
            title={t('Delete this widget')}
          />
        </StyledButtonBar>
      </React.Fragment>
    );
  }
}

const Widgets = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: ${space(2)};
  grid-auto-flow: row;
`;

const WidgetWrapper = styled('div')`
  position: relative;
`;

const AddWidgetWrapper = styled('a')`
  width: 100%;
  height: 275px;
  border: 1px solid ${p => p.theme.borderLight};
  border-radius: ${p => p.theme.borderRadius};
  display: flex;
  align-items: center;
  justify-content: center;

  > svg {
    margin-right: ${space(1)};
  }
`;

const DragPlaceholder = styled('div')`
  border: 2px dashed ${p => p.theme.borderLight};
  border-radius: ${p => p.theme.borderRadius};
  height: 275px;
`;

const Ghost = styled('div')`
  background: ${p => p.theme.white};
  display: block;
  position: absolute;
  padding: ${space(0.5)};
  border-radius: ${p => p.theme.borderRadius};
  border: 1px solid ${p => p.theme.borderLight};
  width: 475px;
  height: 275px;
  opacity: 0.8;
  cursor: grabbing;

  & svg {
    cursor: grabbing;
  }
`;

const StyledButtonBar = styled(ButtonBar)`
  position: absolute;
  z-index: ${p => p.theme.zIndex.header};
  top: 0;
  right: 0;
  padding: ${space(1)} ${space(2)};
  border-radius: ${p => p.theme.borderRadius};
  background: rgba(255, 255, 255, 0.4);
`;
const StyledIconGrabbable = styled(IconGrabbable)`
  transform: rotate(90deg);
  cursor: grab;
  position: absolute;
  left: calc(50% - 8px);
  top: 8px;
  z-index: ${p => p.theme.zIndex.header};
`;
