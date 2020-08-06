import React from 'react';

import Input from 'app/views/settings/components/forms/controls/input';

type InputProps = React.HTMLProps<HTMLInputElement> & {
  className?: string;
  onUpdate: (value: string) => void;
  value: string;
};
type InputState = {value: string};

/**
 * Because controlled inputs fire onChange on every key stroke,
 * we can't update the QueryField that often as it would re-render
 * the input elements causing focus to be lost.
 *
 * Using a buffered input lets us throttle rendering and enforce data
 * constraints better.
 */
class BufferedInput extends React.Component<InputProps, InputState> {
  constructor(props: InputProps) {
    super(props);
    this.input = React.createRef();
  }

  state = {
    value: this.props.value,
  };

  private input: React.RefObject<HTMLInputElement>;

  get isValid() {
    if (!this.input.current) {
      return true;
    }
    return this.input.current.validity.valid;
  }

  handleBlur = () => {
    if (this.isValid) {
      this.props.onUpdate(this.state.value);
    } else {
      this.setState({value: this.props.value});
    }
  };

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.isValid) {
      this.setState({value: event.target.value});
    }
  };

  render() {
    const {onUpdate: _, ...props} = this.props;
    return (
      <Input
        {...props}
        ref={this.input}
        className="form-control"
        value={this.state.value}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
      />
    );
  }
}

export default BufferedInput;
