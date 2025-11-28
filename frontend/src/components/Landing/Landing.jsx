import React from 'react';
import Elm from '../../utils/ReactElm';
import * as ElmLanding from '../Landing.elm';

export default class Main extends React.Component {
  render() {
    return <Elm src={ElmLanding} />;
  }
}
