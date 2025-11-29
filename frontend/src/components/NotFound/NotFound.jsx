import React from 'react';
import Elm from '../../utils/ReactElm';
import * as ElmNotFound from '../NotFound.elm';

export default class Main extends React.PureComponent {
  render() {
    return <Elm src={ElmNotFound} />;
  }
}
