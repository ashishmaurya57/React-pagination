import React from 'react';
import './App.css';
import ArtworksTable from './components/ArtworksTable';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Artworks Table</h1>
      <ArtworksTable />
    </div>
  );
};

export default App;
