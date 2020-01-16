import React from 'react';
import './App.css';
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { HomeSection } from "./Sections/HomeSection";
import { CreateSection } from "./Sections/CreateSection";

const App: React.FC = () => {
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={HomeSection} />
          <Route exact path="/create" component={CreateSection} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
