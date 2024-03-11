import React, { useState } from 'react';
import axios from 'axios';
import FolderExplorer from './FolderExplorer.tsx';

const CompareFiles = () => {
  const [selectedFile1, setSelectedFile1] = useState(null);
  const [selectedFile2, setSelectedFile2] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [graphUrl1, setGraphUrl1] = useState(null);
  const [graphUrl2, setGraphUrl2] = useState(null);
  const [isGenerating1, setIsGenerating1] = useState(false);
  const [isGenerating2, setIsGenerating2] = useState(false);
  const [metadata1, setMetadata1] = useState(null);
  const [metadata2, setMetadata2] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    setUploadedFiles(files);
  };

  const fetchMetadata = async (fileName) => {
    try {
      // Fetch metadata using the fetchData method from FolderExplorer
      // This will retrieve the metadata from the backend based on the file name
      const metadata = await FolderExplorer.fetchData(fileName);
      console.log('Fetched metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw new Error('An error occurred while fetching metadata');
    }
  };

  const handleSelectFile = async (fileName, side) => {
    try {
      // Fetch metadata
      const metadata = await fetchMetadata(fileName);

      // Start generating the graph
      if (side === 'left') {
        setIsGenerating1(true);
        setMetadata1(metadata);
      } else if (side === 'right') {
        setIsGenerating2(true);
        setMetadata2(metadata);
      }

      // Generate graph using the backend endpoint
      const response = await fetch('http://localhost:5000/files/graph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemName: fileName }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create graph');
      }

      const data = await response.json();
      if (side === 'left') {
        setGraphUrl1(data.image_url);
      } else if (side === 'right') {
        setGraphUrl2(data.image_url);
      }

      // Update loading state
      setIsGenerating1(false); // Assuming both sides use the same generating state
      setIsGenerating2(false);
    } catch (error) {
      // ... your existing error handling logic 
    }
  };

  const compareFiles = async () => {
    try {
      // Implement comparison logic using the metadata of selected files
      // This can involve passing metadata to the backend and getting comparison results
      // For demonstration, let's just log the metadata for now
      console.log('Metadata for file 1:', metadata1);
      console.log('Metadata for file 2:', metadata2);
    } catch (error) {
      setError('An error occurred while comparing files');
    }
  };

  return (
    <div>
      <h2>Compare Files</h2>
      <div>
        <div>
        <div>
            <h3>File 1</h3>
            <FolderExplorer onSelectFile={(fileName) => handleSelectFile(fileName, 'left')} />
            {selectedFile1 && <div>Selected File: {selectedFile1}</div>}
            {metadata1 && <div>Metadata: {JSON.stringify(metadata1)}</div>}
            {isGenerating1 && <div>Generating Graph...</div>} 
            {graphUrl1 && <img src={graphUrl1} alt="File 1 Graph" />} 
            </div>

            <div>
            <h3>File 2</h3>
            <FolderExplorer onSelectFile={(fileName) => handleSelectFile(fileName, 'right')} />
            {selectedFile2 && <div>Selected File: {selectedFile2}</div>}
            {metadata2 && <div>Metadata: {JSON.stringify(metadata2)}</div>}
            {isGenerating2 && <div>Generating Graph...</div>} 
            {graphUrl2 && <img src={graphUrl2} alt="File 2 Graph" />} 
        </div>
      </div>
      <div>
        <label>Upload Files:</label>
        <input type="file" multiple onChange={handleFileChange} />
      </div>
      <div>
        <button onClick={compareFiles}>Compare</button>
      </div>
      {error && <div>Error: {error}</div>}
    </div>
    </div>
  );
};

export default CompareFiles;
