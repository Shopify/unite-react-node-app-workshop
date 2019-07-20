import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter} from 'react-router-dom';
import App from '../app/App';

console.log('hello from the client');

ReactDOM.hydrate(<BrowserRouter><App /></BrowserRouter>, document.getElementById('app'));