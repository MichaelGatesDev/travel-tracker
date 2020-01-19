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
          <Route exact path="/create" component={CreateSection} />
          <Route path="/" component={HomeSection} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
