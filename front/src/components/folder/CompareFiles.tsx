import React, { useState, useEffect } from 'react';
import ErrorModal from './ErrorModal.tsx';
import './CompareFiles.css';

const CompareFiles = () => {
  const [selectedFile1, setSelectedFile1] = useState(null);
  const [selectedFile2, setSelectedFile2] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedFiles, setFetchedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);


  const handleFileChange = (event, side) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedFile = files[0];
    const allowedTypes = ['mp3', 'flac', 'wav', 'alac'];

    if (!allowedTypes.includes(selectedFile.name.split('.').pop())) {
      setError('Unsupported file type. Please select a file with one of the following extensions: mp3, flac, wav, alac.');
      return;
    }

    // if (side === 'left') {
    //   setSelectedFile1(selectedFile);
    // } else if (side === 'right') {
    //   setSelectedFile2(selectedFile);
    // }
  };

  const handleSelectFile = (fileName, side) => {
    if (side === 'left') {
      setSelectedFile1(fileName);
    } else if (side === 'right') {
      setSelectedFile2(fileName);
    }
  };

  const compareFiles = async () => {
    try {
      console.log(selectedFile2)
      console.log(selectedFile1)
      setLoading(true);
      setComparisonResult(null);
      setError(null);
  
      const formData = new FormData();
      const fileData = {};
  
      if (selectedFile1 instanceof File) {
        formData.append('file1', selectedFile1);
      } else {
          fileData.file1 = selectedFile1;
      }

      if (selectedFile2 instanceof File) {
        formData.append('file2', selectedFile2);
      } else {
          fileData.file2 = selectedFile2;
      }
    
    // if (selectedFile2 instanceof File) {
    //   formData.append('file2', selectedFile2);
    //   } else {
    //       await new Promise((resolve, reject) => {
    //           const reader = new FileReader();
    //           reader.readAsDataURL(selectedFile2);
    //           reader.onload = function () {
    //               const base64Data = reader.result.split(',')[1];
    //               fileData.file2 = base64Data;
    //               resolve();
    //           };
    //           reader.onerror = function (error) {
    //               reject(error);
    //           };
    //   });
    //   }
    
    const response = await fetch(`http://localhost:5000/compare`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: formData.entries().length > 0 ? formData : JSON.stringify(fileData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('Comparison result:', data);
        setComparisonResult(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('An error occurred while comparing files');
    } finally {
      setLoading(false);
    }
  };

  const ComparisonResult = ({ data }) => {
    let hasDifferences = false;

  if (data.file1_result && data.file2_result) {
    const { metadata: metadata1 } = data.file1_result;
    const { metadata: metadata2 } = data.file2_result;

    if (metadata1 && metadata2) {
      if (
        metadata1.bitrate !== metadata2.bitrate ||
        metadata1.sample_rate !== metadata2.sample_rate ||
        metadata1.channels !== metadata2.channels
      ) {
        hasDifferences = true;
      }
    }
  }
    return (
      <div>
        <h3 className="file-selection-title">Comparison Result</h3>
        <div id="comparison-warning" className="z-50 flex w-1/3 items-center p-4 mb-4 text-black rounded-lg opacity-100 bg-gray-200 dark:bg-gray-800 dark:text-white" role="alert">
                  <svg className="flex-shrink-0 w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
                  </svg>
                  <span className="sr-only">Warning</span>
                  <div className="ms-3 text-sm font-medium">
                      Always be sure to compare the graphs
                  </div>
                  
              </div>
        {data.file2_result.metadata && data.file1_result.metadata && (
        <div className="compare-files-sections">
            <div className="compare-files-section">
                <div className="file-info">
                    <p>{data.file1_result.filename}</p>
                    <img className='file-graph' src={data.file1_result.image_url} alt={data.file1_result.filename} />
                    <div className="mt-2 meta-data">
                      <p>Bitrate: {data.file1_result.metadata.bitrate?.toString().slice(0,3)} kbps</p>
                      <p>Sample Rate: {data.file1_result.metadata?.sample_rate} Hz</p>
                      <p>Channels: {data.file1_result.metadata?.channels}</p>
                      <p>Artist: {data.file1_result.metadata?.artist}</p>
                      <p>Title: {data.file1_result.metadata?.title}</p>
                    </div>
                </div>
            </div>
            <div className="compare-files-section">
              <div className="file-info">
                      <p>{data.file2_result.filename}</p>
                      <img className='file-graph' src={data.file2_result.image_url} alt={data.file2_result.filename} />
                      <div className="mt-2 meta-data">
                        <p>Bitrate: {data.file2_result.metadata.bitrate?.toString().slice(0,3)} kbps</p>
                        <p>Sample Rate: {data.file2_result.metadata?.sample_rate} Hz</p>
                        <p>Channels: {data.file2_result.metadata?.channels}</p>
                        <p>Artist: {data.file2_result.metadata?.artist}</p>
                        <p>Title: {data.file2_result.metadata?.title}</p>
                      </div>
              </div>
            </div>
            
          </div>
  )}
          {hasDifferences && (
            <div className="comparison-messages">
              {data.file1_result.metadata.bitrate.toString().slice(0,3) > data.file2_result.metadata.bitrate.toString().slice(0,3) && (
              <div>
                  <p>The left item has a higher bitrate: 
                   <span className="better-option"> {data.file1_result.metadata.bitrate.toString().slice(0,3)} kbps</span> &gt; {data.file2_result.metadata.bitrate.toString().slice(0,3)} kbps</p>
              </div>
            )}
            {data.file1_result.metadata.sample_rate > data.file2_result.metadata.sample_rate && (
                <div>
                    <p>The left item has a higher sample rate: <span className="better-option">{data.file1_result.metadata.sample_rate} Hz</span> &gt; {data.file2_result.metadata.sample_rate} Hz</p>
                </div>
            )}
            {data.file1_result.metadata.channels > data.file2_result.metadata.channels && (
                <div>
                    <p>The left item has more channels: <span className="better-option">{data.file1_result.metadata.channels}</span> &gt; {data.file2_result.metadata.channels}</p>
                </div>
            )}
            {data.file1_result.metadata.channels < data.file2_result.metadata.channels && (
                <div>
                    <p>The right item has more channels: {data.file2_result.metadata.channels} &gt; <span className="better-option">{data.file1_result.metadata.channels}</span></p>
                </div>
            )}
            {['wav', 'alac', 'flac', 'm4a'].includes(data.file1_result.filename.split('.').pop()) && (
                <p>The left file might be lossless because of the format ({data.file1_result.filename.split('.').pop()}).</p>
            )}
            {['wav', 'alac', 'flac', 'm4a'].includes(data.file2_result.filename.split('.').pop()) && (
                <p>The right file might be lossless because of the format ({data.file2_result.filename.split('.').pop()}).</p>
            )}
          </div>
            )}
        </div>
    );
  };

  useEffect(() => {
    fetchData();
    const resultContainer = document.querySelector('.comparison-result-container');
    if (resultContainer) {
      if (comparisonResult) {
        resultContainer.classList.add('show');
      } else {
        resultContainer.classList.remove('show');
      }
    }
  }, [comparisonResult]);

  const fetchData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/conversion`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        setFetchedFiles([]);
      } else {
        setFetchedFiles(data.files);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchedFiles([]);
    }
  };
  

  return (
    <div className="compare-files-container">
      <h2 className="compare-files-title">Compare Files</h2>
      <h3 className="file-selection-title">Select Files for Comparison</h3>
      <div className="compare-files-sections">
        <div className="file-selection-section">
          {fetchedFiles.length > 0 ? (
            <ul className="file-list">
              {fetchedFiles.map((file, index) => (
                <li key={index} onClick={() => {setSelectedFile1(null); handleSelectFile(file, 'left')}}>
                  {file}
                </li>
              ))}
            </ul>
          ) : null}
          {selectedFile1 && <div className="selected-file">Selected File: {selectedFile1 && selectedFile1.name ? selectedFile1.name : selectedFile1}</div>}
          <input type="file" className="file-input-left" onChange={(e) => handleFileChange(e, 'left')} />
          <button className="select-button-1" onClick={() => {
                const fileInput = document.querySelector('.file-input-left');
                if (fileInput) {
                    fileInput.click();
                    fileInput.onchange = (event) => {
                        setSelectedFile1(null);
                        const selectedFile1 = event.target.files[0];
                        setSelectedFile1(selectedFile1);
                    };
                }
            }}>Select File for Comparison (Left)
          </button>
        </div>
        <div className="file-selection-section">
          {fetchedFiles.length > 0 ? (
            <ul className="file-list">
              {fetchedFiles.map((file, index) => (
                <li key={index} onClick={() => {setSelectedFile2(null); handleSelectFile(file, 'right')}}>
                {file}
                </li>
              ))}
            </ul>
          ) : null}
          {selectedFile2 && <div className="selected-file"> Selected File: {selectedFile2 && selectedFile2.name ? selectedFile2.name : selectedFile2}</div>}
          <input type="file" className="file-input-right" />
              <button className="select-button-2" onClick={() => {
                    const fileInput = document.querySelector('.file-input-right');
                    if (fileInput) {
                        fileInput.click();
                        fileInput.onchange = (event) => {
                            setSelectedFile2(null);
                            const selectedFile2 = event.target.files[0];
                            setSelectedFile2(selectedFile2);
                            console.log(selectedFile2)
                        };
                    }
                }}>Select File for Comparison (Right)
              </button>
        </div>
      </div>
      <div className="compare-files-actions">
        {selectedFile1 && selectedFile2 && (
          <button
            className="compare-button"
            onClick={compareFiles}
            disabled={loading}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        )}
        {error && <div className="error-message">Error: {error}</div>}
        {loading && <div className="loading-animation">Loading...</div>}
        {comparisonResult && (
          <div className="comparison-result-container fade-in">
            <ComparisonResult data={comparisonResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareFiles;