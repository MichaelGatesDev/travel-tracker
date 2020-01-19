import React from 'react';
import { Link } from "react-router-dom";

export const HomeSection = () => {
  return (
    <section>

      <div>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/create">Create</Link></li>
        </ul>
      </div>


    </section>
  );
}
