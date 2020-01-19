import React from 'react';
import './App.css';
import { Switch, Route, HashRouter } from "react-router-dom";
import { HomeSection } from "./Sections/HomeSection";
import { CreateSection } from "./Sections/CreateSection";

const App: React.FC = () => {
  return (
    <div className="App">
      <HashRouter basename='/'>
        <Switch>
          <Route exact path="/" component={HomeSection} />
          <Route exact path="/create" component={CreateSection} />
        </Switch>
      </HashRouter>
    </div>
  );
}

export default App;
