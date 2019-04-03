import React from 'react';

import ReactDOM from 'react-dom';

import App from '../App';
import {BrowserRouter} from 'react-router-dom';

console.log('hello from the client');

ReactDOM.hydrate(<BrowserRouter><App /></BrowserRouter>, document.getElementById('app'));