// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom';


// Import main App component
import App from './components/App.jsx';

// Custom app styles
import './css/app.css';

ReactDOM.render(
  React.createElement(App),
  document.getElementById('app'),
);
