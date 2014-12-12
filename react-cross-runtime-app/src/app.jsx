'use strict';

var React = require('react')

var App = React.createClass({
  rendern() {
    return <div>
      <h1>App</h1>
    </div>
  }
})

React.renderComponent(<App/>, document.body)