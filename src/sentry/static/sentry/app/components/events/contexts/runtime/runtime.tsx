import React from 'react';

import ContextBlock from 'app/components/events/contexts/contextBlock';

import getRuntimeKnownData from './getRuntimeKnownData';
import {RuntimeData, RuntimeKnownDataType} from './types';
import getUnknownData from '../getUnknownData';

type Props = {
  data: RuntimeData;
};

const runTimerKnownDataValues = [RuntimeKnownDataType.NAME, RuntimeKnownDataType.VERSION];

const Runtime = ({data}: Props) => {
  return (
    <React.Fragment>
      <ContextBlock data={getRuntimeKnownData(data, runTimerKnownDataValues)} />
      <ContextBlock data={getUnknownData(data, runTimerKnownDataValues)} />
    </React.Fragment>
  );
};

export default Runtime;
